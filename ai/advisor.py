from ai.groq_client import GroqClient

from ai.prompts import (
    SYSTEM_PROMPT,
    build_summary_prompt,
    build_chat_prompt,
)


class PortfolioAdvisor:

    def __init__(
        self,
        api_key,
    ):

        self.llm = GroqClient(api_key)

    def generate_summary(
        self,
        context,
        market,
        benchmark_name,
    ):

        prompt = build_summary_prompt(
            context=context,
            market=market,
            benchmark_name=benchmark_name,
        )

        return self.llm.chat(
            SYSTEM_PROMPT,
            prompt,
        )

    def answer(
        self,
        context,
        market,
        benchmark_name,
        question,
    ):

        prompt = build_chat_prompt(
            context=context,
            market=market,
            benchmark_name=benchmark_name,
            question=question,
        )

        return self.llm.chat(
            SYSTEM_PROMPT,
            prompt,
        )