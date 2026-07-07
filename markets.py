# config/markets.py

MARKETS = {
    "US": {
        "name": "United States",
        "currency": "$",
        "suffix": "",
        "default_benchmark": "^GSPC",
        "benchmarks": {
            "S&P 500": "^GSPC",
            "NASDAQ": "^IXIC",
            "Dow Jones": "^DJI",
        },
    },
    "NSE": {
        "name": "National Stock Exchange",
        "currency": "₹",
        "suffix": ".NS",
        "default_benchmark": "^NSEI",
        "benchmarks": {
            "NIFTY 50": "^NSEI",
            "NIFTY BANK": "^NSEBANK",
        },
    },
    "BSE": {
        "name": "Bombay Stock Exchange",
        "currency": "₹",
        "suffix": ".BO",
        "default_benchmark": "^BSESN",
        "benchmarks": {
            "SENSEX": "^BSESN",
        },
    },
}


def normalize_ticker(ticker: str, market: str) -> str:
    """
    Convert user ticker into Yahoo Finance ticker.
    """

    ticker = str(ticker).upper().strip()

    # Already Yahoo formatted
    if ticker.endswith(".NS") or ticker.endswith(".BO"):
        return ticker

    # Berkshire
    if ticker == "BRK.B":
        return "BRK-B"

    if ticker == "BRK/A":
        return "BRK-A"

    suffix = MARKETS[market]["suffix"]

    return ticker + suffix


def normalize_tickers(tickers, market):

    return [
        normalize_ticker(t, market)
        for t in tickers
    ]


def currency_symbol(market):

    return MARKETS[market]["currency"]


def default_benchmark(market):

    return MARKETS[market]["default_benchmark"]


def benchmark_options(market):

    return MARKETS[market]["benchmarks"]