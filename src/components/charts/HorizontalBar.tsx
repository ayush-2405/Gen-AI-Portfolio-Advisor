import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { AXIS, CHART_COLORS, GRID_STROKE } from "./chart-theme";

export function HorizontalBar({
  data,
  labelKey,
  valueKey,
  formatValue,
  height = 260,
}: {
  data: Array<Record<string, number | string>>;
  labelKey: string;
  valueKey: string;
  formatValue?: (v: number) => string;
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ left: 10, right: 16, top: 6, bottom: 6 }}>
          <CartesianGrid stroke={GRID_STROKE} horizontal={false} strokeDasharray="3 3" />
          <XAxis
            type="number"
            tick={{ fill: AXIS.stroke, fontSize: AXIS.fontSize, fontFamily: AXIS.fontFamily }}
            axisLine={{ stroke: GRID_STROKE }}
            tickLine={false}
            tickFormatter={formatValue}
          />
          <YAxis
            type="category"
            dataKey={labelKey}
            tick={{ fill: AXIS.stroke, fontSize: AXIS.fontSize, fontFamily: AXIS.fontFamily }}
            axisLine={{ stroke: GRID_STROKE }}
            tickLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={((v: unknown) => {
              const n = typeof v === "number" ? v : Number(v);
              return formatValue ? formatValue(n) : n;
            }) as never}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey={valueKey} radius={[0, 3, 3, 0]} animationDuration={600}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
