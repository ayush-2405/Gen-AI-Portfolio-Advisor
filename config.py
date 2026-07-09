from dataclasses import dataclass
import os
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    DEFAULT_PERIOD = "2y"
    RISK_FREE_RATE = 0.045
    DEFAULT_MARKET = "US"
    FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    CACHE_TTL = 3600

    THREADS = 8

    MONTE_CARLO_SIMULATIONS = 10000
