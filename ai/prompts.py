# ai/prompts.py

# REPLACE ENTIRE FILE

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

Rules:

- Never hallucinate prices.
- Use only the supplied portfolio information.
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

2. Biggest strengths

3. Biggest weaknesses

4. Diversification analysis

5. Risk analysis

6. Sector analysis

7. Rebalancing suggestions

8. Actionable recommendations
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

Answer professionally.
"""