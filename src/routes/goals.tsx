import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Target, TrendingUp, AlertCircle } from "lucide-react";
import { useAnalysis } from "@/context/AnalysisContext";
import { computeGoal, apiError, type GoalResponse } from "@/lib/api";
import { Card } from "@/components/common/Card";
import { fmtCurrencyFull, fmtPct } from "@/lib/format";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { AXIS, GRID_STROKE } from "@/components/charts/chart-theme";
import { useMemo } from "react";

export const Route = createFileRoute("/goals")({
  head: () => ({ meta: [{ title: "Goal Planner · Gen AI Portfolio Advisor" }] }),
  component: GoalsPage,
});

interface FormValues {
  target: number;
  years: number;
  expectedReturn: number;
}

function GoalsPage() {
  const { analysis } = useAnalysis();

  const defaultReturn = analysis
    ? Math.max(4, Math.min(20, (Number(analysis.performance.annualized_return ?? 0.08) * 100)))
    : 8;

  const { register, handleSubmit, watch, formState } = useForm<FormValues>({
    defaultValues: {
      target: analysis ? Math.round(Number(analysis.summary.total_value ?? 100000) * 2) : 500000,
      years: 10,
      expectedReturn: Math.round(defaultReturn * 10) / 10,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues): Promise<GoalResponse> => {
      if (!analysis) throw new Error("No analysis available.");
      return computeGoal({
        analysisId: analysis.analysisId,
        target: Number(values.target),
        years: Number(values.years),
        expectedReturn: Number(values.expectedReturn),
      });
    },
  });

  const years = Number(watch("years")) || 0;
  const expectedReturn = Number(watch("expectedReturn")) || 0;

  const projection = useMemo(() => {
    if (!analysis) return [];
    const start = Number(analysis.summary.total_value ?? 0);
    const r = expectedReturn / 100;
    const y = Math.max(1, Math.min(60, years));
    return Array.from({ length: y + 1 }, (_, i) => ({
      year: i,
      value: start * Math.pow(1 + r, i),
    }));
  }, [analysis, expectedReturn, years]);

  if (!analysis) return <EmptyState />;

  const currency = analysis.currency;
  const currentValue = Number(analysis.summary.total_value ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Goal Planner</div>
        <h1 className="text-2xl font-semibold tracking-tight">Project your investment goal</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Given your current portfolio value, target amount, and horizon, we compute the future
          value at your expected return, the required CAGR to hit the target, and the monthly
          contribution needed if you're short.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="card-surface p-5 space-y-4 lg:col-span-1">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Target amount ({currency})
            </label>
            <input
              type="number"
              step="1000"
              min={0}
              {...register("target", { required: true, min: 0 })}
              className="mt-1 w-full bg-surface-2 border border-border rounded-md px-2.5 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Investment horizon (years)
            </label>
            <input
              type="number"
              step="1"
              min={1}
              max={60}
              {...register("years", { required: true, min: 1, max: 60 })}
              className="mt-1 w-full bg-surface-2 border border-border rounded-md px-2.5 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Expected annual return (%)
            </label>
            <input
              type="number"
              step="0.1"
              min={-20}
              max={40}
              {...register("expectedReturn", { required: true })}
              className="mt-1 w-full bg-surface-2 border border-border rounded-md px-2.5 py-2 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
            <div className="text-[10px] text-muted-foreground mt-1">
              Portfolio's realized annualized return:{" "}
              <span className="font-mono">{fmtPct(Number(analysis.performance.annualized_return ?? 0))}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={mutation.isPending || !formState.isValid}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:brightness-110 disabled:opacity-40"
          >
            <Target className="size-4" />
            {mutation.isPending ? "Computing…" : "Compute goal"}
          </button>
          {mutation.isError && (
            <div className="flex items-start gap-2 text-xs text-negative">
              <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
              {apiError(mutation.error)}
            </div>
          )}
        </form>

        <div className="lg:col-span-2 space-y-4">
          {mutation.data ? (
            <GoalResults data={mutation.data} currentValue={currentValue} years={years} />
          ) : (
            <Card title="Projection Preview" subtitle="Growth of current portfolio at the expected return">
              <ProjectionChart data={projection} currency={currency} />
              <p className="text-[11px] text-muted-foreground mt-3">
                Submit the form to compute the future value, required CAGR, and required monthly
                investment.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function GoalResults({ data, currentValue, years }: { data: GoalResponse; currentValue: number; years: number }) {
  const currency = data.currency;
  const target = currentValue > 0 && data.requiredCagr > -1
    ? currentValue * Math.pow(1 + data.requiredCagr, years)
    : data.futureValue;
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card title="Future Value" subtitle="At your expected return" delay={0.05}>
          <div className="text-3xl font-mono tabular-nums font-semibold text-primary">
            {fmtCurrencyFull(data.futureValue, currency)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            in {years} year{years === 1 ? "" : "s"}
          </div>
        </Card>
        <Card title="Required CAGR" subtitle="To reach your target" delay={0.1}>
          <div className="text-3xl font-mono tabular-nums font-semibold">
            {fmtPct(data.requiredCagr, 2)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            From {fmtCurrencyFull(currentValue, currency)} to {fmtCurrencyFull(target, currency)}
          </div>
        </Card>
        <Card title="Monthly Investment" subtitle="If growth alone won't get there" delay={0.15}>
          <div className={`text-3xl font-mono tabular-nums font-semibold ${data.monthlyInvestment > 0 ? "text-warning" : "text-positive"}`}>
            {data.monthlyInvestment <= 0 ? "None needed" : fmtCurrencyFull(data.monthlyInvestment, currency)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {data.monthlyInvestment > 0 ? "per month at expected return" : "You are on track"}
          </div>
        </Card>
      </div>

      <Card title="Growth Trajectory" subtitle="Compounding of current portfolio value" delay={0.2}>
        <ProjectionChart
          currency={currency}
          data={Array.from({ length: Math.max(1, years) + 1 }, (_, i) => ({
            year: i,
            value: currentValue * Math.pow(1 + (data.futureValue / Math.max(currentValue, 1)) ** (1 / Math.max(years, 1)) - 1, i),
          }))}
        />
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-2">
          <TrendingUp className="size-3.5 text-primary" />
          Assumes constant expected return; no volatility drag.
        </div>
      </Card>
    </>
  );
}

function ProjectionChart({
  data,
  currency,
}: {
  data: { year: number; value: number }[];
  currency: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 8, right: 12, top: 6, bottom: 0 }}>
          <defs>
            <linearGradient id="gGoal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: AXIS.stroke, fontSize: AXIS.fontSize, fontFamily: AXIS.fontFamily }}
            axisLine={{ stroke: GRID_STROKE }}
            tickLine={false}
            tickFormatter={(v) => `Y${v}`}
          />
          <YAxis
            tick={{ fill: AXIS.stroke, fontSize: AXIS.fontSize, fontFamily: AXIS.fontFamily }}
            axisLine={{ stroke: GRID_STROKE }}
            tickLine={false}
            width={54}
            tickFormatter={(v: number) => {
              if (Math.abs(v) >= 1e6) return `${currency}${(v / 1e6).toFixed(1)}M`;
              if (Math.abs(v) >= 1e3) return `${currency}${(v / 1e3).toFixed(0)}K`;
              return `${currency}${v.toFixed(0)}`;
            }}
          />
          <ReferenceLine y={data[0]?.value} stroke={GRID_STROKE} strokeDasharray="4 4" />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(v: number) =>
              `${currency}${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
            }
            labelFormatter={(l) => `Year ${l}`}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#34d399"
            strokeWidth={1.8}
            fill="url(#gGoal)"
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-md mx-auto card-surface p-8 text-center mt-24">
      <div className="size-12 mx-auto rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center mb-4">
        <Target className="size-6 text-primary" />
      </div>
      <h2 className="text-lg font-semibold">Run an analysis first</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Goal projections use your analyzed portfolio's current value and expected return.
      </p>
      <Link
        to="/"
        className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Go to Analyze
      </Link>
    </div>
  );
}
