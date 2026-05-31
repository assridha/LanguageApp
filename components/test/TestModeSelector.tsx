import type { TestMode } from "@/types";

const MODES: { value: TestMode; label: string; description: string }[] = [
  {
    value: "focus",
    label: "Focus",
    description: "Prioritize words you need to learn most",
  },
  {
    value: "weak-only",
    label: "Weak words",
    description: "Only low mastery or recently missed",
  },
  {
    value: "new-only",
    label: "New words",
    description: "Never tested before",
  },
  {
    value: "full",
    label: "Full deck",
    description: "Random from all cards",
  },
];

interface TestModeSelectorProps {
  mode: TestMode;
  onChange: (mode: TestMode) => void;
}

export function TestModeSelector({ mode, onChange }: TestModeSelectorProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(m.value)}
          className={`rounded-xl border p-3 text-left transition ${
            mode === m.value
              ? "border-orange-500 bg-orange-50"
              : "border-stone-200 bg-white hover:border-stone-300"
          }`}
        >
          <div className="font-semibold">{m.label}</div>
          <div className="text-sm text-stone-500">{m.description}</div>
        </button>
      ))}
    </div>
  );
}
