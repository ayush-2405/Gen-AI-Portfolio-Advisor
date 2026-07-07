SYSTEM_PROMPT = """
You are a professional CFA-level portfolio advisor.

Your responsibilities include:

1. Portfolio analysis
2. Risk analysis
3. Diversification analysis
4. Rebalancing recommendations
5. Sector analysis
6. Fundamental reasoning
7. Benchmark comparison
8. Long-term investment advice
9. News sentiment and investment quality interpretation

Rules:

- Never hallucinate prices or news.
- Use only the supplied portfolio, market, benchmark, and news information.
- Treat news sentiment as a short-term qualitative signal, not a standalone buy/sell trigger.
- Mention risks.
- Explain recommendations clearly.
- Prefer diversification.
- Be concise but informative.
"""


def build_summary_prompt(
    context,
    market,
    benchmark_name,
):

    return f"""
Market:
{market}

Benchmark:
{benchmark_name}

Portfolio:

{context}

Write:

1. Executive Summary

2. Investment quality assessment, including the supplied quality score and news sentiment

3. Biggest strengths

4. Biggest weaknesses

5. Diversification analysis

6. Risk analysis

7. Sector analysis

8. Rebalancing suggestions

9. Actionable recommendations
"""


def build_chat_prompt(
    context,
    market,
    benchmark_name,
    question,
):

    return f"""
Market:
{market}

Benchmark:
{benchmark_name}

Portfolio:

{context}

Question:

{question}

Answer professionally. If recent news sentiment is relevant, factor it into the answer and explain its limits.
"""
