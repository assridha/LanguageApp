"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CardDetail } from "@/components/cards/CardDetail";
import { Spinner } from "@/components/ui/Spinner";
import { deleteCard, fetchCard, patchCard } from "@/lib/api-client";
import {
  applyFocusPatch,
  getFocusPatch,
  showFocusBadge,
} from "@/lib/focus";
import type { FlashcardDTO } from "@/types";

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [card, setCard] = useState<FlashcardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinning, setPinning] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [savingDefinition, setSavingDefinition] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCard(id)
      .then(({ data }) => setCard(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handlePinToggle() {
    if (!card) return;

    const pinForFocus = !showFocusBadge(card);
    const previousCard = card;

    setPinning(true);
    setCard(applyFocusPatch(card, pinForFocus));
    setError(null);

    try {
      const { data } = await patchCard(card.id, getFocusPatch(pinForFocus));
      setCard(data);
    } catch (e) {
      setCard(previousCard);
      setError(e instanceof Error ? e.message : "Failed to update focus");
    } finally {
      setPinning(false);
    }
  }

  async function handleImageUpdate(imageUrl: string | null) {
    if (!card) return;
    setSavingImage(true);
    setError(null);
    try {
      const { data } = await patchCard(card.id, { imageUrl });
      setCard(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update image");
    } finally {
      setSavingImage(false);
    }
  }

  async function handleDefinitionUpdate(englishDefinition: string) {
    if (!card) return;
    setSavingDefinition(true);
    setError(null);
    try {
      const { data } = await patchCard(card.id, { englishDefinition });
      setCard(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update definition");
    } finally {
      setSavingDefinition(false);
    }
  }

  async function handleDelete() {
    if (!card || !confirm("Delete this card?")) return;
    await deleteCard(card.id);
    router.push("/deck");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-700">
        {error ?? "Card not found"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>
      )}
      <CardDetail
        card={card}
        onPinToggle={handlePinToggle}
        onDelete={handleDelete}
        onImageUpdate={handleImageUpdate}
        onDefinitionUpdate={handleDefinitionUpdate}
        pinning={pinning}
        savingImage={savingImage}
        savingDefinition={savingDefinition}
      />
    </div>
  );
}
