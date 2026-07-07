import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function Card({
  title,
  subtitle,
  right,
  children,
  className = "",
  padded = true,
  delay = 0,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`card-surface ${className}`}
    >
      {(title || right) && (
        <header className="flex items-start justify-between px-5 py-3 border-b border-border">
          <div>
            {title && <h3 className="text-[13px] font-semibold tracking-tight">{title}</h3>}
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </motion.section>
  );
}
