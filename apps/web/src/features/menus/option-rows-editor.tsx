export interface OptionRow {
  name: string;
  price: string;
  isAvailable: boolean;
}

interface Props {
  label: string;
  addLabel: string;
  rows: OptionRow[];
  onChange: (rows: OptionRow[]) => void;
}

/** Editable row list shared by variants and add-ons in the item editor. */
export function OptionRowsEditor({ label, addLabel, rows, onChange }: Props) {
  const update = (index: number, patch: Partial<OptionRow>) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-text-primary">{label}</legend>
      {rows.map((row, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2">
          <input
            aria-label={`${label} ${index + 1} name`}
            value={row.name}
            onChange={(e) => update(index, { name: e.target.value })}
            placeholder="Half / Extra Cheese"
            className="h-10 w-40 rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
          />
          <input
            aria-label={`${label} ${index + 1} price`}
            type="number"
            min="0"
            step="0.01"
            value={row.price}
            onChange={(e) => update(index, { price: e.target.value })}
            placeholder="0"
            className="h-10 w-24 rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
          />
          <label className="flex items-center gap-1.5 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={row.isAvailable}
              onChange={(e) => update(index, { isAvailable: e.target.checked })}
              className="h-4 w-4 accent-brand-primary"
            />
            Available
          </label>
          <button
            type="button"
            aria-label={`Remove ${label} ${index + 1}`}
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
            className="h-10 rounded-lg border border-border-default px-3 text-sm text-error hover:border-error"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...rows, { name: "", price: "", isAvailable: true }])
        }
        className="h-10 rounded-lg border border-dashed border-border-default px-4 text-sm font-medium text-text-secondary hover:border-brand-primary hover:text-brand-primary"
      >
        {addLabel}
      </button>
    </fieldset>
  );
}
