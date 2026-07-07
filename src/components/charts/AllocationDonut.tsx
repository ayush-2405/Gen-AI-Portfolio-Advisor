import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS } from "./chart-theme";

interface Item {
  name: string;
  weight: number;
}

export function AllocationDonut({ data, unit = "%" }: { data: Item[]; unit?: string }) {
  const total = data.reduce((s, d) => s + d.weight, 0);
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="weight"
            nameKey="name"
            innerRadius="55%"
            outerRadius="82%"
            stroke="var(--surface)"
            strokeWidth={2}
            paddingAngle={1}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={((v: unknown) => {
              const n = typeof v === "number" ? v : Number(v);
              return `${((n / total) * 100).toFixed(2)}${unit}`;
            }) as never}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AllocationLegend({ data }: { data: Item[] }) {
  const total = data.reduce((s, d) => s + d.weight, 0);
  return (
    <ul className="space-y-1.5 text-xs">
      {data.map((d, i) => (
        <li key={d.name} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 truncate">
            <span
              className="size-2.5 rounded-sm shrink-0"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="truncate text-muted-foreground">{d.name}</span>
          </span>
          <span className="font-mono tabular-nums">{((d.weight / total) * 100).toFixed(2)}%</span>
        </li>
      ))}
    </ul>
  );
}
