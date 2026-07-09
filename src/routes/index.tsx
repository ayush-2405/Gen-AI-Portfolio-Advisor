import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCw, AlertCircle } from "lucide-react";
import { getMarkets, analyzePortfolio, apiError } from "@/lib/api";
import { useAnalysis } from "@/context/AnalysisContext";
import { UploadCard } from "@/components/portfolio/UploadCard";
import { AnalyzePipeline } from "@/components/portfolio/AnalyzePipeline";
import { ResultsDashboard } from "@/components/dashboard/ResultsDashboard";
import { ManualHoldingsCard } from "@/components/portfolio/ManualHoldingsCard";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Analyze Portfolio · Gen AI Portfolio Advisor" }],
  }),
  component: AnalyzePage,
});
const PERIODS = [
  { id: "6mo", label: "6 Months" },
  { id: "1y", label: "1 Year" },
  { id: "2y", label: "2 Years" },
  { id: "5y", label: "5 Years" },
  { id: "10y", label: "10 Years" },
] as const;

function AnalyzePage() {
  const [manualHoldings, setManualHoldings] = useState([
  {
    ticker: "",
    quantity: 0,
  },
]);
  const { analysis, setAnalysis } = useAnalysis();

  const { data: markets } = useQuery({ queryKey: ["markets"], queryFn: getMarkets, retry: 0 });

  const [file, setFile] = useState<File | null>(null);
  const [market, setMarket] = useState<string>("US");
  const [benchmarkName, setBenchmarkName] = useState<string>("S&P 500");
  const [period, setPeriod] = useState<string>("2y");
  const [uploadPct, setUploadPct] = useState(0);

  const benchmarks = useMemo(() => {
    const m = markets?.find((x) => x.id === market);
    return m ? Object.keys(m.benchmarks) : [];
  }, [markets, market]);

  useEffect(() => {
    if (benchmarks.length && !benchmarks.includes(benchmarkName)) {
      setBenchmarkName(benchmarks[0]);
    }
  }, [benchmarks, benchmarkName]);

  const mutation = useMutation({
    mutationFn: async () => {
      const validHoldings = manualHoldings.filter(
        (h) => h.ticker.trim() !== "" && h.quantity > 0
      );

      if (!file && validHoldings.length === 0) {
        throw new Error(
          "Upload a CSV or enter at least one holding."
        );
      }
      setUploadPct(0);
      return analyzePortfolio({
        file,
        manualHoldings: validHoldings,
        market,
        benchmarkName,
        period,
        onProgress: setUploadPct,
      });
    },
    onSuccess: (data) => setAnalysis(data),
  });

  const running = mutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Step 1</div>
          <h1 className="text-2xl font-semibold tracking-tight">Analyze Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Upload a CSV of your holdings and choose the market and benchmark. The advisor runs
            performance, risk, diversification, optimization, and Monte Carlo analytics, then
            enriches the results with AI insights.
          </p>
        </div>
        {analysis && !running && (
          <button
            onClick={() => {
              setAnalysis(null);
              setFile(null);
            }}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs hover:bg-secondary"
          >
            <RotateCw className="size-3.5" />
            New analysis
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {running ? (
          <motion.div key="pipe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnalyzePipeline uploadPct={uploadPct} />
          </motion.div>
        ) : !analysis ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            <div className="lg:col-span-2 space-y-4">
              <UploadCard file={file} onFile={setFile} />
              <ManualHoldingsCard
                holdings={manualHoldings}
                onChange={setManualHoldings}
              />
              {mutation.isError && (
                <div className="card-surface p-3 flex items-start gap-2 border-l-2 border-l-negative">
                  <AlertCircle className="size-4 text-negative shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-medium text-negative">Analysis failed</div>
                    <div className="text-muted-foreground mt-0.5">{apiError(mutation.error)}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="card-surface p-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Market</label>
                <select
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  className="mt-1 w-full bg-surface-2 border border-border rounded-md px-2.5 py-2 text-sm focus:outline-none focus:border-primary/50"
                >
                  {(markets || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.currency})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Benchmark</label>
                <select
                  value={benchmarkName}
                  onChange={(e) => setBenchmarkName(e.target.value)}
                  className="mt-1 w-full bg-surface-2 border border-border rounded-md px-2.5 py-2 text-sm focus:outline-none focus:border-primary/50"
                >
                  {benchmarks.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Analysis period
                </label>
                <div className="mt-1 grid grid-cols-5 gap-1">
                  {PERIODS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPeriod(p.id)}
                      className={`text-[11px] font-mono py-1.5 rounded border transition-colors ${
                        period === p.id
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p.id.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => mutation.mutate()}
                disabled={
                  !file &&
                  !manualHoldings.some(
                    (h) => h.ticker.trim() && h.quantity > 0
                  )
                }
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Play className="size-4" fill="currentColor" />
                Analyze Portfolio
              </button>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Upload a CSV or manually enter holdings below
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ResultsDashboard data={analysis} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
