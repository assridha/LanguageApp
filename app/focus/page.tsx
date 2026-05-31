"use client";

import { useEffect, useState } from "react";
import { FocusList } from "@/components/focus/FocusList";
import { Spinner } from "@/components/ui/Spinner";
import { fetchFocusCards } from "@/lib/api-client";
import type { FlashcardDTO } from "@/types";

export default function FocusPage() {
  const [cards, setCards] = useState<FlashcardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFocusCards(50)
      .then(({ data }) => setCards(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Focus words</h1>
        <p className="text-stone-600">
          Words that need the most attention based on mastery, recency, and
          mistakes.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {!loading && !error && <FocusList cards={cards} />}
    </div>
  );
}
