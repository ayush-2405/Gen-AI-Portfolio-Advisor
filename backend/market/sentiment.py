from textblob import TextBlob

import numpy as np
import pandas as pd


class SentimentAnalyzer:

    FINANCIAL_POSITIVE = {
        "beat",
        "beats",
        "upgrade",
        "upgraded",
        "growth",
        "profit",
        "profits",
        "strong",
        "surge",
        "record",
        "optimistic",
        "outperform",
        "buyback",
        "dividend",
        "raises",
        "raised",
    }

    FINANCIAL_NEGATIVE = {
        "miss",
        "misses",
        "downgrade",
        "downgraded",
        "loss",
        "losses",
        "weak",
        "falls",
        "plunge",
        "lawsuit",
        "probe",
        "concern",
        "concerns",
        "cuts",
        "cut",
        "layoff",
        "debt",
        "warning",
    }

    def score(

        self,

        text,

    ):

        if not text:

            return 0.0

        text = str(text)
        blob_score = TextBlob(text).sentiment.polarity
        words = {
            token.strip(".,:;!?()[]{}\"'").lower()
            for token in text.split()
        }

        positive_hits = len(words & self.FINANCIAL_POSITIVE)
        negative_hits = len(words & self.FINANCIAL_NEGATIVE)
        lexicon_score = (positive_hits - negative_hits) * 0.08

        return float(
            np.clip(blob_score + lexicon_score, -1, 1)
        )

    def score_news(

        self,

        headlines,

    ):

        scores = [

            self.score(

                h

            )

            for h in headlines

        ]

        if len(scores) == 0:

            return np.nan

        return float(

            np.mean(

                scores

            )

        )

    def score_article(
        self,
        headline,
        summary=None,
    ):

        text = " ".join(
            part for part in [headline, summary]
            if part
        )

        return self.score(text)

    def analyze_news(
        self,
        news,
    ):

        if news is None or news.empty:

            return pd.DataFrame(), {
                "Average News Sentiment": np.nan,
                "News Sentiment Label": "Unavailable",
                "News Articles": 0,
            }

        scored = news.copy()

        scored["sentiment_score"] = scored.apply(
            lambda row: self.score_article(
                row.get("headline"),
                row.get("summary"),
            ),
            axis=1,
        )

        scored["sentiment_label"] = scored["sentiment_score"].apply(
            self.label
        )

        ticker_sentiment = scored.groupby("ticker")["sentiment_score"].mean()

        summary = {
            "Average News Sentiment": float(scored["sentiment_score"].mean()),
            "News Sentiment Label": self.label(scored["sentiment_score"].mean()),
            "News Articles": int(len(scored)),
            "Ticker Sentiment": ticker_sentiment.to_dict(),
        }

        return scored, summary

    def label(

        self,

        value,

    ):

        if value is None or np.isnan(value):

            return "Unavailable"

        if value >= 0.25:

            return "Very Positive"

        elif value >= 0.10:

            return "Positive"

        elif value <= -0.25:

            return "Very Negative"

        elif value <= -0.10:

            return "Negative"

        else:

            return "Neutral"
