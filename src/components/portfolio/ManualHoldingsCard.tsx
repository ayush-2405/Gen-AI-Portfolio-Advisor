import { Plus, Trash2 } from "lucide-react";

type Holding = {
  ticker: string;
  quantity: number;
};

interface Props {
  holdings: Holding[];
  onChange: (holdings: Holding[]) => void;
}

export function ManualHoldingsCard({
  holdings,
  onChange,
}: Props) {
  const updateHolding = (
    index: number,
    field: keyof Holding,
    value: string
  ) => {
    const updated = [...holdings];

    if (field === "ticker") {
      updated[index].ticker = value.toUpperCase();
    } else {
      updated[index].quantity =
        value === "" ? 0 : Math.max(0, parseInt(value, 10) || 0);
    }

    onChange(updated);
  };

  const addHolding = () => {
    onChange([
      ...holdings,
      {
        ticker: "",
        quantity: 0,
      },
    ]);
  };

  const removeHolding = (index: number) => {
    if (holdings.length === 1) {
      onChange([
        {
          ticker: "",
          quantity: 0,
        },
      ]);
      return;
    }

    onChange(holdings.filter((_, i) => i !== index));
  };

  return (
    <div className="card-surface p-5">
      <div className="mb-4">
        <div className="text-sm font-semibold">
          Manual Portfolio Entry
        </div>

        <div className="text-xs text-muted-foreground mt-1">
          Enter holdings manually instead of uploading a CSV.
        </div>
      </div>

      <div className="space-y-3">
        {holdings.map((holding, index) => (
          <div
            key={index}
            className="grid grid-cols-[2fr_1.3fr_auto] gap-3 items-center"
          >
            <input
              type="text"
              placeholder="Ticker"
              value={holding.ticker}
              onChange={(e) =>
                updateHolding(index, "ticker", e.target.value)
              }
              className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm uppercase focus:outline-none focus:border-primary/50"
            />

            <input
              type="number"
              min={1}
              placeholder="Quantity"
              value={
                holding.quantity === 0 ? "" : holding.quantity
              }
              onChange={(e) =>
                updateHolding(index, "quantity", e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addHolding();
                }
              }}
              className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            />

            <button
              onClick={() => removeHolding(index)}
              className="size-10 rounded-md border border-border bg-surface-2 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-colors flex items-center justify-center"
              aria-label="Delete Holding"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addHolding}
        className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm hover:border-primary/40 hover:text-primary transition-colors"
      >
        <Plus className="size-4" />
        Add Holding
      </button>

      <div className="mt-4 rounded-md bg-surface-2 border border-border p-3">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
          Tip
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          You can either upload a CSV or manually enter your holdings.
          Tickers are automatically converted to uppercase.
        </p>
      </div>
    </div>
  );
}