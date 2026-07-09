import { useMemo, useState } from "react";
import type { AnalysisResponse } from "@/lib/api";
import { Card } from "@/components/common/Card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { HealthGauge } from "@/components/dashboard/HealthGauge";
import { AllocationDonut, AllocationLegend } from "@/components/charts/AllocationDonut";
import { CumulativeChart } from "@/components/charts/CumulativeChart";
import { CorrelationHeatmap } from "@/components/charts/CorrelationHeatmap";
import { MonteCarloChart } from "@/components/charts/MonteCarloChart";
import { HorizontalBar } from "@/components/charts/HorizontalBar";
import { CountUp } from "@/components/common/CountUp";
import { fmtCurrency, fmtCurrencyFull, fmtNum, fmtPct, toneClass } from "@/lib/format";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

function SentimentBadge({ sentiment }: { sentiment?: string }) {
  const s = (sentiment || "neutral").toLowerCase();
  const cls =
    s === "positive"
      ? "bg-positive-soft"
      : s === "negative"
        ? "bg-negative-soft"
        : "bg-warning-soft";
  const Icon = s === "positive" ? TrendingUp : s === "negative" ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${cls}`}>
      <Icon className="size-3" />
      {sentiment || "neutral"}
    </span>
  );
}

export function ResultsDashboard({ data }: { data: AnalysisResponse }) {
  const { currency, summary, performance, risk, benchmark, diversification, quality, newsSentiment, charts, optimizer, monteCarlo, holdings, news, missingTickers } = data;

  const sectorData = useMemo(
    () => (charts.sectorAllocation || []).filter((d) => d.weight != null),
    [charts.sectorAllocation],
  );
  const mcapData = useMemo(
    () => (charts.marketCapAllocation || []).filter((d) => d.weight != null),
    [charts.marketCapAllocation],
  );
  const topHoldings = useMemo(
    () =>
      [...(charts.holdingValues || [])]
        .filter((h) => h.market_value != null)
        .slice(0, 12)
        .map((h) => ({ ...h })),
    [charts.holdingValues],
  );

  const optimizedWeights = useMemo(
    () =>
      Object.entries(optimizer.weights || {})
        .filter(([, w]) => (w as number) > 0.001)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map(([ticker, w]) => ({ name: ticker, weight: w as number })),
    [optimizer.weights],
  );

  const [holdingsPage, setHoldingsPage] = useState(0);
  const PAGE = 10;
  const pagedHoldings = holdings.slice(holdingsPage * PAGE, holdingsPage * PAGE + PAGE);
  const totalPages = Math.max(1, Math.ceil(holdings.length / PAGE));

  const qualityScore = Number(quality?.score ?? 0);
  const qualityGrade = quality?.grade as string | undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {missingTickers?.length > 0 && (
        <div className="card-surface p-3 flex items-start gap-2 border-l-2 border-l-warning">
          <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-medium">Missing price data:</span>{" "}
            <span className="font-mono text-muted-foreground">{missingTickers.join(", ")}</span>{" "}
            <span className="text-muted-foreground">— excluded from analysis.</span>
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          label="Portfolio Value"
          value={<CountUp value={Number(summary?.total_value ?? 0)} format={(v) => fmtCurrencyFull(v, currency)} />}
          hint={`${summary?.num_holdings ?? holdings.length} holdings`}
          delay={0}
        />
        <MetricCard
          label="Annualized Return"
          value={<CountUp value={Number(performance?.annualized_return ?? 0) * 100} format={(v) => `${v.toFixed(2)}%`} />}
          tone={(performance?.annualized_return ?? 0) >= 0 ? "positive" : "negative"}
          delay={0.05}
        />
        <MetricCard
          label="Volatility"
          value={<CountUp value={Number(performance?.volatility ?? 0) * 100} format={(v) => `${v.toFixed(2)}%`} />}
          delay={0.1}
        />
        <MetricCard
          label="Sharpe Ratio"
          value={<CountUp value={Number(performance?.sharpe ?? 0)} format={(v) => v.toFixed(2)} />}
          tone={(performance?.sharpe ?? 0) >= 1 ? "positive" : (performance?.sharpe ?? 0) < 0 ? "negative" : "neutral"}
          delay={0.15}
        />
        <MetricCard
          label="Sortino Ratio"
          value={<CountUp value={Number(performance?.sortino ?? 0)} format={(v) => v.toFixed(2)} />}
          tone={(performance?.sortino ?? 0) >= 1 ? "positive" : "neutral"}
          delay={0.2}
        />
        <MetricCard
          label="Max Drawdown"
          value={<CountUp value={Number(performance?.max_drawdown ?? 0) * 100} format={(v) => `${v.toFixed(2)}%`} />}
          tone="negative"
          delay={0.25}
        />
      </div>

      {/* Row: Health + Risk + Benchmark + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card title="Portfolio Health" subtitle="Composite quality score" delay={0.05}>
          <HealthGauge score={qualityScore} grade={qualityGrade} />
          {quality?.breakdown && (
            <ul className="mt-3 space-y-1.5">
              {Object.entries(quality.breakdown).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                  <span className="font-mono tabular-nums">{Number(v).toFixed(1)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Risk Metrics" delay={0.1}>
          <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <MiniStat label="Beta" value={fmtNum(risk?.beta as number | undefined)} />
            <MiniStat label="Alpha" value={fmtPct(benchmark?.alpha as number | undefined)} tone={toneClass(benchmark?.alpha as number | undefined)} />
            <MiniStat label="VaR 95%" value={fmtPct(risk?.var_95 as number | undefined)} tone="text-negative" />
            <MiniStat label="CVaR 95%" value={fmtPct(risk?.cvar_95 as number | undefined)} tone="text-negative" />
            <MiniStat label="Tracking Err." value={fmtPct(risk?.tracking_error as number | undefined)} />
            <MiniStat label="Downside Dev." value={fmtPct(risk?.downside_deviation as number | undefined)} />
          </dl>
        </Card>

        <Card title="Benchmark Comparison" subtitle={data.benchmarkName} delay={0.15}>
          <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <MiniStat label="Alpha" value={fmtPct(benchmark?.alpha as number | undefined)} tone={toneClass(benchmark?.alpha as number | undefined)} />
            <MiniStat label="Beta" value={fmtNum(benchmark?.beta as number | undefined)} />
            <MiniStat label="Info Ratio" value={fmtNum(benchmark?.information_ratio as number | undefined)} />
            <MiniStat label="Diversification" value={fmtNum(diversification?.diversification_score as number | undefined)} />
            <MiniStat label="Effective N" value={fmtNum(diversification?.effective_holdings as number | undefined, 1)} />
            <MiniStat label="HHI" value={fmtNum(diversification?.hhi as number | undefined, 3)} />
          </dl>
        </Card>

        <Card title="News Sentiment" subtitle="14-day rolling" delay={0.2}>
          <div className="flex items-center justify-between mb-3">
            <SentimentBadge sentiment={newsSentiment?.overall as string | undefined} />
            <div className="text-2xl font-mono tabular-nums font-semibold">
              {typeof newsSentiment?.score === "number" ? (newsSentiment.score as number).toFixed(2) : "—"}
            </div>
          </div>
          {/* <div className="space-y-1.5">
            <SentimentBar label="Positive" value={Number(newsSentiment?.positive ?? 0)} tone="var(--positive)" />
            <SentimentBar label="Neutral" value={Number(newsSentiment?.neutral ?? 0)} tone="var(--muted-foreground)" />
            <SentimentBar label="Negative" value={Number(newsSentiment?.negative ?? 0)} tone="var(--negative)" />
          </div> */}
        </Card>
      </div>

      {/* Allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Sector Allocation" delay={0.05}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <AllocationDonut data={sectorData} />
            <AllocationLegend data={sectorData} />
          </div>
        </Card>
        <Card title="Market Cap Allocation" delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <AllocationDonut data={mcapData} />
            <AllocationLegend data={mcapData} />
          </div>
        </Card>
      </div>

      {/* Holdings bar + Performance chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Top Holdings by Value" delay={0.05}>
          <HorizontalBar
            data={topHoldings as unknown as Array<Record<string, number | string>>}
            labelKey="ticker"
            valueKey="market_value"
            formatValue={(v) => fmtCurrency(v, currency)}
            height={Math.max(220, topHoldings.length * 22)}
          />
        </Card>
        <Card title="Cumulative Performance" subtitle={`Portfolio vs ${data.benchmarkName}`} delay={0.1}>
          <CumulativeChart data={charts.cumulative} />
        </Card>
      </div>

      {/* Correlation + Monte Carlo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Correlation Matrix" subtitle="Daily-return correlations" delay={0.05}>
          <CorrelationHeatmap columns={charts.correlation.columns} matrix={charts.correlation.matrix} />
        </Card>
        <Card
          title="Monte Carlo Simulation"
          subtitle="10000 paths · 1-year horizon"
          delay={0.1}
          right={
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Median</div>
              <div className="text-sm font-mono">
                {fmtCurrency(Number(monteCarlo.summary?.Median ?? 0), currency)}
              </div>
            </div>
          }
        >
          <MonteCarloChart
          paths={monteCarlo.paths as Array<Record<string, number | null>>}
          bands={monteCarlo.bands as Array<{
            day: number;
            mean: number;
            median: number;
            p5: number;
            p95: number;
          }>}
        />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            {Object.entries(monteCarlo.summary || {}).map(([k, v]) => {
              const isProbability =
                k.toLowerCase().replace(/\s+/g, "").includes("probabilityofprofit");

              return (
                <div
                  key={k}
                  className="rounded-md border border-border bg-surface-2 px-3 py-2"
                >
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {k.replace(/_/g, " ")}
                  </div>

                  <div className="text-sm font-mono tabular-nums">
                    {typeof v !== "number"
                      ? "—"
                      : isProbability
                      ? `${(v * 100).toFixed(1)}%`
                      : fmtCurrency(v, currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Optimizer */}
      <Card
        title="Optimized Portfolio (Max Sharpe)"
        subtitle="Mean-variance efficient frontier tangent"
        delay={0.05}
        right={
          <div className="flex gap-4 text-right text-[11px]">
            <div>
              <div className="uppercase tracking-widest text-muted-foreground">Exp. Return</div>
              <div className="font-mono tabular-nums text-positive">
                {fmtPct(optimizer.performance.expectedReturn)}
              </div>
            </div>
            <div>
              <div className="uppercase tracking-widest text-muted-foreground">Volatility</div>
              <div className="font-mono tabular-nums">{fmtPct(optimizer.performance.expectedVolatility)}</div>
            </div>
            <div>
              <div className="uppercase tracking-widest text-muted-foreground">Sharpe</div>
              <div className="font-mono tabular-nums text-primary">{fmtNum(optimizer.performance.sharpe)}</div>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="grid grid-cols-2 gap-4 items-center">
            <AllocationDonut data={optimizedWeights} />
            <AllocationLegend data={optimizedWeights.slice(0, 10)} />
          </div>
          <div className="overflow-auto scrollbar-thin max-h-72">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-muted-foreground text-[10px] uppercase tracking-widest">
                  <th className="text-left py-2 px-2 font-normal">Ticker</th>
                  <th className="text-right py-2 px-2 font-normal">Current</th>
                  <th className="text-right py-2 px-2 font-normal">Target</th>
                  <th className="text-right py-2 px-2 font-normal">Δ</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {optimizer.rebalance.slice(0, 30).map((row, i) => {
                  const cur = Number(
                  row.current_weight ??
                  row.current ??
                  row.Current ??
                  0
                );

                const tgt = Number(
                  row.target_weight ??
                  row.target ??
                  row.Target ??
                  0
                );

                const delta = Number(
                  row.Difference ??
                  (tgt - cur)
                );
                  return (
                    <tr key={i} className="border-t border-border">
                      <td className="py-1.5 px-2">{String(row.ticker)}</td>
                      <td className="text-right py-1.5 px-2 text-muted-foreground">{(cur * 100).toFixed(2)}%</td>
                      <td className="text-right py-1.5 px-2">{(tgt * 100).toFixed(2)}%</td>
                      <td className={`text-right py-1.5 px-2 ${toneClass(delta)}`}>
                        {(delta >= 0 ? "+" : "") + (delta * 100).toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Holdings table + News */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Holdings" className="lg:col-span-2" delay={0.05}>
          <div className="overflow-auto scrollbar-thin">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground text-[10px] uppercase tracking-widest">
                  <th className="text-left py-2 pr-3 font-normal">Ticker</th>
                  <th className="text-left py-2 pr-3 font-normal">Name</th>
                  <th className="text-left py-2 pr-3 font-normal">Sector</th>
                  <th className="text-right py-2 pr-3 font-normal">Qty</th>
                  <th className="text-right py-2 pr-3 font-normal">Price</th>
                  <th className="text-right py-2 pr-3 font-normal">Value</th>
                  <th className="text-right py-2 pr-3 font-normal">Weight</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {pagedHoldings.map((h) => (
                  <tr key={h.ticker} className="border-t border-border hover:bg-surface-2/50">
                    <td className="py-2 pr-3 font-semibold">{h.ticker}</td>
                    <td className="py-2 pr-3 text-muted-foreground truncate max-w-[180px]">{h.name}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{h.sector}</td>
                    <td className="text-right py-2 pr-3 tabular-nums">{fmtNum(h.quantity, 2)}</td>
                    <td className="text-right py-2 pr-3 tabular-nums">{fmtCurrency(h.price, currency, 2)}</td>
                    <td className="text-right py-2 pr-3 tabular-nums">{fmtCurrency(h.market_value, currency)}</td>
                    <td className="text-right py-2 pr-3 tabular-nums">{(h.weight * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 text-[11px] text-muted-foreground">
              <span>
                Page {holdingsPage + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={holdingsPage === 0}
                  onClick={() => setHoldingsPage((p) => Math.max(0, p - 1))}
                  className="px-2 py-1 rounded border border-border hover:bg-surface-2 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  disabled={holdingsPage >= totalPages - 1}
                  onClick={() => setHoldingsPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="px-2 py-1 rounded border border-border hover:bg-surface-2 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>

        <Card title="Recent News" subtitle="Portfolio-relevant headlines" delay={0.1}>
          <ul className="space-y-3 max-h-96 overflow-auto scrollbar-thin pr-1">
            {(news || []).slice(0, 20).map((n, i) => (
              <li key={i} className="text-xs border-b border-border pb-2 last:border-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-[10px] text-primary">{String(n.ticker || "")}</span>
                  {n.sentiment && <SentimentBadge sentiment={String(n.sentiment)} />}
                </div>
                <a
                  href={String(n.url || "#")}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-foreground hover:text-primary line-clamp-2"
                >
                  {String(n.headline || n.summary || "")}
                </a>
                <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                  {n.source && <span>{String(n.source)}</span>}
                  {n.datetime && <span> · {String(n.datetime).slice(0, 10)}</span>}
                </div>
              </li>
            ))}
            {(!news || news.length === 0) && (
              <li className="text-xs text-muted-foreground italic">No news available.</li>
            )}
          </ul>
        </Card>
      </div>
    </motion.div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className={`font-mono tabular-nums text-[15px] ${tone || ""}`}>{value}</dd>
    </div>
  );
}

function SentimentBar({ label, value, tone }: { label: string; value: number; tone: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div>
      <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
        <span>{label}</span>
        <span className="font-mono">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-surface-2 rounded overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: tone }}
          className="h-full"
        />
      </div>
    </div>
  );
}
