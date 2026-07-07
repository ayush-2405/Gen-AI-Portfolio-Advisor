# analytics/optimizer.py

import numpy as np
import pandas as pd

from pypfopt import (
    EfficientFrontier,
    risk_models,
    expected_returns,
)


class PortfolioOptimizer:

    def __init__(self, prices):

        self.prices = prices

        self.mu = expected_returns.mean_historical_return(
            prices
        )

        self.S = risk_models.sample_cov(
            prices
        )

    def max_sharpe(self):

        ef = EfficientFrontier(
            self.mu,
            self.S,
        )

        ef.max_sharpe()

        weights = ef.clean_weights()

        perf = ef.portfolio_performance(
            verbose=False
        )

        return weights, perf

    def min_volatility(self):

        ef = EfficientFrontier(
            self.mu,
            self.S,
        )

        ef.min_volatility()

        weights = ef.clean_weights()

        perf = ef.portfolio_performance(
            verbose=False
        )

        return weights, perf

    def efficient_return(
        self,
        target_return,
    ):

        ef = EfficientFrontier(
            self.mu,
            self.S,
        )

        ef.efficient_return(
            target_return
        )

        return ef.clean_weights()

    def efficient_risk(
        self,
        target_volatility,
    ):

        ef = EfficientFrontier(
            self.mu,
            self.S,
        )

        ef.efficient_risk(
            target_volatility
        )

        return ef.clean_weights()