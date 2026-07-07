# analytics/goals.py

import numpy as np


def future_value(

    present,

    annual_return,

    years,

):

    return (

        present

        *

        (

            1

            +

            annual_return

        )

        **

        years

    )


def required_return(

    current,

    target,

    years,

):

    return (

        target

        /

        current

    ) ** (

        1

        /

        years

    ) - 1


def required_monthly_investment(

    target,

    current,

    annual_return,

    years,

):

    r = annual_return / 12

    n = years * 12

    future = current * (

        1 + r

    ) ** n

    return (

        target - future

    ) * r / (

        (

            1 + r

        ) ** n

        -

        1

    )