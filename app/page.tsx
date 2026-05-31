"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FocusList } from "@/components/focus/FocusList";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  computeDeckSummary,
  fetchCards,
  fetchFocusCards,
} from "@/lib/api-client";
import type { FlashcardDTO } from "@/types";

export default function HomePage() {
  const [cards, setCards] = useState<FlashcardDTO[]>([]);
  const [focus, setFocus] = useState<FlashcardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchCards({ limit: "500" }),
      fetchFocusCards(5),
    ])
      .then(([all, focusRes]) => {
        setCards(all.data);
        setFocus(focusRes.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-semibold">Could not load dashboard</p>
        <p className="mt-1 text-sm">{error}</p>
        <p className="mt-3 text-sm">
          Make sure MongoDB is configured in <code>.env.local</code>.
        </p>
      </div>
    );
  }

  const summary = computeDeckSummary(cards);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-stone-900">
          English → Dutch
        </h1>
        <p className="mt-2 text-stone-600">
          Build your deck, practice flashcards, and take adaptive tests.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total words" value={summary.total} />
        <StatCard label="Avg mastery" value={`${summary.avgMastery}%`} />
        <StatCard label="Focus words" value={summary.focusCount} highlight />
      </section>

      <section className="flex flex-wrap gap-3">
        <Link href="/add">
          <Button>Add word</Button>
        </Link>
        <Link href="/practice">
          <Button variant="secondary">Practice</Button>
        </Link>
        {summary.focusCount > 0 ? (
          <Link href="/test">
            <Button>Start focus test</Button>
          </Link>
        ) : (
          <Link href="/test">
            <Button variant="secondary">Take a test</Button>
          </Link>
        )}
      </section>

      {focus.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Needs focus</h2>
            <Link href="/focus" className="text-sm text-orange-600 hover:underline">
              View all
            </Link>
          </div>
          <FocusList cards={focus} />
        </section>
      )}

      {summary.total === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
          <p className="text-stone-600">Your deck is empty.</p>
          <Link href="/add" className="mt-4 inline-block">
            <Button>Add your first Dutch word</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${highlight ? "border-orange-200 bg-orange-50" : "border-stone-200 bg-white"}`}
    >
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
