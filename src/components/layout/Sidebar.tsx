import { Link, useRouterState } from "@tanstack/react-router";
import { LineChart, Sparkles, Target, Info, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useSidebar } from "@/context/SidebarContext";
import { useIsMobile } from "@/hooks/use-mobile";
const items = [
  { to: "/", label: "Analyze Portfolio", icon: LineChart },
  { to: "/insights", label: "AI Insights", icon: Sparkles },
  { to: "/goals", label: "Goal Planner", icon: Target },
  { to: "/about", label: "About", icon: Info },
] as const;

export function Sidebar() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });
  const { setOpen } = useSidebar();
  const isMobile = useIsMobile();
  return (
    <aside className="w-60 h-full border-r border-border bg-surface flex flex-col">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
        <div className="size-8 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
          <TrendingUp className="size-4 text-primary" />
        </div>

        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-tight">
            Portfolio Advisor
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Gen AI
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => {
                if (isMobile) setOpen(false);
              }}
              className="relative flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md border border-primary/25 bg-primary/10"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 32,
                  }}
                />
              )}

              <Icon
                className={`relative z-10 size-4 ${
                  active ? "text-primary" : ""
                }`}
              />

              <span
                className={`relative z-10 ${
                  active ? "font-medium text-foreground" : ""
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3 border-t border-border">
        <div className="rounded-md border border-border bg-surface-2 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Disclaimer
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Research & educational tool. Not investment advice.
          </p>
        </div>
      </div>
    </aside>
  );
}