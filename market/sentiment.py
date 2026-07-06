# market/sentiment.py

from textblob import TextBlob

import numpy as np


class SentimentAnalyzer:

    def score(

        self,

        text,

    ):

        if not text:

            return 0

        return TextBlob(

            text

        ).sentiment.polarity

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

    def label(

        self,

        value,

    ):

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