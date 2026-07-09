import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, User, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import { useAnalysis } from "@/context/AnalysisContext";
import { askAI, apiError } from "@/lib/api";
import { Card } from "@/components/common/Card";
import { fmtPct, fmtNum } from "@/lib/format";

export const Route = createFileRoute("/insights")({
  head: () => ({ meta: [{ title: "AI Insights · Gen AI Portfolio Advisor" }] }),
  component: InsightsPage,
});

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What are the biggest risks in this portfolio?",
  "Where am I over-concentrated?",
  "How should I diversify without hurting expected return?",
  "Summarize the portfolio in three bullet points.",
];

function InsightsPage() {
  const { analysis } = useAnalysis();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat = useMutation({
    mutationFn: async (question: string) => {
      if (!analysis) throw new Error("No analysis available.");
      return askAI({ analysisId: analysis.analysisId, question });
    },
    onSuccess: (answer) => setMessages((m) => [...m, { role: "assistant", content: answer }]),
    onError: (err) =>
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `**Error:** ${apiError(err)}`,
        },
      ]),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chat.isPending]);

  if (!analysis) {
    return <EmptyState />;
  }

  const send = (text: string) => {
    const q = text.trim();
    if (!q || chat.isPending) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    chat.mutate(q);
  };

  return (
    <div className="space-y-6 grid grid-cols-1 xl:grid-cols-3 xl:gap-4 xl:space-y-0">
      <div className="xl:col-span-2 space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">AI Insights</div>
          <h1 className="text-2xl font-semibold tracking-tight">Ask the Portfolio Advisor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            An LLM analyzes your portfolio's holdings, performance, risk, and sentiment. Answers
            are grounded in the analysis you ran on the previous step.
          </p>
        </div>

        <Card padded={false} className="flex flex-col h-[calc(100vh-260px)] min-h-[520px]">
          <div ref={scrollRef} className="flex-1 overflow-auto scrollbar-thin px-5 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="size-10 mx-auto rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center mb-3">
                  <Sparkles className="size-5 text-primary" />
                </div>
                <div className="text-sm font-medium">Start with a question</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Or pick a suggestion below.
                </div>
                <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-[11px] px-2.5 py-1.5 rounded-full border border-border bg-surface-2 hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {chat.isPending && <TypingIndicator />}
          </div>
          <div className="border-t border-border p-3 flex items-end gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about risk, diversification, allocation, sectors…"
              className="flex-1 resize-none bg-surface-2 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50 max-h-32"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || chat.isPending}
              className="size-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:brightness-110"
            >
              <Send className="size-4" />
            </button>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="Portfolio Snapshot" subtitle="Context passed to the advisor">
          <dl className="space-y-2 text-xs">
            <SnapRow label="Value" value={`${analysis.currency}${Number(analysis.summary.total_value ?? 0).toLocaleString()}`} />
            <SnapRow label="Holdings" value={String(analysis.summary.num_holdings ?? analysis.holdings.length)} />
            <SnapRow label="Market" value={analysis.market} />
            <SnapRow label="Benchmark" value={analysis.benchmarkName} />
            <SnapRow label="Sharpe" value={fmtNum(Number(analysis.performance.sharpe ?? 0))} />
            <SnapRow label="Volatility" value={fmtPct(Number(analysis.performance.volatility ?? 0))} />
            <SnapRow label="Ann. Return" value={fmtPct(Number(analysis.performance.annualized_return ?? 0))} />
            <SnapRow label="Beta" value={fmtNum(Number(analysis.risk.beta ?? 0))} />
            <SnapRow label="Max DD" value={fmtPct(Number(analysis.performance.max_drawdown ?? 0))} />
            <SnapRow label="Sentiment" value={String(analysis.newsSentiment.overall ?? "—")} />
          </dl>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <RotateCw className="size-3" />
              Clear conversation
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}

function SnapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-1 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-start gap-3 w-full ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`size-7 shrink-0 rounded-md flex items-center justify-center border ${
          isUser
            ? "bg-primary/15 border-primary/30 text-primary"
            : "bg-surface-2 border-border text-primary"
        }`}
      >
        {isUser ? <User className="size-3.5" /> : <Sparkles className="size-3.5" />}
      </div>
      <div
  className={`flex-1 min-w-0 flex ${isUser ? "justify-end" : "justify-start"}`}
>
  {isUser ? (
    <div className="max-w-[85%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm whitespace-pre-wrap break-words">
      {message.content}
    </div>
  ) : (
    <div className="w-full">
      <div className="rounded-lg border border-border bg-surface-2 px-4 py-3 w-full">
        <div className="md-body w-full">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  )}
</div>
    </motion.div>
  );
}
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="size-7 shrink-0 rounded-md flex items-center justify-center bg-surface-2 border border-border text-primary">
        <Sparkles className="size-3.5" />
      </div>
      <div className="flex items-center gap-1 h-7">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-md mx-auto card-surface p-8 text-center mt-24">
      <div className="size-12 mx-auto rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center mb-4">
        <Sparkles className="size-6 text-primary" />
      </div>
      <h2 className="text-lg font-semibold">Run an analysis first</h2>
      <p className="text-sm text-muted-foreground mt-1">
        AI Insights are grounded in your analyzed portfolio. Head to Analyze to upload a CSV.
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
