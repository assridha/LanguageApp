"use client";

import { useEffect, useState } from "react";
import type { FlashcardDTO } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DutchWordHeading, GenderBadge } from "@/components/cards/GenderBadge";
import { primaryEnglish, secondaryEnglishDefinition } from "@/lib/card-display";
import { showFocusBadge } from "@/lib/focus";
import { MasteryBadge } from "@/components/focus/MasteryBadge";

interface CardDetailProps {
  card: FlashcardDTO;
  onPinToggle?: () => void;
  onDelete?: () => void;
  onImageUpdate?: (imageUrl: string | null) => Promise<void>;
  pinning?: boolean;
  savingImage?: boolean;
}

export function CardDetail({
  card,
  onPinToggle,
  onDelete,
  onImageUpdate,
  pinning,
  savingImage,
}: CardDetailProps) {
  const [imageUrlInput, setImageUrlInput] = useState(card.imageUrl ?? "");
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);

  useEffect(() => {
    setImageUrlInput(card.imageUrl ?? "");
    setImageError(null);
    setPreviewBroken(false);
  }, [card.imageUrl, card.id]);

  async function handleSaveImage(e: React.FormEvent) {
    e.preventDefault();
    if (!onImageUpdate) return;

    const trimmed = imageUrlInput.trim();
    if (!trimmed) {
      setImageError("Enter an image URL or use Remove image.");
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setImageError("Please enter a valid URL (https://...).");
      return;
    }

    setImageError(null);
    await onImageUpdate(trimmed);
  }

  async function handleRemoveImage() {
    if (!onImageUpdate) return;
    setImageError(null);
    await onImageUpdate(null);
  }

  const previewUrl = imageUrlInput.trim() || card.imageUrl;
  const definition = secondaryEnglishDefinition(card);
  const inFocus = showFocusBadge(card);

  return (
    <article className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <DutchWordHeading
            dutchWord={card.dutchWord}
            article={card.article}
            className="text-3xl"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <GenderBadge article={card.article} gender={card.gender} size="md" />
            {inFocus && (
              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                Focus
              </span>
            )}
          </div>
          <p className="mt-2 text-lg font-medium text-stone-900">
            {primaryEnglish(card)}
          </p>
          {definition && (
            <p className="mt-1 text-stone-600">{definition}</p>
          )}
        </div>
        <MasteryBadge score={card.stats.masteryScore} size="md" />
      </div>

      <section className="space-y-4">
        <h2 className="font-semibold text-stone-800">Image</h2>

        {card.imageUrl && !previewBroken ? (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.imageUrl}
              alt={card.imageAlt ?? card.dutchWord}
              className="max-h-64 w-full rounded-xl object-cover"
              onError={() => setPreviewBroken(true)}
            />
          </figure>
        ) : (
          <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 text-sm text-stone-500">
            {card.imageUrl && previewBroken
              ? "Image failed to load. Update the link below."
              : "No image yet. Add a link below."}
          </div>
        )}

        {previewUrl && previewUrl !== card.imageUrl && !previewBroken && (
          <figure>
            <p className="mb-2 text-xs text-stone-500">Preview</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-48 w-full rounded-xl object-cover"
              onError={() => setPreviewBroken(true)}
            />
          </figure>
        )}

        {onImageUpdate && (
          <form onSubmit={handleSaveImage} className="space-y-3">
            <Input
              label="Image URL"
              type="url"
              value={imageUrlInput}
              onChange={(e) => {
                setImageUrlInput(e.target.value);
                setImageError(null);
                setPreviewBroken(false);
              }}
              placeholder="https://example.com/hond.jpg"
              disabled={savingImage}
            />
            {imageError && (
              <p className="text-sm text-red-600">{imageError}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" loading={savingImage}>
                {card.imageUrl ? "Update image" : "Add image"}
              </Button>
              {card.imageUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRemoveImage}
                  loading={savingImage}
                >
                  Remove image
                </Button>
              )}
            </div>
          </form>
        )}
      </section>

      {card.exampleSentences.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-stone-800">Examples</h2>
          <ul className="space-y-3">
            {card.exampleSentences.map((s, i) => (
              <li
                key={i}
                className="rounded-xl bg-stone-50 p-3 text-sm leading-relaxed"
              >
                <p className="font-medium text-stone-900">{s.dutch}</p>
                <p className="text-stone-600">{s.english}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        {onPinToggle && (
          <Button
            variant={inFocus ? "primary" : "secondary"}
            onClick={onPinToggle}
            loading={pinning}
            aria-pressed={inFocus}
            aria-label={
              inFocus
                ? "Remove this word from focus"
                : "Pin this word for focus"
            }
          >
            {inFocus ? "Unpin Focus" : "Pin for focus"}
          </Button>
        )}
        {onDelete && (
          <Button variant="danger" onClick={onDelete}>
            Delete card
          </Button>
        )}
      </div>
    </article>
  );
}
