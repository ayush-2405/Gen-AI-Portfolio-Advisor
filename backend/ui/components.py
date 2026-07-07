# ui/components.py

import streamlit as st


def page_header():

    st.title(

        "GenAI Portfolio Advisor"

    )

    st.caption(

        "AI-powered institutional portfolio analytics"

    )


def sidebar():

    st.sidebar.header(

        "Settings"

    )

    benchmark = st.sidebar.text_input(

        "Benchmark",

        "^GSPC",

    )

    period = st.sidebar.selectbox(

        "History",

        [

            "6mo",

            "1y",

            "2y",

            "5y",

        ],

        index=2,

    )

    return benchmark, period


def executive_summary(

    summary,

):

    st.subheader(

        "Executive Summary"

    )

    st.markdown(

        summary

    )