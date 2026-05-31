import { z } from "zod";
import type { PartOfSpeech } from "@/types";

export const PART_OF_SPEECH_VALUES = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "interjection",
  "phrase",
  "other",
] as const satisfies readonly PartOfSpeech[];

export const partOfSpeechSchema = z.enum(PART_OF_SPEECH_VALUES);

export const partOfSpeechInstructions = `
- partOfSpeech: classify the Dutch entry using exactly one of: "noun", "verb", "adjective", "adverb", "pronoun", "preposition", "conjunction", "interjection", "phrase", "other"
- Use "phrase" for fixed expressions or multi-word entries learners study as a unit
- Use infinitive verbs as "verb" (e.g. lopen -> verb)`;

export function formatPartOfSpeech(partOfSpeech?: PartOfSpeech | null): string | null {
  if (!partOfSpeech) return null;

  const labels: Record<PartOfSpeech, string> = {
    noun: "Noun",
    verb: "Verb",
    adjective: "Adjective",
    adverb: "Adverb",
    pronoun: "Pronoun",
    preposition: "Preposition",
    conjunction: "Conjunction",
    interjection: "Interjection",
    phrase: "Phrase",
    other: "Other",
  };

  return labels[partOfSpeech];
}

export function parsePartOfSpeech(value: unknown): PartOfSpeech {
  return partOfSpeechSchema.parse(value);
}
