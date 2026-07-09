import { useQuery } from "@tanstack/react-query";
import { getHealth, API_BASE_URL } from "@/lib/api";
import { useAnalysis } from "@/context/AnalysisContext";
import { useState } from "react";
import { Menu, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/context/SidebarContext";
export function Header() {
  const { analysis, lastUpdated } = useAnalysis();
  const [open, setOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState(API_BASE_URL);

  const { data, isError, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 15_000,
    retry: 0,
  });
  const isMobile = useIsMobile();
  const online = !!data && !isError;
  const dot = isLoading ? "bg-muted-foreground" : online ? "bg-positive" : "bg-negative";

  return (
    <header className="h-14 border-b border-border bg-surface/60 backdrop-blur px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
  onClick={() => setOpen(true)}
  className="size-9 rounded-md border border-border bg-surface-2 hover:bg-secondary flex items-center justify-center transition-colors"
>
  <Menu className="size-5" />
</button>
        )}

        <div>
          <div className="text-sm md:text-[15px] font-semibold tracking-tight">
            Gen AI Portfolio Advisor
          </div>

          <div className="hidden sm:block text-[11px] text-muted-foreground font-mono">
            {analysis
              ? `${analysis.market} · ${analysis.benchmarkName}`
              : "No portfolio loaded"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {lastUpdated && (
          <div className="hidden md:flex flex-col items-end">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Last Updated</div>
            <div className="text-[12px] font-mono">{new Date(lastUpdated).toLocaleString()}</div>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-2 md:px-3 py-1.5">
          <span className={`size-2 rounded-full ${dot} ${online ? "animate-pulse" : ""}`} />
          <span className="hidden sm:inline text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            {isLoading ? "Checking" : online ? "Backend Online" : "Backend Offline"}
          </span>
        </div>
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="size-8 rounded-md border border-border bg-surface-2 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Settings"
          >
            <Settings className="size-4" />
          </button>
          {open && (
            <div className="absolute right-0 top-10 z-50 w-80 card-surface p-4 shadow-2xl">
              <div className="text-xs font-medium mb-2">API Base URL</div>
              <input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                className="w-full rounded-md bg-surface-2 border border-border px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary/50"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem("apiBaseUrl", urlDraft.trim());
                    window.location.reload();
                  }}
                  className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground font-medium"
                >
                  Save & reload
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
