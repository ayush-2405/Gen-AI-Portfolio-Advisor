import { Link, useRouterState } from "@tanstack/react-router";
import { LineChart, Sparkles, Target, Info, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  { to: "/", label: "Analyze Portfolio", icon: LineChart },
  { to: "/insights", label: "AI Insights", icon: Sparkles },
  { to: "/goals", label: "Goal Planner", icon: Target },
  { to: "/about", label: "About", icon: Info },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
        <div className="size-8 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
          <TrendingUp className="size-4 text-primary" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-tight">Portfolio Advisor</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Gen AI</div>
        </div>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="relative flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md bg-primary/10 border border-primary/25"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className={`size-4 relative z-10 ${active ? "text-primary" : ""}`} />
              <span className={`relative z-10 ${active ? "text-foreground font-medium" : ""}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="rounded-md bg-surface-2 border border-border p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Disclaimer</div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Research & educational tool. Not investment advice.
          </p>
        </div>
      </div>
    </aside>
  );
}
