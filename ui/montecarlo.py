# ui/montecarlo.py

import streamlit as st

import plotly.graph_objects as go


def montecarlo_page(

    simulator,

    initial_value,

):

    st.header(

        "Monte Carlo Simulation"

    )

    sim = simulator.simulate(

        initial_value

    )

    fig = go.Figure()

    for i in range(

        min(

            200,

            sim.shape[1],

        )

    ):

        fig.add_trace(

            go.Scatter(

                x=sim.index,

                y=sim.iloc[:, i],

                mode="lines",

                line=dict(

                    width=1,

                ),

                showlegend=False,

            )

        )

    st.plotly_chart(

        fig,

        use_container_width=True,

    )

    st.subheader(

        "Simulation Statistics"

    )

    st.json(

        simulator.summary(

            sim

        )

    )