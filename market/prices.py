import pandas as pd
import streamlit as st
import yfinance as yf

from markets import normalize_tickers


@st.cache_data(ttl=3600)
def download_prices(
    tickers,
    period="2y",
    interval="1d",
    market="US",
):

    tickers = normalize_tickers(
        tickers,
        market,
    )

    data = yf.download(
        tickers=tickers,
        period=period,
        interval=interval,
        auto_adjust=True,
        progress=False,
        group_by="column",
        threads=True,
    )

    if data.empty:
        raise ValueError(
            "Unable to download price data."
        )

    if isinstance(data.columns, pd.MultiIndex):

        if "Close" in data.columns.levels[0]:
            prices = data["Close"]
        elif "Adj Close" in data.columns.levels[0]:
            prices = data["Adj Close"]
        else:
            prices = data.xs(
                data.columns.levels[0][0],
                axis=1,
                level=0,
            )

    else:

        if "Close" in data.columns:
            prices = data[["Close"]]
            prices.columns = tickers

        elif "Adj Close" in data.columns:
            prices = data[["Adj Close"]]
            prices.columns = tickers

        else:
            prices = data

    prices = prices.ffill()

    prices = prices.dropna(
        axis=1,
        how="all",
    )

    if prices.empty:
        raise ValueError(
            "No valid tickers found."
        )

    return prices


@st.cache_data(ttl=3600)
def download_benchmark(
    benchmark,
    period="2y",
):

    data = yf.download(
        benchmark,
        period=period,
        auto_adjust=True,
        progress=False,
        threads=False,
    )

    if data.empty:
        raise ValueError(
            "Unable to download benchmark."
        )

    if isinstance(data.columns, pd.MultiIndex):

        series = data["Close"].iloc[:, 0]

    elif "Close" in data.columns:

        series = data["Close"]

    else:

        series = data.squeeze()

    series.name = benchmark

    return series.ffill().dropna()


@st.cache_data(ttl=86400)
def get_company_info(
    ticker,
):

    try:

        info = yf.Ticker(
            ticker
        ).info

    except Exception:

        info = {}

    return {

        "ticker": ticker,

        "name": info.get(
            "shortName",
            ticker,
        ),

        "sector": info.get(
            "sector",
            "Unknown",
        ),

        "industry": info.get(
            "industry",
            "Unknown",
        ),

        "country": info.get(
            "country",
            "Unknown",
        ),

        "market_cap": info.get(
            "marketCap",
            None,
        ),

        "beta": info.get(
            "beta",
            None,
        ),

        "dividend_yield": info.get(
            "dividendYield",
            None,
        ),

    }


def latest_prices(
    prices,
):

    return prices.ffill().iloc[-1]


def daily_returns(
    prices,
):

    return (
        prices
        .pct_change()
        .dropna()
    )


def cumulative_returns(
    prices,
):

    return (
        prices
        / prices.iloc[0]
        - 1
    )