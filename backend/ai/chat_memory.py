# ai/chat_memory.py

import streamlit as st


def initialize():

    if "messages" not in st.session_state:

        st.session_state.messages = []


def add_user(

    message,

):

    st.session_state.messages.append(

        {

            "role": "user",

            "content": message,

        }

    )


def add_assistant(

    message,

):

    st.session_state.messages.append(

        {

            "role": "assistant",

            "content": message,

        }

    )


def history():

    return st.session_state.messages


def clear():

    st.session_state.messages = []