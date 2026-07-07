# portfolio/rebalancer.py

import pandas as pd


def rebalance(

    portfolio,

    target_weights,

):

    portfolio = portfolio.copy()

    current = portfolio.set_index(

        "ticker"

    )["weight"]

    target = pd.Series(

        target_weights

    )

    result = pd.DataFrame()

    result["Current"] = current

    result["Target"] = target

    result = result.fillna(0)

    result["Difference"] = (

        result["Target"]

        -

        result["Current"]

    )

    result["Action"] = result["Difference"].apply(

        lambda x:

        "BUY"

        if x > 0

        else

        "SELL"

    )

    return result.sort_values(

        "Difference",

        ascending=False,

    )