"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageModeToggle } from "@/components/add/LanguageModeToggle";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Input } from "@/components/ui/Input";
import {
  ApiError,
  bulkCreateCards,
  createCard,
  type BulkCreateResult,
} from "@/lib/api-client";
import { parseWordList, spellCheckLang, type InputLanguage } from "@/lib/word-input";

export default function AddWordPage() {
  const router = useRouter();
  const [inputLanguage, setInputLanguage] = useState<InputLanguage>("dutch");
  const [wordInput, setWordInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [existingCardId, setExistingCardId] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkCreateResult | null>(null);

  const words = useMemo(() => parseWordList(wordInput), [wordInput]);
  const isMultiple = words.length > 1;

  function resetFeedback() {
    setError(null);
    setSuggestion(null);
    setExistingCardId(null);
    setBulkResult(null);
  }

  function applySuggestion() {
    if (!suggestion) return;
    if (isMultiple) {
      const parts = wordInput.split(",");
      parts[parts.length - 1] = ` ${suggestion}`;
      setWordInput(parts.join(",").trim());
    } else {
      setWordInput(suggestion);
    }
    resetFeedback();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (words.length === 0) return;

    setLoading(true);
    resetFeedback();

    try {
      if (isMultiple) {
        const { data } = await bulkCreateCards({
          words,
          inputLanguage,
        });
        setBulkResult(data);

        if (data.created.length === 1 && data.failed.length === 0) {
          router.push(`/deck/${data.created[0].id}`);
          return;
        }
        return;
      }

      const { data } = await createCard({
        word: words[0],
        inputLanguage,
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
      });
      router.push(`/deck/${data.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.details?.suggestion) {
          setSuggestion(err.details.suggestion);
        }
        if (err.details?.existingCardId) {
          setExistingCardId(err.details.existingCardId);
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to create card");
      }
    } finally {
      setLoading(false);
    }
  }

  const wordLabel =
    inputLanguage === "dutch" ? "Dutch word(s)" : "English word(s)";
  const wordPlaceholder =
    inputLanguage === "dutch"
      ? "e.g. hond  or  hond, kat, huis"
      : "e.g. dog  or  dog, cat, house";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add words</h1>
        <p className="mt-1 text-stone-600">
          Enter one word or several separated by commas. We validate spelling,
          then generate definitions and examples.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <span className="text-sm font-medium text-stone-700">Input language</span>
          <LanguageModeToggle
            language={inputLanguage}
            onChange={(lang) => {
              setInputLanguage(lang);
              resetFeedback();
            }}
          />
        </div>

        <Textarea
          label={wordLabel}
          value={wordInput}
          onChange={(e) => {
            setWordInput(e.target.value);
            resetFeedback();
          }}
          placeholder={wordPlaceholder}
          spellCheck
          lang={spellCheckLang(inputLanguage)}
          autoCorrect="on"
          required
          disabled={loading}
          hint={
            isMultiple
              ? `${words.length} flashcards will be created. Image links are disabled for multiple words.`
              : "Separate multiple words with commas."
          }
        />

        {!isMultiple && (
          <Input
            label="Image URL (optional)"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/hond.jpg"
            disabled={loading}
          />
        )}

        {error && (
          <div className="space-y-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">
            <p>{error}</p>
            {existingCardId && (
              <Link
                href={`/deck/${existingCardId}`}
                className="inline-block font-semibold text-orange-700 hover:underline"
              >
                View existing flashcard
              </Link>
            )}
            {suggestion && (
              <div className="flex flex-wrap items-center gap-2">
                <span>Did you mean:</span>
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="rounded-lg bg-white px-3 py-1 font-semibold text-orange-700 ring-1 ring-orange-200"
                >
                  {suggestion}
                </button>
              </div>
            )}
          </div>
        )}

        {bulkResult && <BulkResultSummary result={bulkResult} />}

        <Button type="submit" loading={loading} className="w-full">
          {isMultiple
            ? `Generate ${words.length} flashcards`
            : "Generate flashcard"}
        </Button>
      </form>
    </div>
  );
}

function BulkResultSummary({ result }: { result: BulkCreateResult }) {
  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 text-sm">
      <p className="font-semibold text-stone-900">Bulk import results</p>
      <p className="text-stone-600">
        Created {result.created.length}, skipped {result.skipped.length}, failed{" "}
        {result.failed.length}
      </p>

      {result.created.length > 0 && (
        <div>
          <p className="mb-1 font-medium text-green-700">Created</p>
          <ul className="space-y-1 text-stone-700">
            {result.created.map((item) => (
              <li key={item.id}>
                <Link href={`/deck/${item.id}`} className="text-orange-600 hover:underline">
                  {item.dutchWord}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.failed.length > 0 && (
        <div>
          <p className="mb-1 font-medium text-red-700">Failed</p>
          <ul className="space-y-2">
            {result.failed.map((item) => (
              <li key={item.dutchWord} className="rounded-lg bg-red-50 p-2 text-red-800">
                <span className="font-medium">{item.dutchWord}</span>: {item.error.message}
                {item.error.suggestion && (
                  <span className="block text-red-700">
                    Suggestion: {item.error.suggestion}
                  </span>
                )}
                {item.error.existingCardId && (
                  <Link
                    href={`/deck/${item.error.existingCardId}`}
                    className="mt-1 inline-block text-orange-700 hover:underline"
                  >
                    View existing flashcard
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.skipped.length > 0 && (
        <div>
          <p className="mb-1 font-medium text-stone-700">Skipped (duplicates)</p>
          <p className="text-stone-600">
            {result.skipped.map((item) => item.dutchWord).join(", ")}
          </p>
        </div>
      )}

      <Link href="/deck">
        <Button variant="secondary" className="w-full">
          View deck
        </Button>
      </Link>
    </div>
  );
}
