import hashlib
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
from market.news import (
    recent_portfolio_news,
)
from market.sentiment import (
    SentimentAnalyzer,
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

from analytics.investment_quality import (
    investment_quality_summary,
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

st.title("GenAI Portfolio Advisor")

st.markdown(
    """
Upload your portfolio in CSV format.
"""
)

left, right = st.columns(2)

with left:

    uploaded = st.file_uploader(
        "Portfolio CSV",
        type=["csv"],
    )

    run = st.button(
        "Analyze Portfolio",
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

from markets import (
    MARKETS,
    benchmark_options,
    default_benchmark,
    currency_symbol,
)

market = st.selectbox(
    "Market",
    list(MARKETS.keys()),
)

benchmark_dict = benchmark_options(
    market,
)

benchmark_name = st.selectbox(
    "Benchmark",
    list(benchmark_dict.keys()),
)

benchmark = benchmark_dict[
    benchmark_name
]

currency = currency_symbol(
    market,
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
# ANALYZE PORTFOLIO
####################################################################################

effective_finnhub_key = finnhub_key or Config.FINNHUB_API_KEY

analysis_inputs = None

if uploaded is not None:

    file_hash = hashlib.sha256(uploaded.getvalue()).hexdigest()
    finnhub_key_hash = hashlib.sha256(effective_finnhub_key.encode()).hexdigest() if effective_finnhub_key else ""

    analysis_inputs = {
        "file_hash": file_hash,
        "market": market,
        "benchmark_name": benchmark_name,
        "benchmark": benchmark,
        "period": period,
        "finnhub_key_hash": finnhub_key_hash,
    }

if run:

    if uploaded is None:

        st.warning("Upload a portfolio CSV before analyzing.")
        st.stop()

    with st.spinner("Analyzing portfolio and downloading market data..."):

        portfolio_df = load_portfolio(
            uploaded,
            market=market,
        )

        tickers = portfolio_df["ticker"].tolist()

        try:

            prices = download_prices(
                tickers,
                period,
                market=market,
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

        company_names = portfolio.set_index("ticker")["name"].to_dict()
        news = pd.DataFrame()
        news_sentiment = {
            "Average News Sentiment": np.nan,
            "News Sentiment Label": "Unavailable",
            "News Articles": 0,
        }

        news = recent_portfolio_news(
            tickers,
            effective_finnhub_key,
            days=14,
            limit_per_ticker=3,
            market=market,
            company_names=company_names,
        )

        news, news_sentiment = SentimentAnalyzer().analyze_news(
            news,
        )

        quality = investment_quality_summary(
            perf,
            risk,
            div,
            news_sentiment,
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

    st.session_state.analysis = {
        "inputs": analysis_inputs,
        "missing": missing,
        "portfolio": portfolio,
        "perf": perf,
        "risk": risk,
        "div": div,
        "bench": bench,
        "news": news,
        "news_sentiment": news_sentiment,
        "quality": quality,
        "summary": summary,
        "corr": corr,
        "cumulative": cumulative,
        "prices": prices,
        "port_returns": port_returns,
        "market": market,
        "benchmark_name": benchmark_name,
        "currency": currency,
        "effective_finnhub_key": effective_finnhub_key,
    }

if "analysis" not in st.session_state:

    st.stop()

analysis = st.session_state.analysis

if analysis_inputs is not None and analysis_inputs != analysis.get("inputs"):

    st.info("Inputs changed. Click Analyze Portfolio to refresh the stored analysis.")

missing = analysis["missing"]
portfolio = analysis["portfolio"]
perf = analysis["perf"]
risk = analysis["risk"]
div = analysis["div"]
bench = analysis["bench"]
news = analysis["news"]
news_sentiment = analysis["news_sentiment"]
quality = analysis["quality"]
summary = analysis["summary"]
corr = analysis["corr"]
cumulative = analysis["cumulative"]
prices = analysis["prices"]
port_returns = analysis["port_returns"]
market = analysis["market"]
benchmark_name = analysis["benchmark_name"]
currency = analysis["currency"]
effective_finnhub_key = analysis["effective_finnhub_key"]

if missing:

    st.warning(
        f"Skipped tickers: {', '.join(missing)}"
    )

####################################################################################
# SIDEBAR
####################################################################################

st.sidebar.title("Portfolio Summary")

st.sidebar.metric(
    "Portfolio Value",
    f"{currency}{summary['total_value']:,.2f}",
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

st.sidebar.metric(
    "Investment Quality",
    f"{quality['Investment Quality Score']:.1f}",
    quality["Investment Quality Label"],
)

st.sidebar.metric(
    "News Sentiment",
    news_sentiment["News Sentiment Label"],
    f"{news_sentiment['News Articles']} articles",
)


####################################################################################
# NAVIGATION
####################################################################################

st.divider()

page_options = [
    "Overview",
    "Performance & Risk",
    "News & Quality",
    "Optimizer",
    "Monte Carlo",
    "Goal Planner",
    "AI Advisor",
    "Holdings & Export",
]

page = st.segmented_control(
    "Analysis section",
    page_options,
    default="Overview",
    label_visibility="collapsed",
)

if page is None:

    page = "Overview"
####################################################################################
# PAGES
####################################################################################

if page == "Overview":

    render_dashboard(
        portfolio,
        perf,
        risk,
        div,
        cumulative,
        corr,
        market,
    )

elif page == "Performance & Risk":

    st.header("Performance Metrics")

    st.dataframe(
        pd.DataFrame(
            perf,
            index=["Value"],
        ).T,
        use_container_width=False,
    )

    st.header("Risk Metrics")

    st.dataframe(
        pd.DataFrame(
            risk,
            index=["Value"],
        ).T,
        use_container_width=False,
    )

    st.header("Benchmark Metrics")

    st.dataframe(
        pd.DataFrame(
            bench,
            index=["Value"],
        ).T,
        use_container_width=False,
    )

elif page == "News & Quality":

    st.header("Investment Quality")

    q1, q2, q3 = st.columns(3)

    q1.metric(
        "Quality Score",
        f"{quality['Investment Quality Score']:.1f}",
        quality["Investment Quality Label"],
    )

    q2.metric(
        "News Sentiment",
        news_sentiment["News Sentiment Label"],
        f"{news_sentiment['News Articles']} articles",
    )

    avg_sentiment = news_sentiment.get(
        "Average News Sentiment",
        np.nan,
    )

    q3.metric(
        "Average Sentiment",
        "N/A" if np.isnan(avg_sentiment) else f"{avg_sentiment:.2f}",
    )

    st.dataframe(
        pd.DataFrame(
            quality["Quality Components"],
            index=["Score"],
        ).T,
        use_container_width=False,
    )

    if not news.empty:

        news_columns = [
            "ticker",
            "published_at",
            "source",
            "headline",
            "sentiment_label",
            "sentiment_score",
            "url",
        ]

        st.subheader("Recent News")

        st.dataframe(
            news[
                [col for col in news_columns if col in news.columns]
            ],
            use_container_width=True,
        )

    elif market == "US" and not effective_finnhub_key:

        st.info(
            "Enter your Finnhub API Key to enable recent US company news and sentiment."
        )

    else:

        st.info(
            "No recent company news found for the current holdings."
        )

elif page == "Optimizer":

    optimizer = PortfolioOptimizer(
        prices,
    )

    optimizer_page(
        optimizer,
        portfolio,
    )

elif page == "Monte Carlo":

    mc = MonteCarloSimulator(
        port_returns,
    )

    montecarlo_page(
        mc,
        summary["total_value"],
    )

elif page == "Goal Planner":

    goals_page(
        summary["total_value"],
        currency,
    )

elif page == "AI Advisor":

    if groq_key:

        context = build_context(
            portfolio,
            perf,
            risk,
            div,
            bench,
            news_sentiment,
            quality,
        )

        advisor = PortfolioAdvisor(
            groq_key,
        )

        st.header("AI Executive Summary")

        summary_cache_key = hashlib.sha256(
            f"{analysis.get('inputs')}:{groq_key}".encode()
        ).hexdigest()

        if st.session_state.get("ai_summary_key") != summary_cache_key:

            with st.spinner(
                "Analyzing portfolio..."
            ):

                st.session_state.ai_summary_text = advisor.generate_summary(
                    context,
                    market,
                    benchmark_name,
                )

            st.session_state.ai_summary_key = summary_cache_key

        st.markdown(st.session_state.ai_summary_text)

        st.divider()

        render_chat(
            advisor,
            context,
            market,
            benchmark_name,
        )

    else:

        st.info(
            "Enter your Groq API Key to enable AI features."
        )

elif page == "Holdings & Export":

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
        format_dict["latest_price"] = f"{currency}" + "{:,.2f}"

    if "market_value" in display_df.columns:
        format_dict["market_value"] = f"{currency}" + "{:,.2f}"

    if "weight" in display_df.columns:
        format_dict["weight"] = "{:.2%}"

    if "market_cap" in display_df.columns:
        format_dict["market_cap"] = f"{currency}" + "{:,.0f}"

    if "beta" in display_df.columns:
        format_dict["beta"] = "{:.2f}"

    st.dataframe(
        display_df.style.format(format_dict),
        use_container_width=True,
    )

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
    "GenAI Portfolio Advisor - Built with Streamlit, Groq, PyPortfolioOpt and Yahoo Finance"
)

