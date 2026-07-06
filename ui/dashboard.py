# ui/dashboard.py

import streamlit as st
import pandas as pd

from ui.metrics import metric_cards

from ui.charts import (
    sector_pie,
    marketcap_pie,
    holdings_bar,
    weight_bar,
    correlation_heatmap,
    cumulative_returns_chart,
)


def render_dashboard(
    portfolio,
    performance,
    risk,
    diversification,
    comparison,
    correlation,
):

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
        cumulative_returns_chart(
            comparison
        ),
        use_container_width=True,
    )

    st.plotly_chart(
        correlation_heatmap(
            correlation
        ),
        use_container_width=True,
    )

    st.divider()

    st.subheader("Portfolio")

    st.dataframe(

        portfolio.style.format(

            {

                "latest_price": "${:,.2f}",

                "market_value": "${:,.2f}",

                "weight": "{:.2%}",

                "beta": "{:.2f}",

            }

        ),

        use_container_width=True,

    )