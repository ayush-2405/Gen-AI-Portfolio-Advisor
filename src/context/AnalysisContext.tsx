import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AnalysisResponse } from "@/lib/api";

interface AnalysisContextValue {
  analysis: AnalysisResponse | null;
  setAnalysis: (a: AnalysisResponse | null) => void;
  lastUpdated: string | null;
}

const Ctx = createContext<AnalysisContextValue | null>(null);

const STORAGE_KEY = "gpa.analysis.v1";
const STAMP_KEY = "gpa.analysis.stamp.v1";

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysisState] = useState<AnalysisResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const stamp = localStorage.getItem(STAMP_KEY);
      if (raw) setAnalysisState(JSON.parse(raw));
      if (stamp) setLastUpdated(stamp);
    } catch {
      // ignore
    }
  }, []);

  const setAnalysis = (a: AnalysisResponse | null) => {
    setAnalysisState(a);
    if (a) {
      const stamp = new Date().toISOString();
      setLastUpdated(stamp);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
        localStorage.setItem(STAMP_KEY, stamp);
      } catch {
        // ignore
      }
    } else {
      setLastUpdated(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STAMP_KEY);
    }
  };

  return <Ctx.Provider value={{ analysis, setAnalysis, lastUpdated }}>{children}</Ctx.Provider>;
}

export function useAnalysis() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAnalysis must be used inside AnalysisProvider");
  return v;
}
