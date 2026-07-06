# ai/portfolio_context.py

import json


def build_context(

    portfolio,

    performance,

    risk,

    diversification,

    benchmark,

):

    context = {

        "portfolio":

            portfolio.to_dict(

                orient="records"

            ),

        "performance":

            performance,

        "risk":

            risk,

        "diversification":

            diversification,

        "benchmark":

            benchmark,

    }

    return json.dumps(

        context,

        indent=2,

        default=str

    )