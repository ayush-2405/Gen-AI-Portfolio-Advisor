import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AXIS, GRID_STROKE } from "./chart-theme";
import { useMemo } from "react";

export function MonteCarloChart({ paths }: { paths: Array<Record<string, number | null>> }) {
  const seriesKeys = useMemo(
    () => (paths[0] ? Object.keys(paths[0]).filter((k) => k !== "day") : []),
    [paths],
  );
  // Show a subset for perf
  const shown = seriesKeys.slice(0, 60);
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={paths} margin={{ left: 6, right: 12, top: 6, bottom: 0 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: AXIS.stroke, fontSize: AXIS.fontSize, fontFamily: AXIS.fontFamily }}
            axisLine={{ stroke: GRID_STROKE }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: AXIS.stroke, fontSize: AXIS.fontSize, fontFamily: AXIS.fontFamily }}
            axisLine={{ stroke: GRID_STROKE }}
            tickLine={false}
            tickFormatter={(v: number) => {
              if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + "M";
              if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(0) + "K";
              return v.toFixed(0);
            }}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 11,
            }}
          />
          {shown.map((k, i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke="#34d399"
              strokeOpacity={0.08 + 0.02 * (i % 5)}
              strokeWidth={1}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
