# market/fundamentals.py

import yfinance as yf


def fundamentals(

    ticker,

):

    info = yf.Ticker(

        ticker

    ).info

    return {

        "PE":

            info.get(

                "trailingPE"

            ),

        "Forward PE":

            info.get(

                "forwardPE"

            ),

        "EPS":

            info.get(

                "trailingEps"

            ),

        "Dividend Yield":

            info.get(

                "dividendYield"

            ),

        "Revenue Growth":

            info.get(

                "revenueGrowth"

            ),

        "Profit Margin":

            info.get(

                "profitMargins"

            ),

        "Operating Margin":

            info.get(

                "operatingMargins"

            ),

        "ROE":

            info.get(

                "returnOnEquity"

            ),

        "ROA":

            info.get(

                "returnOnAssets"

            ),

        "Debt To Equity":

            info.get(

                "debtToEquity"

            ),

        "Current Ratio":

            info.get(

                "currentRatio"

            ),

        "Quick Ratio":

            info.get(

                "quickRatio"

            ),

        "Free Cash Flow":

            info.get(

                "freeCashflow"

            ),

        "Market Cap":

            info.get(

                "marketCap"

            ),

    }