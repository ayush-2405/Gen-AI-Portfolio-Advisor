export function fmtCurrency(value: number | null | undefined, currency = "$", digits = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  let str: string;
  if (abs >= 1e9) str = (value / 1e9).toFixed(2) + "B";
  else if (abs >= 1e6) str = (value / 1e6).toFixed(2) + "M";
  else if (abs >= 1e4) str = (value / 1e3).toFixed(1) + "K";
  else str = value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${currency}${str}`;
}

export function fmtCurrencyFull(value: number | null | undefined, currency = "$"): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${currency}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function fmtPct(value: number | null | undefined, digits = 2, alreadyPct = false): string {
  if (value == null || Number.isNaN(value)) return "—";
  const v = alreadyPct ? value : value * 100;
  return `${v >= 0 ? "" : ""}${v.toFixed(digits)}%`;
}

export function fmtNum(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

export function toneClass(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return value >= 0 ? "text-positive" : "text-negative";
}
