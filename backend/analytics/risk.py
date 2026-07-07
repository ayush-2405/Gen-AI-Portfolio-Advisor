import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

TRADING_DAYS = 252


def portfolio_volatility(returns, weights):

    cov = returns.cov() * TRADING_DAYS

    w = np.array(weights)

    return np.sqrt(
        w.T @ cov @ w
    )


def covariance_matrix(returns):

    return returns.cov() * TRADING_DAYS


def correlation_matrix(returns):

    return returns.corr()


def portfolio_beta(
    portfolio_returns,
    benchmark_returns,
):

    df = pd.concat(
        [
            portfolio_returns.rename("portfolio"),
            benchmark_returns.rename("benchmark"),
        ],
        axis=1,
    ).dropna()

    if len(df) < 10:
        return np.nan

    X = df["benchmark"].values.reshape(-1, 1)
    y = df["portfolio"].values

    model = LinearRegression()
    model.fit(X, y)

    return float(model.coef_[0])


def value_at_risk(
    portfolio_returns,
    confidence=0.95,
):

    return np.percentile(
        portfolio_returns,
        (1 - confidence) * 100,
    )


def conditional_value_at_risk(
    portfolio_returns,
    confidence=0.95,
):

    var = value_at_risk(
        portfolio_returns,
        confidence,
    )

    losses = portfolio_returns[
        portfolio_returns <= var
    ]

    if len(losses) == 0:
        return np.nan

    return losses.mean()


def tracking_error(
    portfolio_returns,
    benchmark_returns,
):

    active = (
        portfolio_returns
        - benchmark_returns
    ).dropna()

    return (
        active.std()
        * np.sqrt(TRADING_DAYS)
    )


def information_ratio(
    portfolio_returns,
    benchmark_returns,
):

    active = (
        portfolio_returns
        - benchmark_returns
    ).dropna()

    te = tracking_error(
        portfolio_returns,
        benchmark_returns,
    )

    if te == 0 or np.isnan(te):
        return np.nan

    return (
        active.mean()
        * TRADING_DAYS
    ) / te


def risk_score(
    beta,
    volatility,
    concentration,
):

    score = 0

    if beta > 1.2:
        score += 30
    elif beta > 1:
        score += 20
    else:
        score += 10

    if volatility > 0.30:
        score += 30
    elif volatility > 0.20:
        score += 20
    else:
        score += 10

    if concentration > 0.30:
        score += 40
    elif concentration > 0.20:
        score += 25
    else:
        score += 10

    return min(score, 100)


def risk_summary(
    portfolio_returns,
    benchmark_returns,
    weights,
):

    beta = portfolio_beta(
        portfolio_returns,
        benchmark_returns,
    )

    volatility = (
        portfolio_returns.std()
        * np.sqrt(TRADING_DAYS)
    )

    return {

        "Beta":
            beta,

        "Annual Volatility":
            volatility,

        "VaR (95%)":
            value_at_risk(portfolio_returns),

        "CVaR (95%)":
            conditional_value_at_risk(portfolio_returns),

        "Information Ratio":
            information_ratio(
                portfolio_returns,
                benchmark_returns,
            ),

    }