"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FlashcardFlip } from "@/components/cards/FlashcardFlip";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Toggle } from "@/components/ui/Toggle";
import { fetchCards, fetchFocusCards, patchCard } from "@/lib/api-client";
import type { FlashcardDTO } from "@/types";

export default function PracticeClient() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");

  const [cards, setCards] = useState<FlashcardDTO[]>([]);
  const [index, setIndex] = useState(0);
  const [focusOnly, setFocusOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCards() {
      setLoading(true);
      try {
        let data: FlashcardDTO[];
        if (idsParam) {
          ({ data } = await fetchCards({ ids: idsParam, limit: "100" }));
        } else if (focusOnly) {
          ({ data } = await fetchFocusCards(100));
        } else {
          ({ data } = await fetchCards({ limit: "500" }));
        }
        if (!cancelled) {
          setCards(data);
          setIndex(0);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load cards");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCards();
    return () => {
      cancelled = true;
    };
  }, [focusOnly, idsParam]);

  const current = cards[index];

  function shuffle() {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setIndex(0);
  }

  async function markKnown() {
    if (!current) return;
    setMarking(true);
    try {
      await patchCard(current.id, { markKnown: true });
      setCards((prev) =>
        prev.map((c) =>
          c.id === current.id
            ? {
                ...c,
                stats: {
                  ...c.stats,
                  masteryScore: Math.min(100, c.stats.masteryScore + 5),
                },
              }
            : c,
        ),
      );
    } finally {
      setMarking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Practice</h1>
        {!idsParam && (
          <Toggle
            label="Focus words only"
            checked={focusOnly}
            onChange={setFocusOnly}
          />
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {cards.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
          No cards to practice. Add some words first!
        </div>
      )}

      {current && (
        <>
          <p className="text-center text-sm text-stone-500">
            {index + 1} of {cards.length}
          </p>
          <FlashcardFlip key={current.id} card={current} />

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIndex((i) => Math.min(cards.length - 1, i + 1))}
              disabled={index >= cards.length - 1}
            >
              Next
            </Button>
            <Button variant="ghost" onClick={shuffle}>
              Shuffle
            </Button>
            <Button onClick={markKnown} loading={marking}>
              Mark as known
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
