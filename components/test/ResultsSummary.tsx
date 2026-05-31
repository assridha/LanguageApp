"use client";

import Link from "next/link";
import type { FlashcardDTO, QuestionType } from "@/types";
import { primaryEnglish } from "@/lib/card-display";
import { Button } from "@/components/ui/Button";

interface ResultsSummaryProps {
  score: number;
  total: number;
  byType: Record<QuestionType, { correct: number; total: number }>;
  missed: FlashcardDTO[];
  onPin?: (id: string) => void;
}

export function ResultsSummary({
  score,
  total,
  byType,
  missed,
  onPin,
}: ResultsSummaryProps) {
  const pct = total === 0 ? 0 : Math.round((score / total) * 100);
  const practiceIds = missed.map((c) => c.id).join(",");

  const weakest = Object.entries(byType)
    .filter(([, v]) => v.total > 0)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)[0];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm uppercase tracking-wide text-stone-500">Your score</p>
        <p className="mt-2 text-5xl font-bold text-orange-600">{pct}%</p>
        <p className="text-stone-600">
          {score} of {total} correct
        </p>
        {weakest && (
          <p className="mt-3 text-sm text-stone-500">
            Weakest area: {formatType(weakest[0] as QuestionType)}
          </p>
        )}
      </div>

      {missed.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Words to review</h2>
          <ul className="space-y-2">
            {missed.map((card) => (
              <li
                key={card.id}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3"
              >
                <div>
                  <span className="font-bold capitalize">{card.dutchWord}</span>
                  <p className="text-sm text-stone-600">{primaryEnglish(card)}</p>
                </div>
                {onPin && (
                  <Button variant="ghost" onClick={() => onPin(card.id)}>
                    Pin
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {practiceIds && (
            <Link href={`/practice?ids=${practiceIds}`}>
              <Button className="w-full">Practice these words</Button>
            </Link>
          )}
        </section>
      )}

      <div className="flex gap-3">
        <Link href="/test" className="flex-1">
          <Button variant="secondary" className="w-full">
            Test again
          </Button>
        </Link>
        <Link href="/" className="flex-1">
          <Button variant="ghost" className="w-full">
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

function formatType(type: QuestionType): string {
  switch (type) {
    case "imageToWord":
      return "Image → Word";
    case "definitionToWord":
      return "Definition → Word";
    case "wordToDefinition":
      return "Word → Definition";
  }
}
