import numpy as np
import pandas as pd


TRADING_DAYS = 252


def asset_returns(price_df):

    return price_df.pct_change().dropna()


def portfolio_returns(
    returns,
    weights
):

    w = np.array(weights)

    return returns.dot(w)


def cumulative_returns(
    portfolio_returns
):

    return (

        1 + portfolio_returns

    ).cumprod() - 1


def annual_return(
    portfolio_returns
):

    cumulative = (

        1 + portfolio_returns

    ).prod()

    years = (

        len(portfolio_returns)

        / TRADING_DAYS

    )

    return (

        cumulative ** (1 / years)

    ) - 1


def annual_volatility(
    portfolio_returns
):

    return (

        portfolio_returns.std()

        * np.sqrt(TRADING_DAYS)

    )


def sharpe_ratio(
    portfolio_returns,
    risk_free_rate=0.045
):

    ann_return = annual_return(
        portfolio_returns
    )

    ann_vol = annual_volatility(
        portfolio_returns
    )

    return (

        ann_return - risk_free_rate

    ) / ann_vol


def sortino_ratio(
    portfolio_returns,
    risk_free_rate=0.045
):

    downside = portfolio_returns[
        portfolio_returns < 0
    ]

    downside_std = (

        downside.std()

        * np.sqrt(TRADING_DAYS)

    )

    ann_return = annual_return(
        portfolio_returns
    )

    return (

        ann_return - risk_free_rate

    ) / downside_std


def max_drawdown(
    cumulative_return_series
):

    wealth = (

        1 + cumulative_return_series

    )

    peaks = wealth.cummax()

    drawdowns = (

        wealth - peaks

    ) / peaks

    return drawdowns.min()


def calmar_ratio(
    portfolio_returns
):

    cumulative = cumulative_returns(
        portfolio_returns
    )

    mdd = abs(
        max_drawdown(cumulative)
    )

    ann = annual_return(
        portfolio_returns
    )

    return ann / mdd


def performance_summary(
    portfolio_returns
):

    cumulative = cumulative_returns(
        portfolio_returns
    )

    return {

        "Annual Return":

            annual_return(
                portfolio_returns
            ),

        "Annual Volatility":

            annual_volatility(
                portfolio_returns
            ),

        "Sharpe Ratio":

            sharpe_ratio(
                portfolio_returns
            ),

        "Sortino Ratio":

            sortino_ratio(
                portfolio_returns
            ),

        "Max Drawdown":

            max_drawdown(
                cumulative
            ),

        "Calmar Ratio":

            calmar_ratio(
                portfolio_returns
            )

    }