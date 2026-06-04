"use client";

import Link from "next/link";
import type { FlashcardDTO } from "@/types";
import { GenderBadge } from "@/components/cards/GenderBadge";
import { PartOfSpeechBadge } from "@/components/cards/PartOfSpeechBadge";
import { primaryEnglish } from "@/lib/card-display";
import { showFocusBadge } from "@/lib/focus";
import { MasteryBadge } from "@/components/focus/MasteryBadge";
import { Button } from "@/components/ui/Button";

interface CardListItemProps {
  card: FlashcardDTO;
  onDelete?: (id: string) => void;
}

export function CardListItem({ card, onDelete }: CardListItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      {card.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.imageUrl}
          alt={card.imageAlt ?? card.dutchWord}
          className="h-14 w-14 rounded-lg object-cover"
        />
      )}
      <Link href={`/deck/${card.id}`} className="min-w-0 flex-1">
        <p className="text-lg font-bold capitalize break-words">
          {card.article ? `${card.article} ${card.dutchWord}` : card.dutchWord}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <GenderBadge article={card.article} gender={card.gender} />
          <PartOfSpeechBadge partOfSpeech={card.partOfSpeech} />
          {showFocusBadge(card) && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              Focus
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-stone-600">
          {primaryEnglish(card)}
        </p>
      </Link>
      <div className="flex shrink-0 flex-col items-center gap-1">
        <MasteryBadge score={card.stats.masteryScore} />
        {onDelete && (
          <Button variant="ghost" onClick={() => onDelete(card.id)} aria-label="Delete">
            🗑️
          </Button>
        )}
      </div>
    </div>
  );
}
