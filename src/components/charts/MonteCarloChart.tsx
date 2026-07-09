import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useMemo } from "react";
import { AXIS, GRID_STROKE } from "./chart-theme";

interface BandPoint {
  day: number;
  mean: number;
  median: number;
  p5: number;
  p95: number;
}

interface Props {
  paths: Array<Record<string, number | null>>;
  bands: BandPoint[];
}

function formatCurrency(v: number) {
  if (!Number.isFinite(v)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(v);
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) {
  if (!active || !payload?.length) return null;

  const band = payload.find((p) => p.dataKey === "median")?.payload;

  if (!band) return null;

  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-xl min-w-[180px]">
      <div className="text-xs font-semibold text-muted-foreground mb-2">
        Day {band.day}
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Median</span>
          <span className="font-mono">{formatCurrency(band.median)}</span>
        </div>

        <div className="flex justify-between">
          <span>Mean</span>
          <span className="font-mono">{formatCurrency(band.mean)}</span>
        </div>

        <div className="flex justify-between">
          <span>5th %ile</span>
          <span className="font-mono">{formatCurrency(band.p5)}</span>
        </div>

        <div className="flex justify-between">
          <span>95th %ile</span>
          <span className="font-mono">{formatCurrency(band.p95)}</span>
        </div>
      </div>
    </div>
  );
}

export function MonteCarloChart({
  paths = [],
  bands = [],
}: Partial<Props>) {
  const sampledKeys = useMemo(() => {
    if (!paths.length) return [];

    const keys = Object.keys(paths[0]).filter((k) => k !== "day");

    const step = Math.max(1, Math.floor(keys.length / 20));

    return keys.filter((_, i) => i % step === 0).slice(0, 20);
  }, [paths]);

  const chartData = useMemo(() => {
    return (bands ?? []).map((band) => {
      const row = paths.find((p) => Number(p.day) === band.day);

      return {
        ...band,
        ...(row || {}),
      };
    });
  }, [bands, paths]);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{
            left: 8,
            right: 12,
            top: 8,
            bottom: 0,
          }}
        >
          <CartesianGrid
            stroke={GRID_STROKE}
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="day"
            tick={{
              fill: AXIS.stroke,
              fontSize: AXIS.fontSize,
              fontFamily: AXIS.fontFamily,
            }}
            axisLine={{
              stroke: GRID_STROKE,
            }}
            tickLine={false}
          />

          <YAxis
            width={60}
            tick={{
              fill: AXIS.stroke,
              fontSize: AXIS.fontSize,
              fontFamily: AXIS.fontFamily,
            }}
            axisLine={{
              stroke: GRID_STROKE,
            }}
            tickLine={false}
            tickFormatter={(v: number) => {
              if (Math.abs(v) >= 1e6)
                return `${(v / 1e6).toFixed(1)}M`;

              if (Math.abs(v) >= 1e3)
                return `${(v / 1e3).toFixed(0)}K`;

              return v.toFixed(0);
            }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="p95"
            stroke="none"
            fill="#10b981"
            fillOpacity={0.12}
            isAnimationActive={false}
          />

          <Area
            type="monotone"
            dataKey="p5"
            stroke="none"
            fill="var(--background)"
            fillOpacity={1}
            isAnimationActive={false}
          />

          {sampledKeys.map((k) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke="#34d399"
              strokeOpacity={0.08}
              strokeWidth={1}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          ))}

          <Line
            type="monotone"
            dataKey="median"
            stroke="#10b981"
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}