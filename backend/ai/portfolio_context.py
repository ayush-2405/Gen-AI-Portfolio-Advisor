import json


def build_context(

    portfolio,

    performance,

    risk,

    diversification,

    benchmark,

    news_sentiment=None,

    investment_quality=None,

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

        "news_sentiment":

            news_sentiment or {},

        "investment_quality":

            investment_quality or {},

    }

    return json.dumps(

        context,

        indent=2,

        default=str

    )
