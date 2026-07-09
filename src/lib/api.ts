import axios, { AxiosError } from "axios";

export const API_BASE_URL =
  (typeof window !== "undefined" && window.localStorage?.getItem("apiBaseUrl")) ||
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ||
  "https://gen-ai-portfolio-advisor-1.onrender.com/";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120_000,
});

export function apiError(err: unknown): string {
  if (err instanceof AxiosError) {
    const detail = (err.response?.data as { detail?: string } | undefined)?.detail;
    if (detail) return detail;
    if (err.code === "ERR_NETWORK") return `Cannot reach backend at ${API_BASE_URL}. Is the FastAPI server running?`;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Unexpected error";
}

// ---------- Types (aligned with backend response shape) ----------

export interface MarketOption {
  id: string;
  name: string;
  currency: string;
  benchmarks: Record<string, string>;
}

export interface Holding {
  ticker: string;
  quantity: number;
  price: number;
  market_value: number;
  weight: number;
  sector: string;
  name: string;
  market_cap: number;
  market_cap_bucket: string;
  [k: string]: unknown;
}

export interface NewsItem {
  ticker?: string;
  headline?: string;
  summary?: string;
  url?: string;
  source?: string;
  datetime?: string;
  sentiment?: string;
  sentiment_score?: number;
  [k: string]: unknown;
}

export interface AnalysisResponse {
  analysisId: string;
  market: string;
  benchmarkName: string;
  currency: string;
  missingTickers: string[];
  summary: {
    total_value: number;
    num_holdings: number;
    [k: string]: unknown;
  };
  performance: {
    expected_return: number;
    annualized_return: number;
    volatility: number;
    sharpe: number;
    sortino: number;
    max_drawdown: number;
    [k: string]: unknown;
  };
  risk: {
    beta?: number;
    var_95?: number;
    cvar_95?: number;
    tracking_error?: number;
    downside_deviation?: number;
    [k: string]: unknown;
  };
  diversification: {
    hhi?: number;
    effective_holdings?: number;
    diversification_score?: number;
    [k: string]: unknown;
  };
  benchmark: {
    alpha?: number;
    beta?: number;
    information_ratio?: number;
    [k: string]: unknown;
  };
  quality: {
    score?: number;
    grade?: string;
    breakdown?: Record<string, number>;
    [k: string]: unknown;
  };
  newsSentiment: {
    overall?: string;
    score?: number;
    positive?: number;
    negative?: number;
    neutral?: number;
    [k: string]: unknown;
  };
  holdings: Holding[];
  news: NewsItem[];
  charts: {
    sectorAllocation: { name: string; weight: number }[];
    marketCapAllocation: { name: string; weight: number }[];
    holdingValues: { ticker: string; market_value: number; weight: number }[];
    cumulative: Array<Record<string, number | string | null>>;
    correlation: { columns: string[]; matrix: (number | null)[][] };
  };
  optimizer: {
    weights: Record<string, number>;
    performance: { expectedReturn: number; expectedVolatility: number; sharpe: number };
    rebalance: Array<Record<string, unknown>>;
  };
  monteCarlo: {
  summary: Record<string, number | null>;

  paths: Array<Record<string, number | null>>;

  bands: Array<{
    day: number;
    mean: number;
    median: number;
    p5: number;
    p95: number;
  }>;
};
}

export interface GoalResponse {
  futureValue: number;
  requiredCagr: number;
  monthlyInvestment: number;
  currency: string;
}

// ---------- Endpoints ----------

export async function getHealth(): Promise<{ status: string }> {
  const { data } = await api.get("/api/health");
  return data;
}

export async function getMarkets(): Promise<MarketOption[]> {
  const { data } = await api.get<{ markets: MarketOption[] }>("/api/markets");
  return data.markets;
}

export async function analyzePortfolio(params: {
  file: File;
  market: string;
  benchmarkName: string;
  period: string;
  finnhubKey?: string;
  onProgress?: (pct: number) => void;
}): Promise<AnalysisResponse> {
  const form = new FormData();

  form.append("file", params.file);
  form.append("market", params.market);
  form.append("benchmark_name", params.benchmarkName);
  form.append("period", params.period);

  if (params.finnhubKey) {
    form.append("finnhub_key", params.finnhubKey);
  }

  const { data } = await api.post("/api/analyze", form, {
    onUploadProgress: (e) => {
      if (e.total && params.onProgress) {
        params.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });

  // Normalize backend response to frontend schema
  return {
    ...data,

    performance: {
      expected_return:
        data.performance?.["Annual Return"] ?? 0,

      annualized_return:
        data.performance?.["Annual Return"] ?? 0,

      volatility:
        data.performance?.["Annual Volatility"] ?? 0,

      sharpe:
        data.performance?.["Sharpe Ratio"] ?? 0,

      sortino:
        data.performance?.["Sortino Ratio"] ?? 0,

      max_drawdown:
        Math.abs(data.performance?.["Max Drawdown"] ?? 0),
    },
    charts: {
      ...data.charts,

      cumulative: (data.charts?.cumulative ?? []).map((row: any) => ({
        date: row.date ?? row.Date,
        Portfolio: row.Portfolio ?? row.portfolio,
        Benchmark: row.Benchmark ?? row.benchmark,
      })),
    },
    risk: {
      beta:
        data.risk?.["Beta"] ?? null,

      var_95:
        data.risk?.["VaR (95%)"] ?? null,

      cvar_95:
        data.risk?.["CVaR (95%)"] ?? null,

      tracking_error:
        data.risk?.["Tracking Error"] ?? null,

      downside_deviation:
        data.risk?.["Downside Deviation"] ?? null,
    },

    diversification: {
      diversification_score:
        data.diversification?.["Diversification Score"] ?? null,

      hhi:
        data.diversification?.["HHI"] ?? null,

      effective_holdings:
        data.diversification?.["Effective Holdings"] ?? null,
    },

    benchmark: {
      alpha:
        data.benchmark?.["Alpha"] ?? null,

      beta:
        data.benchmark?.["Beta"] ?? null,

      information_ratio:
        data.risk?.["Information Ratio"] ?? null,
    },

    quality: {
      score:
        data.quality?.["Investment Quality Score"] ?? 0,

      grade:
        data.quality?.["Investment Quality Label"] ?? "",

      breakdown:
        data.quality?.["Quality Components"] ?? {},
    },

    newsSentiment: {
      overall:
        data.newsSentiment?.["News Sentiment Label"] ?? "Neutral",

      score:
        data.newsSentiment?.["Average News Sentiment"] ?? 0,

      positive: 0,
      neutral: 0,
      negative: 0,
    },
    monteCarlo: {
      summary: data.monteCarlo?.summary ?? {},

      paths: data.monteCarlo?.paths ?? [],

      bands: data.monteCarlo?.bands ?? [],
    },
    holdings:
      (data.holdings ?? []).map((h: any) => ({
        ...h,

        quantity:
          h.quantity ?? h.shares ?? 0,

        price:
          h.price ?? h.latest_price ?? 0,
      })),
  };
}

export async function askAI(params: { analysisId: string; question: string; groqKey?: string }): Promise<string> {
  const { data } = await api.post<{ answer: string }>("/api/chat", {
    analysis_id: params.analysisId,
    question: params.question,
    groq_key: params.groqKey,
  });
  return data.answer;
}

export async function computeGoal(params: {
  analysisId: string;
  target: number;
  years: number;
  expectedReturn: number;
}): Promise<GoalResponse> {
  const { data } = await api.post<GoalResponse>("/api/goal", {
    analysis_id: params.analysisId,
    target: params.target,
    years: params.years,
    expected_return: params.expectedReturn,
  });
  return data;
}
