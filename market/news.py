# market/news.py

import requests
import pandas as pd


class FinnhubNews:

    BASE_URL = "https://finnhub.io/api/v1/company-news"

    def __init__(self, api_key):

        self.api_key = api_key

    def get_news(

        self,

        ticker,

        start_date,

        end_date,

        limit=10,

    ):

        params = {

            "symbol": ticker,

            "from": start_date,

            "to": end_date,

            "token": self.api_key,

        }

        response = requests.get(

            self.BASE_URL,

            params=params,

            timeout=30,

        )

        response.raise_for_status()

        news = response.json()[:limit]

        return pd.DataFrame(news)

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