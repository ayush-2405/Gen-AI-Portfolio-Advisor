# ai/advisor.py

from ai.groq_client import GroqClient

from ai.prompts import (

    SYSTEM_PROMPT,

    SUMMARY_PROMPT,

)


class PortfolioAdvisor:

    def __init__(

        self,

        api_key,

    ):

        self.llm = GroqClient(

            api_key

        )

    def generate_summary(

        self,

        context,

    ):

        prompt = SUMMARY_PROMPT.format(

            portfolio=context

        )

        return self.llm.chat(

            SYSTEM_PROMPT,

            prompt,

        )

    def answer(

        self,

        context,

        question,

    ):

        prompt = f"""

Portfolio

{context}

Question

{question}

"""

        return self.llm.chat(

            SYSTEM_PROMPT,

            prompt,

        )