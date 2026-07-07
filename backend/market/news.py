import html
import xml.etree.ElementTree as ET
from datetime import date, timedelta
from email.utils import parsedate_to_datetime

import pandas as pd
import requests


GOOGLE_NEWS_RSS_URL = "https://news.google.com/rss/search"
INDIAN_MARKETS = {"NSE", "BSE"}


def base_ticker(ticker):

    symbol = str(ticker).upper().strip()

    if symbol.endswith(".NS") or symbol.endswith(".BO"):

        return symbol.rsplit(".", 1)[0]

    return symbol


def finnhub_symbol_candidates(ticker):

    symbol = str(ticker).upper().strip()
    normalized = symbol.replace("-", ".")

    candidates = [normalized]

    if normalized.endswith(".NS") or normalized.endswith(".BO"):

        candidates.append(
            normalized.rsplit(".", 1)[0]
        )

    seen = set()

    return [
        candidate
        for candidate in candidates
        if not (candidate in seen or seen.add(candidate))
    ]


def google_news_query(ticker, company_name=None):

    ticker_name = base_ticker(ticker)
    company = str(company_name or "").strip()

    if not company or company.lower() == "unknown":

        company = ticker_name

    return (
        f'"{company}" ({ticker_name} OR NSE OR BSE OR stock OR shares)'
        " when:14d"
    )


class FinnhubNews:

    BASE_URL = "https://finnhub.io/api/v1/company-news"

    def __init__(self, api_key):

        self.api_key = api_key

    def is_configured(self):

        return bool(self.api_key)

    def get_news(

        self,

        ticker,

        start_date,

        end_date,

        limit=10,

    ):

        if not self.is_configured():

            return pd.DataFrame()

        for symbol in finnhub_symbol_candidates(ticker):

            params = {

                "symbol": symbol,

                "from": start_date,

                "to": end_date,

                "token": self.api_key,

            }

            try:

                response = requests.get(

                    self.BASE_URL,

                    params=params,

                    timeout=30,

                )

                response.raise_for_status()

            except requests.RequestException:

                continue

            news = response.json()[:limit]

            df = pd.DataFrame(news)

            if df.empty:

                continue

            df["ticker"] = ticker
            df["symbol"] = symbol
            df["provider"] = "Finnhub"

            if "datetime" in df.columns:

                df["published_at"] = pd.to_datetime(
                    df["datetime"],
                    unit="s",
                    errors="coerce",
                )

            keep = [
                "ticker",
                "symbol",
                "provider",
                "published_at",
                "headline",
                "summary",
                "source",
                "url",
            ]

            return df[
                [col for col in keep if col in df.columns]
            ]

        return pd.DataFrame()

    def headlines(

        self,

        ticker,

        start_date,

        end_date,

        limit=5,

    ):

        df = self.get_news(

            ticker,

            start_date,

            end_date,

            limit,

        )

        if df.empty:

            return []

        return df["headline"].tolist()


class GoogleNewsRss:

    def get_news(
        self,
        ticker,
        company_name=None,
        limit=10,
    ):

        query = google_news_query(
            ticker,
            company_name,
        )

        params = {
            "q": query,
            "hl": "en-IN",
            "gl": "IN",
            "ceid": "IN:en",
        }

        try:

            response = requests.get(
                GOOGLE_NEWS_RSS_URL,
                params=params,
                timeout=30,
            )
            response.raise_for_status()

        except requests.RequestException:

            return pd.DataFrame()

        try:

            root = ET.fromstring(response.content)

        except ET.ParseError:

            return pd.DataFrame()

        rows = []

        for item in root.findall("./channel/item")[:limit]:

            title = item.findtext("title") or ""
            link = item.findtext("link") or ""
            description = item.findtext("description") or ""
            source = item.findtext("source") or "Google News"
            published = item.findtext("pubDate")
            published_at = None

            if published:

                try:

                    published_at = parsedate_to_datetime(published)

                except (TypeError, ValueError):

                    published_at = None

            rows.append(
                {
                    "ticker": ticker,
                    "symbol": base_ticker(ticker),
                    "provider": "Google News RSS",
                    "published_at": published_at,
                    "headline": html.unescape(title),
                    "summary": html.unescape(description),
                    "source": source,
                    "url": link,
                }
            )

        return pd.DataFrame(rows)


def recent_portfolio_news(
    tickers,
    api_key=None,
    days=14,
    limit_per_ticker=3,
    market="US",
    company_names=None,
):

    finnhub = FinnhubNews(api_key)
    google_news = GoogleNewsRss()
    company_names = company_names or {}

    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    frames = []

    for ticker in tickers:

        news = finnhub.get_news(
            ticker=ticker,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            limit=limit_per_ticker,
        )

        if news.empty and market in INDIAN_MARKETS:

            news = google_news.get_news(
                ticker=ticker,
                company_name=company_names.get(ticker),
                limit=limit_per_ticker,
            )

        if not news.empty:

            frames.append(news)

    if not frames:

        return pd.DataFrame()

    result = pd.concat(
        frames,
        ignore_index=True,
    )

    if "url" in result.columns:

        result = result.drop_duplicates(
            subset=["ticker", "url"],
        )

    if "published_at" in result.columns:
        result["published_at"] = pd.to_datetime(
            result["published_at"],
            utc=True,
            errors="coerce",
        )
        result = result.sort_values(
            "published_at",
            ascending=False,
            na_position="last",
        )

    return result.reset_index(drop=True)
