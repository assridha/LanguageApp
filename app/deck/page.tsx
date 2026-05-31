"use client";

import { useCallback, useEffect, useState } from "react";
import { CardListItem } from "@/components/cards/CardListItem";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Toggle } from "@/components/ui/Toggle";
import { deleteCard, fetchCards } from "@/lib/api-client";
import type { FlashcardDTO } from "@/types";

export default function DeckPage() {
  const [cards, setCards] = useState<FlashcardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [focusOnly, setFocusOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "500", sort: "dutchWord", order: "asc" };
      if (search) params.search = search;
      if (focusOnly) params.focusOnly = "true";
      const { data } = await fetchCards(params);
      setCards(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load deck");
    } finally {
      setLoading(false);
    }
  }, [search, focusOnly]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search, focusOnly]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this card?")) return;
    await deleteCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your deck</h1>
        <p className="text-stone-600">{cards.length} cards</p>
      </div>

      <div className="space-y-3">
        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words or definitions"
        />
        <Toggle
          label="Focus words only"
          checked={focusOnly}
          onChange={setFocusOnly}
        />
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {!loading && !error && cards.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
          No cards found.
        </div>
      )}

      <ul className="space-y-3">
        {cards.map((card) => (
          <li key={card.id}>
            <CardListItem card={card} onDelete={handleDelete} />
          </li>
        ))}
      </ul>
    </div>
  );
}
