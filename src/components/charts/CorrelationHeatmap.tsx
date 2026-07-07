export function CorrelationHeatmap({
  columns,
  matrix,
}: {
  columns: string[];
  matrix: (number | null)[][];
}) {
  if (!columns?.length) return null;
  const color = (v: number | null) => {
    if (v == null) return "var(--surface-2)";
    // -1..1 → red..gray..emerald
    const t = (v + 1) / 2;
    const r = Math.round((1 - t) * 220 + t * 52);
    const g = Math.round((1 - t) * 80 + t * 211);
    const b = Math.round((1 - t) * 80 + t * 153);
    return `rgb(${r}, ${g}, ${b})`;
  };
  return (
    <div className="overflow-auto scrollbar-thin">
      <table className="border-separate border-spacing-0.5 text-[10px] font-mono">
        <thead>
          <tr>
            <th className="p-1"></th>
            {columns.map((c) => (
              <th
                key={c}
                className="p-1 text-muted-foreground font-normal"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="pr-2 text-right text-muted-foreground">{columns[i]}</td>
              {row.map((v, j) => (
                <td
                  key={j}
                  title={`${columns[i]} / ${columns[j]}: ${v == null ? "—" : v.toFixed(2)}`}
                  className="w-8 h-8 text-center align-middle text-[10px] tabular-nums"
                  style={{
                    background: color(v),
                    color: v != null && Math.abs(v) > 0.5 ? "#0b0f16" : "rgba(255,255,255,0.75)",
                  }}
                >
                  {v == null ? "" : v.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
