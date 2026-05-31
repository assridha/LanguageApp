interface MasteryBadgeProps {
  score: number;
  size?: "sm" | "md";
}

function colorForScore(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 50) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export function MasteryBadge({ score, size = "sm" }: MasteryBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${colorForScore(score)} ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      {score}
    </span>
  );
}

export function MasteryBar({ score }: { score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-stone-500">
        <span>Mastery</span>
        <span>{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-200">
        <div
          className={`h-full rounded-full transition-all ${
            score >= 80
              ? "bg-green-500"
              : score >= 50
                ? "bg-yellow-500"
                : "bg-red-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
