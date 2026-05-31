import type { DutchArticle, DutchGender } from "@/types";
import { articleGenderSummary } from "@/lib/gender";

interface GenderBadgeProps {
  article?: DutchArticle | null;
  gender?: DutchGender | null;
  size?: "sm" | "md";
}

export function GenderBadge({ article, gender, size = "sm" }: GenderBadgeProps) {
  const summary = articleGenderSummary(article, gender);
  if (!summary) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full bg-stone-100 font-medium text-stone-700 ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      {summary}
    </span>
  );
}

export function DutchWordHeading({
  dutchWord,
  article,
  className = "",
}: {
  dutchWord: string;
  article?: DutchArticle | null;
  className?: string;
}) {
  return (
    <h2 className={`font-bold capitalize ${className}`}>
      {article && (
        <span className="mr-2 font-semibold lowercase text-orange-600">
          {article}
        </span>
      )}
      {dutchWord}
    </h2>
  );
}
