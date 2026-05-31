"use client";

import { useState } from "react";
import type { FlashcardDTO } from "@/types";
import { DutchWordHeading } from "@/components/cards/GenderBadge";
import { PartOfSpeechBadge } from "@/components/cards/PartOfSpeechBadge";
import {
  primaryEnglish,
  secondaryEnglishDefinition,
} from "@/lib/card-display";
import { formatPartOfSpeech } from "@/lib/part-of-speech";

interface FlashcardFlipProps {
  card: FlashcardDTO;
}

export function FlashcardFlip({ card }: FlashcardFlipProps) {
  const [flipped, setFlipped] = useState(false);
  const english = primaryEnglish(card);
  const definition = secondaryEnglishDefinition(card);

  function toggle() {
    setFlipped((prev) => !prev);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  }

  return (
    <div className="flashcard-scene w-full">
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={onKeyDown}
        aria-label={flipped ? "Show Dutch word" : "Show definition"}
        className="flashcard-inner min-h-72 w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        data-flipped={flipped}
      >
        <div className="flashcard-face flashcard-front">
          {card.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.imageUrl}
              alt=""
              className="mb-4 h-24 w-24 rounded-xl object-cover"
            />
          )}
          <p className="text-sm uppercase tracking-wide text-stone-500">Dutch</p>
          <DutchWordHeading
            dutchWord={card.dutchWord}
            article={card.article}
            className="mt-2 text-4xl"
          />
          <p className="mt-6 text-sm text-stone-400">Tap to reveal</p>
        </div>

        <div className="flashcard-face flashcard-back">
          <p className="text-sm uppercase tracking-wide text-orange-700">English</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">{english}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <PartOfSpeechBadge partOfSpeech={card.partOfSpeech} />
          </div>
          {definition && (
            <p className="mt-3 text-sm text-stone-600">
              {card.partOfSpeech && (
                <span className="font-medium text-stone-700">
                  {formatPartOfSpeech(card.partOfSpeech)}:{" "}
                </span>
              )}
              {definition}
            </p>
          )}
          <ul className="mt-4 w-full space-y-2 text-left text-sm">
            {card.exampleSentences.slice(0, 2).map((s, i) => (
              <li key={i} className="rounded-lg bg-white/70 p-2">
                <p className="font-medium">{s.dutch}</p>
                <p className="text-stone-600">{s.english}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
