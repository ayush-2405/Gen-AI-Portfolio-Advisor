import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
  mono = true,
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "positive" | "negative" | "neutral" | "primary";
  mono?: boolean;
  delay?: number;
}) {
  const toneClass =
    tone === "positive"
      ? "text-positive"
      : tone === "negative"
        ? "text-negative"
        : tone === "primary"
          ? "text-primary"
          : "text-foreground";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
      className="card-surface px-4 py-3"
    >
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${toneClass} ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </motion.div>
  );
}
