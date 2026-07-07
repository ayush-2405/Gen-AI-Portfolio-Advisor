import streamlit as st

from ai.chat_memory import (
    initialize,
    history,
    add_user,
    add_assistant,
)


def render_chat(
    advisor,
    context,
    market,
    benchmark_name,
):

    initialize()

    st.subheader("🤖 AI Portfolio Advisor")

    for msg in history():

        with st.chat_message(msg["role"]):

            st.markdown(msg["content"])

    prompt = st.chat_input(
        "Ask anything about your portfolio..."
    )

    if not prompt:
        return

    add_user(prompt)

    with st.chat_message("user"):

        st.markdown(prompt)

    with st.spinner("Thinking..."):

        response = advisor.answer(
            context=context,
            market=market,
            benchmark_name=benchmark_name,
            question=prompt,
        )

    add_assistant(response)

    with st.chat_message("assistant"):

        st.markdown(response)