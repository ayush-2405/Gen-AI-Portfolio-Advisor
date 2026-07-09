import io
import json
import math
import uuid
from typing import Any

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import Config
from markets import MARKETS, benchmark_options, currency_symbol
from market.prices import (
    daily_returns,
    download_benchmark,
    download_prices,
    get_company_info,
    latest_prices,
)
from market.news import recent_portfolio_news
from market.sentiment import SentimentAnalyzer
from portfolio.loader import (
    attach_company_metadata,
    build_portfolio,
    load_portfolio,
    portfolio_summary,
)
from portfolio.rebalancer import rebalance
from analytics.benchmark import align_returns, benchmark_returns, benchmark_summary, cumulative_comparison
from analytics.diversification import diversification_summary
from analytics.goals import future_value, required_monthly_investment, required_return
from analytics.investment_quality import investment_quality_summary
from analytics.montecarlo import MonteCarloSimulator
from analytics.optimizer import PortfolioOptimizer
from analytics.performance import performance_summary, portfolio_returns
from analytics.risk import correlation_matrix, portfolio_beta, risk_summary
from ai.advisor import PortfolioAdvisor
from ai.portfolio_context import build_context

app = FastAPI(title="GenAI Portfolio Advisor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ANALYSES: dict[str, dict[str, Any]] = {}


class ChatRequest(BaseModel):
    analysis_id: str
    question: str
    groq_key: str | None = None


class GoalRequest(BaseModel):
    analysis_id: str
    target: float
    years: int
    expected_return: float


def clean_value(value: Any) -> Any:
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        value = float(value)
    if isinstance(value, float):
        return None if math.isnan(value) or math.isinf(value) else value
    if isinstance(value, (pd.Timestamp,)):
        return value.isoformat()
    return value


def clean_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    safe = df.copy()
    safe = safe.replace({np.nan: None, np.inf: None, -np.inf: None})
    records = safe.to_dict(orient="records")
    return json.loads(json.dumps(records, default=str))


def clean_dict(data: dict[str, Any]) -> dict[str, Any]:
    return json.loads(json.dumps(data, default=clean_value))


def series_records(series: pd.Series, name: str) -> list[dict[str, Any]]:
    return [
        {"name": str(index), name: clean_value(value)}
        for index, value in series.items()
    ]


def build_payload(
    *,
    market: str,
    benchmark_name: str,
    effective_finnhub_key: str,
    portfolio: pd.DataFrame,
    prices: pd.DataFrame,
    port_returns: pd.Series,
    perf: dict[str, Any],
    risk: dict[str, Any],
    div: dict[str, Any],
    bench: dict[str, Any],
    news: pd.DataFrame,
    news_sentiment: dict[str, Any],
    quality: dict[str, Any],
    summary: dict[str, Any],
    corr: pd.DataFrame,
    cumulative: pd.DataFrame,
    missing: list[str],
) -> dict[str, Any]:
    optimizer = PortfolioOptimizer(prices)
    opt_weights, opt_perf = optimizer.max_sharpe()
    rebalance_table = rebalance(portfolio, opt_weights).reset_index().rename(columns={"index": "ticker"})

    simulator = MonteCarloSimulator(port_returns, simulations=10000, days=252)
    simulation = simulator.simulate(summary["total_value"])

    # Show only a subset of paths in frontend
    sampled_paths = (
        simulation.iloc[:, :40]
        .reset_index()
        .rename(columns={"index": "day"})
    )

    # Daily confidence statistics
    bands = simulator.bands(simulation)

    cumulative_display = cumulative.copy()
    cumulative_display.index = cumulative_display.index.astype(str)
    cumulative_display = cumulative_display.reset_index().rename(columns={"index": "date"})

    analysis_id = str(uuid.uuid4())
    context = build_context(portfolio, perf, risk, div, bench, news_sentiment, quality)

    payload = {
        "analysisId": analysis_id,
        "market": market,
        "benchmarkName": benchmark_name,
        "currency": currency_symbol(market),
        "missingTickers": missing,
        "summary": clean_dict(summary),
        "performance": clean_dict(perf),
        "risk": clean_dict(risk),
        "diversification": clean_dict(div),
        "benchmark": clean_dict(bench),
        "quality": clean_dict(quality),
        "newsSentiment": clean_dict(news_sentiment),
        "holdings": clean_records(portfolio),
        "news": clean_records(news),
        "charts": {
            "sectorAllocation": series_records(portfolio.groupby("sector")["weight"].sum().sort_values(ascending=False), "weight"),
            "marketCapAllocation": series_records(portfolio.groupby("market_cap_bucket")["weight"].sum().sort_values(ascending=False), "weight"),
            "holdingValues": clean_records(portfolio.sort_values("market_value", ascending=False)[["ticker", "market_value", "weight"]]),
            "cumulative": clean_records(cumulative_display),
            "correlation": {
                "columns": [str(col) for col in corr.columns],
                "matrix": [[clean_value(value) for value in row] for row in corr.values.tolist()],
            },
        },
        "optimizer": {
            "weights": clean_dict(dict(opt_weights)),
            "performance": {
                "expectedReturn": clean_value(opt_perf[0]),
                "expectedVolatility": clean_value(opt_perf[1]),
                "sharpe": clean_value(opt_perf[2]),
            },
            "rebalance": clean_records(rebalance_table),
        },
        "monteCarlo": {
            "summary": clean_dict(
                simulator.summary(simulation)
            ),

            "paths": clean_records(sampled_paths),

            "bands": clean_records(bands),
        },
    }

    ANALYSES[analysis_id] = {
        "context": context,
        "market": market,
        "benchmark_name": benchmark_name,
        "portfolio_value": summary["total_value"],
        "currency": currency_symbol(market),
        "payload": payload,
    }

    return payload


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/markets")
def markets() -> dict[str, Any]:
    return {
        "markets": [
            {
                "id": key,
                "name": value["name"],
                "currency": value["currency"],
                "benchmarks": benchmark_options(key),
            }
            for key, value in MARKETS.items()
        ]
    }


@app.post("/api/analyze")
async def analyze(
    file: UploadFile = File(...),
    market: str = Form("US"),
    benchmark_name: str = Form("S&P 500"),
    period: str = Form("2y"),
    finnhub_key: str | None = Form(None),
) -> dict[str, Any]:
    if market not in MARKETS:
        raise HTTPException(status_code=400, detail="Unsupported market")

    benchmarks = benchmark_options(market)
    if benchmark_name not in benchmarks:
        benchmark_name = next(iter(benchmarks))

    benchmark = benchmarks[benchmark_name]
    effective_finnhub_key = finnhub_key or Config.FINNHUB_API_KEY

    try:
        content = await file.read()
        portfolio_df = load_portfolio(io.BytesIO(content), market=market)
        tickers = portfolio_df["ticker"].tolist()
        prices = download_prices(tickers, period, market=market)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    available = list(prices.columns)
    missing = [ticker for ticker in tickers if ticker not in available]
    portfolio_df = portfolio_df[portfolio_df["ticker"].isin(available)]
    tickers = portfolio_df["ticker"].tolist()

    if not tickers:
        raise HTTPException(status_code=400, detail="No valid tickers were found after price download.")

    prices = prices[tickers]
    benchmark_prices = download_benchmark(benchmark, period)
    latest = latest_prices(prices)
    portfolio = build_portfolio(portfolio_df, latest)

    metadata = [get_company_info(ticker) for ticker in tickers]
    portfolio = attach_company_metadata(portfolio, metadata)
    portfolio["market_cap_bucket"] = np.where(
        portfolio["market_cap"] > 2e11,
        "Large",
        np.where(portfolio["market_cap"] > 2e10, "Mid", "Small"),
    )

    asset_returns = daily_returns(prices)
    weights = portfolio["weight"].values
    port_returns = portfolio_returns(asset_returns, weights)
    bench_returns = benchmark_returns(benchmark_prices)
    beta = portfolio_beta(port_returns, bench_returns)

    perf = performance_summary(port_returns)
    risk = risk_summary(port_returns, bench_returns, weights)
    div = diversification_summary(weights)
    bench = benchmark_summary(port_returns, bench_returns, beta)

    company_names = portfolio.set_index("ticker")["name"].to_dict()
    news = recent_portfolio_news(
        tickers,
        effective_finnhub_key,
        days=14,
        limit_per_ticker=3,
        market=market,
        company_names=company_names,
    )
    news, news_sentiment = SentimentAnalyzer().analyze_news(news)
    quality = investment_quality_summary(perf, risk, div, news_sentiment)
    summary = portfolio_summary(portfolio)
    corr = correlation_matrix(asset_returns)
    comparison = align_returns(port_returns, bench_returns)
    cumulative = cumulative_comparison(comparison)

    return build_payload(
        market=market,
        benchmark_name=benchmark_name,
        effective_finnhub_key=effective_finnhub_key,
        portfolio=portfolio,
        prices=prices,
        port_returns=port_returns,
        perf=perf,
        risk=risk,
        div=div,
        bench=bench,
        news=news,
        news_sentiment=news_sentiment,
        quality=quality,
        summary=summary,
        corr=corr,
        cumulative=cumulative,
        missing=missing,
    )


@app.post("/api/chat")
def chat(request: ChatRequest) -> dict[str, str]:
    analysis = ANALYSES.get(request.analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found. Run portfolio analysis again.")

    api_key = request.groq_key or Config.GROQ_API_KEY
    if not api_key:
        raise HTTPException(status_code=400, detail="Groq API key is required for chat.")

    advisor = PortfolioAdvisor(api_key)
    answer = advisor.answer(
        context=analysis["context"],
        market=analysis["market"],
        benchmark_name=analysis["benchmark_name"],
        question=request.question,
    )
    return {"answer": answer}


@app.post("/api/goal")
def goal(request: GoalRequest) -> dict[str, Any]:
    analysis = ANALYSES.get(request.analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found. Run portfolio analysis again.")

    current_value = analysis["portfolio_value"]
    expected = request.expected_return / 100
    return {
        "futureValue": clean_value(future_value(current_value, expected, request.years)),
        "requiredCagr": clean_value(required_return(current_value, request.target, request.years)),
        "monthlyInvestment": clean_value(required_monthly_investment(request.target, current_value, expected, request.years)),
        "currency": analysis["currency"],
    }
