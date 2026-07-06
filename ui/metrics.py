# ui/metrics.py

import streamlit as st


def metric_cards(

    performance,

    risk,

    diversification,

):

    c1, c2, c3, c4 = st.columns(4)

    c1.metric(

        "Annual Return",

        f"{performance['Annual Return']:.2%}",

    )

    c2.metric(

        "Sharpe",

        f"{performance['Sharpe Ratio']:.2f}",

    )

    c3.metric(

        "Risk Score",

        f"{risk['Beta']:.2f}",

    )

    c4.metric(

        "Diversification",

        f"{diversification['Diversification Score']:.1f}",

    )