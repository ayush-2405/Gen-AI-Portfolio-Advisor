import { motion } from "framer-motion";

export function HealthGauge({ score, grade }: { score: number; grade?: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = 62;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c * 0.75; // 3/4 arc

  const color =
    clamped >= 75 ? "var(--positive)" : clamped >= 50 ? "var(--warning)" : "var(--negative)";

  return (
    <div className="flex items-center justify-center py-2">
      <div className="relative">
        <svg width="180" height="140" viewBox="0 0 180 140">
          <g transform="rotate(135 90 90)">
            <circle
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke="var(--border)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${c * 0.75} ${c}`}
            />
            <motion.circle
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${c * 0.75} ${c}`}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <div className="text-4xl font-semibold tabular-nums font-mono" style={{ color }}>
            {clamped.toFixed(0)}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {grade ? `Grade ${grade}` : "Score"}
          </div>
        </div>
      </div>
    </div>
  );
}
