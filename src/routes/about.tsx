import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/common/Card";
import { Cpu, Database, GitBranch, ShieldAlert, Sparkles, Code2 } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About · Gen AI Portfolio Advisor" }] }),
  component: AboutPage,
});

const STACK = [
  { label: "Frontend", items: ["React 19", "TanStack Router & Query", "Tailwind CSS", "Framer Motion", "Recharts", "React Hook Form", "Axios"] },
  { label: "Backend", items: ["FastAPI", "Pandas / NumPy", "yfinance", "Finnhub", "PyPortfolioOpt-style optimizer", "Monte Carlo simulator"] },
  { label: "AI", items: ["Groq LLM (Llama-family)", "VADER-based sentiment on portfolio news", "Grounded context injection from analytics"] },
];

const PIPELINE = [
  "Portfolio CSV parsed and normalized to Yahoo Finance tickers.",
  "Daily prices and benchmark downloaded across the selected period.",
  "Returns, volatility, drawdown, Sharpe/Sortino, beta and alpha computed.",
  "Diversification (HHI, effective N) and risk (VaR, CVaR, tracking error) measured.",
  "Mean-variance optimizer solves for the maximum-Sharpe portfolio.",
  "Monte Carlo simulator runs 1,000 paths across a 252-day horizon.",
  "Portfolio news fetched, sentiment scored, and folded into a quality composite.",
  "All analytics assembled into a single grounded context for the AI advisor.",
];

function AboutPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">About</div>
        <h1 className="text-2xl font-semibold tracking-tight">Gen AI Portfolio Advisor</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          A research-grade portfolio analytics workbench that unifies quantitative risk and
          performance analytics with LLM-driven qualitative reasoning. Upload a portfolio, choose
          a market and benchmark, and the advisor produces a full analytics dashboard, an
          efficient-frontier rebalance, a Monte Carlo simulation, a news-sentiment overlay, and
          a chat interface grounded in your specific holdings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STACK.map((group) => (
          <Card key={group.label} title={group.label} padded>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {group.items.map((it) => (
                <li key={it} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1 rounded-full bg-primary shrink-0" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card
        title="Analysis pipeline"
        subtitle="From raw CSV to grounded AI answer"
        right={<GitBranch className="size-4 text-muted-foreground" />}
      >
        <ol className="space-y-2 text-sm">
          {PIPELINE.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 size-5 rounded-md bg-surface-2 border border-border text-[10px] font-mono flex items-center justify-center text-muted-foreground">
                {i + 1}
              </span>
              <span className="text-muted-foreground leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Data sources" right={<Database className="size-4 text-muted-foreground" />}>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>Yahoo Finance — historical prices and company metadata</li>
            <li>Finnhub — company news</li>
            <li>Benchmark indices — S&amp;P 500, NASDAQ, NIFTY 50, SENSEX, and more</li>
          </ul>
        </Card>
        <Card title="AI Models" right={<Sparkles className="size-4 text-muted-foreground" />}>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>Groq-hosted Llama LLM for portfolio Q&amp;A</li>
            <li>VADER for news sentiment scoring</li>
            <li>Analytics-grounded context prompting (RAG-style)</li>
          </ul>
        </Card>
        <Card title="Architecture" right={<Cpu className="size-4 text-muted-foreground" />}>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>Stateless FastAPI service, in-memory analysis cache keyed by <span className="font-mono">analysisId</span></li>
            <li>SPA frontend with React Query cache and route-based navigation</li>
            <li>Charts rendered client-side from server-computed datasets</li>
          </ul>
        </Card>
      </div>

      <Card title="Disclaimer" right={<ShieldAlert className="size-4 text-warning" />}>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This application is a research and educational tool. Nothing shown here constitutes
          investment advice, a solicitation to buy or sell any security, or a recommendation of
          any kind. Historical performance, simulated outcomes, and AI-generated commentary are
          not indicative of future results. Consult a licensed financial professional before
          making investment decisions.
        </p>
      </Card>

      <Card title="Repository" right={<Code2 className="size-4 text-muted-foreground" />}>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The Python backend lives under <span className="font-mono">/backend</span> in this
          workspace. Run it locally with{" "}
          <span className="font-mono">
            uvicorn backend.main:app --reload --port 8000
          </span>
          . The frontend reads its API base URL from{" "}
          <span className="font-mono">VITE_API_BASE_URL</span> or the settings menu in the header.
        </p>
      </Card>
    </div>
  );
}
