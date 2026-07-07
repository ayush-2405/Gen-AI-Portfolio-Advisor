import streamlit as st

from analytics.goals import (

    future_value,

    required_return,

    required_monthly_investment,

)


def goals_page(

    portfolio_value,

    currency="$",

):

    st.header(

        "Financial Goal Planner"

    )

    target = st.number_input(

        "Target Wealth",

        value=1000000.0,

    )

    years = st.slider(

        "Years",

        1,

        40,

        15,

    )

    expected = st.slider(

        "Expected Return (%)",

        1,

        20,

        10,

    )

    expected /= 100

    fv = future_value(

        portfolio_value,

        expected,

        years,

    )

    req = required_return(

        portfolio_value,

        target,

        years,

    )

    sip = required_monthly_investment(

        target,

        portfolio_value,

        expected,

        years,

    )

    st.metric(

        "Future Value",

        f"{currency}{fv:,.0f}",

    )

    st.metric(

        "Required CAGR",

        f"{req:.2%}",

    )

    st.metric(

        "Monthly Investment",

        f"{currency}{sip:,.2f}",

    )
