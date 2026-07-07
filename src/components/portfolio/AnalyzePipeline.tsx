import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const STEPS = [
  "Validating portfolio",
  "Uploading CSV",
  "Fetching market data",
  "Running portfolio analytics",
  "Running AI enrichment",
  "Building dashboard",
];

export function AnalyzePipeline({ uploadPct }: { uploadPct: number }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // step 0..1 driven by upload
    if (uploadPct < 5) setStep(0);
    else if (uploadPct < 95) setStep(1);
    else setStep((s) => Math.max(s, 2));
  }, [uploadPct]);

  useEffect(() => {
    if (step < 2) return;
    if (step >= STEPS.length - 1) return;
    const durations = [2200, 4500, 2500, 1500];
    const t = setTimeout(() => setStep((s) => s + 1), durations[step - 2] || 2000);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card-surface p-6 max-w-xl mx-auto"
    >
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-4">
        Analysis pipeline
      </div>
      <ul className="space-y-2.5">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex items-center gap-3 text-sm">
              <div
                className={`size-6 rounded-full flex items-center justify-center border ${
                  done
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : active
                      ? "border-primary/40 text-primary"
                      : "border-border text-muted-foreground"
                }`}
              >
                <AnimatePresence mode="wait">
                  {done ? (
                    <motion.span
                      key="d"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <Check className="size-3.5" />
                    </motion.span>
                  ) : active ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <span className="text-[10px] font-mono">{i + 1}</span>
                  )}
                </AnimatePresence>
              </div>
              <span className={done ? "text-muted-foreground line-through decoration-border" : active ? "text-foreground" : "text-muted-foreground"}>
                {label}
                {i === 1 && active && (
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                    {uploadPct}%
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
