import Link from "next/link";
import type { FlashcardDTO } from "@/types";
import { primaryEnglish } from "@/lib/card-display";
import { MasteryBadge, MasteryBar } from "@/components/focus/MasteryBadge";

export function FocusList({ cards }: { cards: FlashcardDTO[] }) {
  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500">
        No focus words right now. Great job!
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {cards.map((card) => (
        <li key={card.id}>
          <Link
            href={`/deck/${card.id}`}
            className="block rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-orange-300"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-lg font-bold capitalize">{card.dutchWord}</span>
              <MasteryBadge score={card.stats.masteryScore} />
            </div>
            <p className="mb-3 line-clamp-1 text-sm text-stone-600">
              {primaryEnglish(card)}
            </p>
            <MasteryBar score={card.stats.masteryScore} />
            {card.weakestType && (
              <p className="mt-2 text-xs text-stone-500">
                Weakest: {formatType(card.weakestType)}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function formatType(type: string): string {
  switch (type) {
    case "imageToWord":
      return "Image → Word";
    case "definitionToWord":
      return "Definition → Word";
    case "wordToDefinition":
      return "Word → Definition";
    default:
      return type;
  }
}
