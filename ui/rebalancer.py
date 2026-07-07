# ui/rebalancer.py

import streamlit as st


def show_rebalance(

    optimizer,

    portfolio,

):

    st.header(

        "AI Rebalancer"

    )

    strategy = st.selectbox(

        "Optimization Strategy",

        [

            "Maximum Sharpe",

            "Minimum Volatility",

        ],

    )

    if st.button(

        "Generate Allocation"

    ):

        if strategy == "Maximum Sharpe":

            weights, perf = optimizer.max_sharpe()

        else:

            weights, perf = optimizer.min_volatility()

        st.subheader(

            "Recommended Allocation"

        )

        st.json(

            weights

        )

        st.success(

            f"Expected Return: {perf[0]:.2%}"

        )

        st.success(

            f"Expected Volatility: {perf[1]:.2%}"

        )

        st.success(

            f"Sharpe Ratio: {perf[2]:.2f}"

        )