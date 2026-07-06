import pandas as pd
import numpy as np

TRADING_DAYS = 252


def benchmark_returns(benchmark_prices):

    return benchmark_prices.pct_change().dropna()


def align_returns(
    portfolio_returns,
    benchmark_returns
):

    df = pd.concat(
        [
            portfolio_returns.rename("Portfolio"),
            benchmark_returns.rename("Benchmark")
        ],
        axis=1
    ).dropna()

    return df


def cumulative_comparison(df):

    cumulative = (

        1 + df

    ).cumprod()

    cumulative = cumulative - 1

    return cumulative


def excess_returns(
    portfolio_returns,
    benchmark_returns
):

    df = align_returns(
        portfolio_returns,
        benchmark_returns
    )

    return (

        df["Portfolio"]

        -

        df["Benchmark"]

    )


def alpha(
    portfolio_returns,
    benchmark_returns,
    beta,
    risk_free_rate=0.045
):

    rp = (

        (1 + portfolio_returns).prod()

        **

        (TRADING_DAYS / len(portfolio_returns))

    ) - 1

    rb = (

        (1 + benchmark_returns).prod()

        **

        (TRADING_DAYS / len(benchmark_returns))

    ) - 1

    expected = (

        risk_free_rate

        +

        beta

        *

        (

            rb

            -

            risk_free_rate

        )

    )

    return rp - expected


def upside_capture_ratio(
    portfolio_returns,
    benchmark_returns
):

    df = align_returns(
        portfolio_returns,
        benchmark_returns
    )

    upside = df[
        df["Benchmark"] > 0
    ]

    if len(upside) == 0:
        return np.nan

    return (

        upside["Portfolio"].mean()

        /

        upside["Benchmark"].mean()

    )


def downside_capture_ratio(
    portfolio_returns,
    benchmark_returns
):

    df = align_returns(
        portfolio_returns,
        benchmark_returns
    )

    downside = df[
        df["Benchmark"] < 0
    ]

    if len(downside) == 0:
        return np.nan

    return (

        downside["Portfolio"].mean()

        /

        downside["Benchmark"].mean()

    )


def benchmark_summary(
    portfolio_returns,
    benchmark_returns,
    beta
):

    return {

        "Alpha":

            alpha(
                portfolio_returns,
                benchmark_returns,
                beta
            ),

        "Upside Capture":

            upside_capture_ratio(
                portfolio_returns,
                benchmark_returns
            ),

        "Downside Capture":

            downside_capture_ratio(
                portfolio_returns,
                benchmark_returns
            )

    }