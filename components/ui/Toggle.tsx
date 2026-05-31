interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export function Toggle({ label, checked, onChange, description }: ToggleProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3">
      <div>
        <div className="font-medium text-stone-800">{label}</div>
        {description && (
          <div className="text-sm text-stone-500">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-orange-600" : "bg-stone-300"}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${checked ? "left-5" : "left-0.5"}`}
        />
      </button>
    </label>
  );
}
