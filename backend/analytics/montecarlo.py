# analytics/montecarlo.py

import numpy as np
import pandas as pd


class MonteCarloSimulator:

    def __init__(

        self,

        portfolio_returns,

        simulations=10000,

        days=252,

    ):

        self.returns = portfolio_returns

        self.simulations = simulations

        self.days = days

        self.mu = portfolio_returns.mean()

        self.sigma = portfolio_returns.std()

    def simulate(

        self,

        initial_value,

    ):

        paths = np.zeros(

            (

                self.days,

                self.simulations,

            )

        )

        paths[0] = initial_value

        for t in range(

            1,

            self.days,

        ):

            shock = np.random.normal(

                self.mu,

                self.sigma,

                self.simulations,

            )

            paths[t] = (

                paths[t - 1]

                *

                (

                    1

                    +

                    shock

                )

            )

        return pd.DataFrame(

            paths

        )

    def summary(

        self,

        simulation,

    ):

        final = simulation.iloc[-1]

        return {

            "Mean":

                final.mean(),

            "Median":

                final.median(),

            "5th Percentile":

                np.percentile(

                    final,

                    5,

                ),

            "95th Percentile":

                np.percentile(

                    final,

                    95,

                ),

            "Probability of Profit":

                (

                    final

                    >

                    simulation.iloc[0, 0]

                ).mean(),

        }