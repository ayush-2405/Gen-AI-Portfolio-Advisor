import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { AXIS, GRID_STROKE } from "./chart-theme";

export function CumulativeChart({ data }: { data: Array<Record<string, number | string | null>> }) {
  if (!data?.length) return null;
  const first = data[0];
  const seriesKeys = Object.keys(first).filter((k) => k !== "date");

  // Downsample for perf
  const step = Math.max(1, Math.floor(data.length / 220));
  const rows = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ left: 6, right: 12, top: 6, bottom: 0 }}>
          <defs>
            <linearGradient id="gPort" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gBench" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: AXIS.stroke, fontSize: AXIS.fontSize, fontFamily: AXIS.fontFamily }}
            tickFormatter={(v: string) => (v?.length >= 10 ? v.slice(0, 7) : v)}
            axisLine={{ stroke: GRID_STROKE }}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: AXIS.stroke, fontSize: AXIS.fontSize, fontFamily: AXIS.fontFamily }}
            axisLine={{ stroke: GRID_STROKE }}
            tickLine={false}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(v: number) => `${(v * 100).toFixed(2)}%`}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="line" />
          {seriesKeys.map((k, i) => (
            <Area
              key={k}
              type="monotone"
              dataKey={k}
              name={k}
              stroke={i === 0 ? "#34d399" : "#60a5fa"}
              strokeWidth={1.6}
              fill={i === 0 ? "url(#gPort)" : "url(#gBench)"}
              isAnimationActive
              animationDuration={700}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
