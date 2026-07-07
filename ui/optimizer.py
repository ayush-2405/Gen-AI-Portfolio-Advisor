# ui/optimizer.py

import streamlit as st

from portfolio.rebalancer import rebalance


def optimizer_page(

    optimizer,

    portfolio,

):

    st.header(

        "Portfolio Optimizer"

    )

    weights, perf = optimizer.max_sharpe()

    rebalance_table = rebalance(

        portfolio,

        weights,

    )

    st.dataframe(

        rebalance_table.style.format(

            {

                "Current": "{:.2%}",

                "Target": "{:.2%}",

                "Difference": "{:.2%}",

            }

        ),

        use_container_width=True,

    )

    st.metric(

        "Expected Return",

        f"{perf[0]:.2%}",

    )

    st.metric(

        "Expected Volatility",

        f"{perf[1]:.2%}",

    )

    st.metric(

        "Sharpe",

        f"{perf[2]:.2f}",

    )