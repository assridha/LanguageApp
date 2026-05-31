import OpenAI from "openai";
import { z } from "zod";
import { WordValidationError } from "@/lib/errors";
import { normalizeArticleAndGender } from "@/lib/gender";
import type { DutchArticle, DutchGender, ExampleSentence } from "@/types";
import type { InputLanguage } from "@/lib/word-input";

const genderFieldsSchema = z.object({
  article: z.enum(["de", "het"]).nullable(),
  gender: z.enum(["masculine", "feminine", "neuter"]).nullable(),
});

const cardGenerationResponseSchema = z.object({
  isValid: z.boolean(),
  errorMessage: z.string().optional(),
  suggestedCorrection: z.string().optional(),
  dutchWord: z.string().optional(),
  englishWord: z.string().optional(),
  englishDefinition: z.string().optional(),
  article: z.enum(["de", "het"]).nullable().optional(),
  gender: z.enum(["masculine", "feminine", "neuter"]).nullable().optional(),
  exampleSentences: z
    .array(
      z.object({
        dutch: z.string().min(1),
        english: z.string().min(1),
      }),
    )
    .optional(),
});

const genderOnlyResponseSchema = z.object({
  article: z.enum(["de", "het"]).nullable(),
  gender: z.enum(["masculine", "feminine", "neuter"]).nullable(),
});

export type GeneratedContent = {
  dutchWord: string;
  englishWord: string;
  englishDefinition: string;
  exampleSentences: ExampleSentence[];
  article: DutchArticle | null;
  gender: DutchGender | null;
};

export type GenderMetadata = {
  article: DutchArticle | null;
  gender: DutchGender | null;
};

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not defined");
  }
  return new OpenAI({ apiKey });
}

const genderInstructions = `
- article: "de", "het", or null when the entry is not a noun
- gender: "masculine", "feminine", "neuter", or null when not a noun
Rules for Dutch nouns:
- het words are always neuter
- de words are masculine or feminine (choose the standard gender for the lemma)
- verbs, adjectives, adverbs, and other non-nouns must use null for both fields`;

function buildPrompt(word: string, language: InputLanguage): string {
  if (language === "english") {
    return `The learner entered the English word or phrase "${word}" for a Dutch vocabulary flashcard app.

Validate the input:
- Reject gibberish, random characters, or clearly not English vocabulary
- If it looks like a typo, set isValid to false and provide suggestedCorrection
- Accept common English nouns, verbs, adjectives, and short phrases learners would study

If valid, return JSON with:
- isValid: true
- dutchWord: the best primary Dutch translation (single lemma, lowercase)
- englishWord: the primary English translation (usually 1-3 words, e.g. "jacket", "to run")
- englishDefinition: one short learner-friendly English sentence explaining the meaning (must not be only the englishWord repeated)
${genderInstructions}
- exampleSentences: 2-3 objects with dutch and english fields using the Dutch word naturally

If invalid, return JSON with:
- isValid: false
- errorMessage: clear explanation for the learner
- suggestedCorrection: corrected spelling if applicable, otherwise omit`;
  }

  return `The learner entered the Dutch word "${word}" for a Dutch vocabulary flashcard app.

Validate the input:
- Reject gibberish, random characters, or clearly not Dutch vocabulary
- If it looks like a typo, set isValid to false and provide suggestedCorrection
- Accept valid Dutch words including common learner vocabulary

If valid, return JSON with:
- isValid: true
- dutchWord: the word in lowercase lemma form
- englishWord: the primary English translation (usually 1-3 words, e.g. "jacket", "to run")
- englishDefinition: one short learner-friendly English sentence explaining the meaning (must not be only the englishWord repeated)
${genderInstructions}
- exampleSentences: 2-3 objects with dutch and english fields using the word naturally

If invalid, return JSON with:
- isValid: false
- errorMessage: clear explanation for the learner
- suggestedCorrection: corrected spelling if applicable, otherwise omit`;
}

function parseGenderFields(parsed: {
  article?: DutchArticle | null;
  gender?: DutchGender | null;
}): GenderMetadata {
  return normalizeArticleAndGender({
    article: parsed.article ?? null,
    gender: parsed.gender ?? null,
  });
}

export async function validateAndGenerateCard(
  word: string,
  language: InputLanguage,
): Promise<GeneratedContent> {
  const client = getClient();
  const trimmed = word.trim();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You help English speakers learn Dutch vocabulary. Validate spelling and word validity strictly. Respond with valid JSON only.",
      },
      {
        role: "user",
        content: buildPrompt(trimmed, language),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned empty response");
  }

  const parsed = cardGenerationResponseSchema.parse(JSON.parse(raw));

  if (!parsed.isValid) {
    throw new WordValidationError(
      parsed.errorMessage ??
        `"${trimmed}" does not look like a valid ${language === "dutch" ? "Dutch" : "English"} word.`,
      trimmed,
      parsed.suggestedCorrection,
    );
  }

  if (
    !parsed.dutchWord?.trim() ||
    !parsed.englishWord?.trim() ||
    !parsed.englishDefinition?.trim() ||
    !parsed.exampleSentences?.length
  ) {
    throw new WordValidationError(
      `Could not generate a flashcard for "${trimmed}". Please try a different word.`,
      trimmed,
    );
  }

  const { article, gender } = parseGenderFields(parsed);

  return {
    dutchWord: parsed.dutchWord.trim().toLowerCase(),
    englishWord: parsed.englishWord.trim(),
    englishDefinition: parsed.englishDefinition.trim(),
    exampleSentences: parsed.exampleSentences,
    article,
    gender,
  };
}

const englishWordBackfillSchema = z.object({
  englishWord: z.string().min(1),
  englishDefinition: z.string().min(1),
});

export async function fetchEnglishWordMetadata(
  dutchWord: string,
  currentEnglish: string,
): Promise<{ englishWord: string; englishDefinition: string }> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You help English speakers learn Dutch vocabulary. Return valid JSON only.",
      },
      {
        role: "user",
        content: `For the Dutch word "${dutchWord}", the deck currently stores this English text: "${currentEnglish}".

Return JSON with:
- englishWord: the primary English translation learners should recall (usually 1-3 words, e.g. "jacket", "shirt", "to run")
- englishDefinition: one short learner-friendly English sentence explaining the meaning (not just the englishWord alone)`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned empty response");
  }

  const parsed = englishWordBackfillSchema.parse(JSON.parse(raw));
  return {
    englishWord: parsed.englishWord.trim(),
    englishDefinition: parsed.englishDefinition.trim(),
  };
}

export async function fetchGenderMetadata(
  dutchWord: string,
  englishDefinition: string,
): Promise<GenderMetadata> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a Dutch grammar expert. Return valid JSON only with article and gender for vocabulary flashcards.",
      },
      {
        role: "user",
        content: `For the Dutch word "${dutchWord}" (${englishDefinition}), return JSON with:
${genderInstructions}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned empty response");
  }

  const parsed = genderOnlyResponseSchema.parse(JSON.parse(raw));
  return parseGenderFields(parsed);
}

export function isGenerationComplete(input: {
  englishWord?: string;
  englishDefinition?: string;
  exampleSentences?: ExampleSentence[];
  dutchWord?: string;
}): boolean {
  return Boolean(
    input.dutchWord?.trim() &&
      (input.englishWord?.trim() || input.englishDefinition?.trim()) &&
      input.exampleSentences &&
      input.exampleSentences.length >= 1,
  );
}

export { genderFieldsSchema };
