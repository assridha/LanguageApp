import type { InputLanguage } from "@/lib/word-input";

interface LanguageModeToggleProps {
  language: InputLanguage;
  onChange: (language: InputLanguage) => void;
}

export function LanguageModeToggle({
  language,
  onChange,
}: LanguageModeToggleProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-1">
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => onChange("dutch")}
          className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            language === "dutch"
              ? "bg-orange-600 text-white"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Dutch word
        </button>
        <button
          type="button"
          onClick={() => onChange("english")}
          className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            language === "english"
              ? "bg-orange-600 text-white"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          English word
        </button>
      </div>
    </div>
  );
}
