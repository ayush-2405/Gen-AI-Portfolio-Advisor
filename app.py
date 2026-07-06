# app.py (Part 1)

import streamlit as st
import pandas as pd
import numpy as np

from config import Config

from market.prices import (
    download_prices,
    download_benchmark,
    latest_prices,
    get_company_info,
    daily_returns,
)

from portfolio.loader import (
    load_portfolio,
    build_portfolio,
    attach_company_metadata,
    portfolio_summary,
)

from analytics.performance import (
    portfolio_returns,
    performance_summary,
)

from analytics.risk import (
    correlation_matrix,
    portfolio_beta,
    risk_summary,
)

from analytics.diversification import (
    diversification_summary,
)

from analytics.benchmark import (
    benchmark_returns,
    align_returns,
    cumulative_comparison,
    benchmark_summary,
)

from analytics.optimizer import (
    PortfolioOptimizer,
)

from analytics.montecarlo import (
    MonteCarloSimulator,
)

from ui.charts import (
    sector_pie,
    marketcap_pie,
    holdings_bar,
    weight_bar,
    correlation_heatmap,
    cumulative_returns_chart,
)

from ui.dashboard import (
    render_dashboard,
)

from ui.optimizer import (
    optimizer_page,
)

from ui.montecarlo import (
    montecarlo_page,
)

from ui.goals import (
    goals_page,
)

from ai.portfolio_context import (
    build_context,
)

from ai.advisor import (
    PortfolioAdvisor,
)

from ui.chat import (
    render_chat,
)

st.set_page_config(
    page_title="GenAI Portfolio Advisor",
    layout="wide",
)

####################################################################################
# LANDING PAGE
####################################################################################

st.title("📈 GenAI Portfolio Advisor")

st.markdown(
    """
Upload a portfolio or load a demo portfolio.

Supports:

- CSV Upload
- Manual Entry (coming soon)
- Demo Portfolio
"""
)

left, right = st.columns(2)

with left:

    uploaded = st.file_uploader(
        "Portfolio CSV",
        type=["csv"],
    )

    demo = st.button(
        "Load Demo Portfolio"
    )

with right:

    groq_key = st.text_input(
        "Groq API Key",
        type="password",
    )

    finnhub_key = st.text_input(
        "Finnhub API Key",
        type="password",
    )

benchmark = st.selectbox(

    "Benchmark",

    [

        "^GSPC",
        "^IXIC",
        "^DJI",
        "^NSEI",

    ],

)

period = st.selectbox(

    "History",

    [

        "6mo",
        "1y",
        "2y",
        "5y",

    ],

    index=2,

)

####################################################################################
# DEMO PORTFOLIO
####################################################################################

if demo:

    portfolio_df = pd.DataFrame(

        {

            "ticker": [

                "AAPL",
                "MSFT",
                "NVDA",
                "GOOGL",
                "AMZN",
                "META",
                "TSLA",
                "BRK-B",
                "JPM",
                "V",
                "JNJ",
                "PG",
                "KO",
                "XOM",
                "CVX",
                "PEP",
                "UNH",
                "HD",
                "COST",
                "AVGO",

            ],

            "shares": [

                20,
                15,
                10,
                8,
                12,
                6,
                5,
                4,
                18,
                14,
                16,
                18,
                30,
                22,
                15,
                20,
                7,
                10,
                8,
                4,

            ],

        }

    )

elif uploaded is not None:

    portfolio_df = load_portfolio(
        uploaded
    )

else:

    st.stop()

####################################################################################
# DOWNLOAD DATA
####################################################################################

tickers = portfolio_df["ticker"].tolist()

with st.spinner(

    "Downloading market data..."

):

    try:

        prices = download_prices(

            tickers,

            period,

        )

    except Exception as e:

        st.error(str(e))

        st.stop()

available = list(prices.columns)

missing = [

    t

    for t in tickers

    if t not in available

]

if missing:

    st.warning(

        f"Skipped tickers: {', '.join(missing)}"

    )

portfolio_df = portfolio_df[

    portfolio_df["ticker"].isin(

        available

    )

]

tickers = portfolio_df["ticker"].tolist()

prices = prices[tickers]

benchmark_prices = download_benchmark(

    benchmark,

    period,

)

latest = latest_prices(

    prices

)

portfolio = build_portfolio(

    portfolio_df,

    latest,

)

metadata = []

for ticker in tickers:

    metadata.append(

        get_company_info(

            ticker

        )

    )

portfolio = attach_company_metadata(

    portfolio,

    metadata,

)

portfolio["market_cap_bucket"] = np.where(

    portfolio["market_cap"] > 2e11,

    "Large",

    np.where(

        portfolio["market_cap"] > 2e10,

        "Mid",

        "Small",

    ),

)

asset_returns = daily_returns(

    prices

)

weights = portfolio["weight"].values

port_returns = portfolio_returns(

    asset_returns,

    weights,

)

bench_returns = benchmark_returns(

    benchmark_prices,

)

beta = portfolio_beta(

    port_returns,

    bench_returns,

)
####################################################################################
# ANALYTICS
####################################################################################

perf = performance_summary(
    port_returns,
)

risk = risk_summary(
    port_returns,
    bench_returns,
    weights,
)

div = diversification_summary(
    weights,
)

bench = benchmark_summary(
    port_returns,
    bench_returns,
    beta,
)

summary = portfolio_summary(
    portfolio,
)

corr = correlation_matrix(
    asset_returns,
)

comparison = align_returns(
    port_returns,
    bench_returns,
)

cumulative = cumulative_comparison(
    comparison,
)

####################################################################################
# SIDEBAR
####################################################################################

st.sidebar.title("Portfolio Summary")

st.sidebar.metric(
    "Portfolio Value",
    f"${summary['total_value']:,.2f}",
)

st.sidebar.metric(
    "Holdings",
    summary["num_holdings"],
)

st.sidebar.metric(
    "Largest Holding",
    summary["largest_position"],
)

st.sidebar.metric(
    "Largest Weight",
    f"{summary['largest_weight']:.2%}",
)

####################################################################################
# MAIN DASHBOARD
####################################################################################

render_dashboard(
    portfolio,
    perf,
    risk,
    div,
    cumulative,
    corr,
)

####################################################################################
# PERFORMANCE
####################################################################################

st.divider()

st.header("Performance Metrics")

st.dataframe(
    pd.DataFrame(
        perf,
        index=["Value"],
    ).T,
    use_container_width=True,
)

####################################################################################
# RISK
####################################################################################

st.divider()

st.header("Risk Metrics")

st.dataframe(
    pd.DataFrame(
        risk,
        index=["Value"],
    ).T,
    use_container_width=True,
)

####################################################################################
# BENCHMARK
####################################################################################

st.divider()

st.header("Benchmark Metrics")

st.dataframe(
    pd.DataFrame(
        bench,
        index=["Value"],
    ).T,
    use_container_width=True,
)


####################################################################################
# OPTIMIZER
####################################################################################

optimizer = PortfolioOptimizer(
    prices,
)

st.divider()

optimizer_page(
    optimizer,
    portfolio,
)

####################################################################################
# MONTE CARLO
####################################################################################

mc = MonteCarloSimulator(
    port_returns,
)

st.divider()

montecarlo_page(
    mc,
    summary["total_value"],
)
####################################################################################
# GOAL PLANNER
####################################################################################

st.divider()

goals_page(
    summary["total_value"],
)

####################################################################################
# AI ADVISOR
####################################################################################

if groq_key:

    st.divider()

    context = build_context(
        portfolio,
        perf,
        risk,
        div,
        bench,
    )

    advisor = PortfolioAdvisor(
        groq_key,
    )

    st.header("AI Executive Summary")

    with st.spinner(
        "Analyzing portfolio..."
    ):

        summary_text = advisor.generate_summary(
            context,
        )

    st.markdown(summary_text)

    st.divider()

    render_chat(
        advisor,
        context,
    )

else:

    st.info(
        "Enter your Groq API Key to enable AI features."
    )

####################################################################################
# HOLDINGS TABLE
####################################################################################

st.divider()

st.header("Portfolio Holdings")

columns = [
    "ticker",
    "shares",
    "latest_price",
    "market_value",
    "weight",
    "sector",
    "industry",
    "country",
    "market_cap",
    "beta",
]

existing_columns = [
    c for c in columns
    if c in portfolio.columns
]

display_df = portfolio[
    existing_columns
].copy()

format_dict = {}

if "latest_price" in display_df.columns:
    format_dict["latest_price"] = "${:,.2f}"

if "market_value" in display_df.columns:
    format_dict["market_value"] = "${:,.2f}"

if "weight" in display_df.columns:
    format_dict["weight"] = "{:.2%}"

if "market_cap" in display_df.columns:
    format_dict["market_cap"] = "${:,.0f}"

if "beta" in display_df.columns:
    format_dict["beta"] = "{:.2f}"

st.dataframe(
    display_df.style.format(format_dict),
    use_container_width=True,
)

####################################################################################
# DOWNLOAD
####################################################################################

st.divider()

csv = portfolio.to_csv(index=False)

st.download_button(
    label="Download Portfolio Analysis",
    data=csv,
    file_name="portfolio_analysis.csv",
    mime="text/csv",
)

####################################################################################
# FOOTER
####################################################################################

st.divider()

st.caption(
    "GenAI Portfolio Advisor • Built with Streamlit, Groq, PyPortfolioOpt and Yahoo Finance"
)