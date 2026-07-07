import numpy as np


def _score_range(value, low, high):

    if value is None or np.isnan(value):

        return 50.0

    score = (value - low) / (high - low) * 100

    return float(np.clip(score, 0, 100))


def _score_beta(beta):

    if beta is None or np.isnan(beta):

        return 50.0

    return float(np.clip(100 - abs(beta - 1) * 55, 0, 100))


def _score_drawdown(max_drawdown):

    if max_drawdown is None or np.isnan(max_drawdown):

        return 50.0

    drawdown = abs(max_drawdown)

    return float(np.clip(100 - drawdown / 0.50 * 100, 0, 100))


def _score_sentiment(sentiment_score):

    if sentiment_score is None or np.isnan(sentiment_score):

        return 50.0

    return float(np.clip((sentiment_score + 1) / 2 * 100, 0, 100))


def quality_label(score):

    if score >= 80:

        return "Strong"

    if score >= 65:

        return "Constructive"

    if score >= 50:

        return "Mixed"

    if score >= 35:

        return "Weak"

    return "High Risk"


def investment_quality_summary(
    performance,
    risk,
    diversification,
    news_sentiment=None,
):

    sentiment_score = np.nan

    if news_sentiment:

        sentiment_score = news_sentiment.get(
            "Average News Sentiment",
            np.nan,
        )

    components = {
        "Return": _score_range(
            performance.get("Annual Return"),
            -0.10,
            0.25,
        ),
        "Sharpe": _score_range(
            performance.get("Sharpe Ratio"),
            -0.5,
            2.0,
        ),
        "Drawdown": _score_drawdown(
            performance.get("Max Drawdown"),
        ),
        "Beta Stability": _score_beta(
            risk.get("Beta"),
        ),
        "Diversification": float(
            np.clip(
                diversification.get("Diversification Score", 50),
                0,
                100,
            )
        ),
        "News Sentiment": _score_sentiment(sentiment_score),
    }

    weights = {
        "Return": 0.20,
        "Sharpe": 0.20,
        "Drawdown": 0.15,
        "Beta Stability": 0.15,
        "Diversification": 0.20,
        "News Sentiment": 0.10,
    }

    score = sum(
        components[name] * weights[name]
        for name in components
    )

    return {
        "Investment Quality Score": float(score),
        "Investment Quality Label": quality_label(score),
        "Quality Components": components,
    }
