# analytics/montecarlo.py

import numpy as np
import pandas as pd


class MonteCarloSimulator:
    """
    Monte Carlo simulator using Geometric Brownian Motion (GBM).

    Parameters
    ----------
    portfolio_returns : pd.Series
        Historical daily portfolio returns.
    simulations : int
        Number of Monte Carlo paths.
    days : int
        Forecast horizon (trading days).
    """

    def __init__(
        self,
        portfolio_returns: pd.Series,
        simulations: int = 10000,
        days: int = 252,
    ):
        self.returns = portfolio_returns.dropna()

        self.simulations = simulations
        self.days = days

        # Historical statistics
        self.mu = float(self.returns.mean())
        self.sigma = float(self.returns.std())

    def simulate(self, initial_value: float) -> pd.DataFrame:
        """
        Simulate future portfolio values using GBM.
        """

        paths = np.zeros((self.days, self.simulations))

        paths[0] = initial_value

        drift = self.mu - 0.5 * (self.sigma ** 2)

        for t in range(1, self.days):
            z = np.random.standard_normal(self.simulations)

            paths[t] = (
                paths[t - 1]
                * np.exp(
                    drift
                    + self.sigma * z
                )
            )

        df = pd.DataFrame(paths)

        df.index.name = "day"

        return df
    def bands(self, simulation: pd.DataFrame) -> pd.DataFrame:
        """
        Compute daily Monte Carlo confidence bands.

        Returns
        -------
        DataFrame
            day
            median
            mean
            p5
            p95
        """

        bands = pd.DataFrame({
            "day": simulation.index,
            "median": simulation.median(axis=1),
            "mean": simulation.mean(axis=1),
            "p5": simulation.quantile(0.05, axis=1),
            "p95": simulation.quantile(0.95, axis=1),
        })

        return bands

    def summary(self, simulation: pd.DataFrame) -> dict:
        """
        Generate summary statistics from the Monte Carlo simulation.
        """

        initial_value = float(simulation.iloc[0, 0])

        final_values = simulation.iloc[-1]

        probability_of_profit = float(
            (final_values > initial_value).mean()
        )

        return {
            "Mean": float(final_values.mean()),
            "Median": float(final_values.median()),
            "5th Percentile": float(np.percentile(final_values, 5)),
            "95th Percentile": float(np.percentile(final_values, 95)),
            "Probability of Profit": probability_of_profit,
        }