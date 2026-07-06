import pandas as pd
import streamlit as st
import yfinance as yf


@st.cache_data(ttl=3600)
def download_prices(
    tickers,
    period="2y",
    interval="1d",
):

    df = yf.download(
        tickers=tickers,
        period=period,
        interval=interval,
        auto_adjust=True,
        progress=False,
        group_by="column",
        threads=True,
    )

    if isinstance(df.columns, pd.MultiIndex):
        prices = df["Close"]
    elif "Close" in df.columns:
        prices = df["Close"]
    else:
        prices = df

    if isinstance(prices, pd.Series):
        prices = prices.to_frame()

    prices = prices.ffill().dropna(how="all")

    return prices


@st.cache_data(ttl=3600)
def download_benchmark(
    benchmark="^GSPC",
    period="2y",
):

    df = yf.download(
        benchmark,
        period=period,
        auto_adjust=True,
        progress=False,
        threads=False,
    )

    if isinstance(df.columns, pd.MultiIndex):
        series = df["Close"].iloc[:, 0]
    elif "Close" in df.columns:
        series = df["Close"]
    else:
        series = df.squeeze()

    series.name = benchmark

    return series.ffill().dropna()


@st.cache_data(ttl=86400)
def get_company_info(ticker):

    try:
        info = yf.Ticker(ticker).info
    except Exception:
        info = {}

    return {
        "ticker": ticker,
        "name": info.get("shortName", ticker),
        "sector": info.get("sector", "Unknown"),
        "industry": info.get("industry", "Unknown"),
        "country": info.get("country", "Unknown"),
        "market_cap": info.get("marketCap"),
        "beta": info.get("beta"),
        "dividend_yield": info.get("dividendYield"),
    }


def latest_prices(price_df):

    return price_df.ffill().iloc[-1]


def daily_returns(price_df):

    return price_df.pct_change().dropna()


def cumulative_returns(price_df):

    return price_df.ffill() / price_df.ffill().iloc[0] - 1