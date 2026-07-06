import numpy as np


def concentration_score(weights):

    return np.max(weights)


def herfindahl_index(weights):

    w = np.array(weights)

    return np.sum(
        w ** 2
    )


def effective_number_of_holdings(weights):

    hhi = herfindahl_index(
        weights
    )

    return 1 / hhi


def diversification_score(weights):

    hhi = herfindahl_index(
        weights)

    score = (

        (1 - hhi)

        * 100

    )

    return max(
        0,
        min(score, 100)
    )


def top_holdings_share(
    weights,
    n=5
):

    return np.sort(
        weights
    )[::-1][:n].sum()


def concentration_level(
    weights
):

    largest = np.max(weights)

    if largest > 0.40:
        return "Very High"

    if largest > 0.25:
        return "High"

    if largest > 0.15:
        return "Moderate"

    return "Low"


def diversification_summary(
    weights
):

    return {

        "Diversification Score":

            diversification_score(
                weights
            ),

        "HHI":

            herfindahl_index(
                weights
            ),

        "Effective Holdings":

            effective_number_of_holdings(
                weights
            ),

        "Top 5 Exposure":

            top_holdings_share(
                weights
            ),

        "Largest Holding":

            concentration_score(
                weights
            ),

        "Concentration":

            concentration_level(
                weights
            )

    }