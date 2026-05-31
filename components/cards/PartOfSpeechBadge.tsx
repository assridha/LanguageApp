import type { PartOfSpeech } from "@/types";
import { formatPartOfSpeech } from "@/lib/part-of-speech";

interface PartOfSpeechBadgeProps {
  partOfSpeech?: PartOfSpeech | null;
  size?: "sm" | "md";
}

export function PartOfSpeechBadge({
  partOfSpeech,
  size = "sm",
}: PartOfSpeechBadgeProps) {
  const label = formatPartOfSpeech(partOfSpeech);
  if (!label) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full bg-sky-50 font-medium text-sky-800 ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      {label}
    </span>
  );
}
