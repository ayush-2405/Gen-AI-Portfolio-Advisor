# ui/dashboard.py

import streamlit as st

from ui.metrics import metric_cards
from ui.charts import (
    sector_pie,
    marketcap_pie,
    holdings_bar,
    weight_bar,
    correlation_heatmap,
    cumulative_returns_chart,
)
from markets import currency_symbol


def render_dashboard(
    portfolio,
    performance,
    risk,
    diversification,
    comparison,
    correlation,
    market,
):

    currency = currency_symbol(market)

    st.header("Executive Dashboard")

    metric_cards(
        performance,
        risk,
        diversification,
    )

    st.divider()

    left, right = st.columns(2)

    with left:

        st.plotly_chart(
            sector_pie(portfolio),
            use_container_width=True,
        )

        st.plotly_chart(
            holdings_bar(portfolio),
            use_container_width=True,
        )

    with right:

        st.plotly_chart(
            marketcap_pie(portfolio),
            use_container_width=True,
        )

        st.plotly_chart(
            weight_bar(portfolio),
            use_container_width=True,
        )

    st.divider()

    st.plotly_chart(
        cumulative_returns_chart(comparison),
        use_container_width=True,
    )

    st.plotly_chart(
        correlation_heatmap(correlation),
        use_container_width=True,
    )

    st.divider()

    st.subheader("Portfolio")

    format_dict = {}

    if "latest_price" in portfolio.columns:
        format_dict["latest_price"] = f"{currency}" + "{:,.2f}"

    if "market_value" in portfolio.columns:
        format_dict["market_value"] = f"{currency}" + "{:,.2f}"

    if "weight" in portfolio.columns:
        format_dict["weight"] = "{:.2%}"

    if "beta" in portfolio.columns:
        format_dict["beta"] = "{:.2f}"

    if "dividend_yield" in portfolio.columns:
        format_dict["dividend_yield"] = "{:.2f}%"

    if "market_cap" in portfolio.columns:
        format_dict["market_cap"] = f"{currency}" + "{:,.0f}"

    st.dataframe(
        portfolio.style.format(format_dict),
        use_container_width=True,
    )