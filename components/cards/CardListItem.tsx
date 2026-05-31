"use client";

import Link from "next/link";
import type { FlashcardDTO } from "@/types";
import { GenderBadge } from "@/components/cards/GenderBadge";
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
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      {card.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.imageUrl}
          alt={card.imageAlt ?? card.dutchWord}
          className="h-14 w-14 rounded-lg object-cover"
        />
      )}
      <Link href={`/deck/${card.id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-lg font-bold capitalize">
            {card.article ? `${card.article} ${card.dutchWord}` : card.dutchWord}
          </span>
          <GenderBadge article={card.article} gender={card.gender} />
          {showFocusBadge(card) && (
            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
              Focus
            </span>
          )}
        </div>
        <p className="truncate text-sm text-stone-600">
          {primaryEnglish(card)}
        </p>
      </Link>
      <MasteryBadge score={card.stats.masteryScore} />
      {onDelete && (
        <Button variant="ghost" onClick={() => onDelete(card.id)} aria-label="Delete">
          🗑️
        </Button>
      )}
    </div>
  );
}
