import type { FlashcardDTO } from "@/types";
import {
  isDefinitionSafeForTesting,
  sanitizeDefinitionForPrompt,
} from "@/lib/definition-quality";

export function primaryEnglish(card: {
  englishWord?: string | null;
  englishDefinition: string;
}): string {
  const word = card.englishWord?.trim();
  if (word) return word;
  return sanitizeStoredDefinition(card);
}

function sanitizeStoredDefinition(card: {
  dutchWord?: string;
  englishWord?: string | null;
  englishDefinition: string;
}): string {
  const definition = card.englishDefinition.trim();
  if (!card.dutchWord || isDefinitionSafeForTesting(definition, card.dutchWord)) {
    return definition;
  }
  return sanitizeDefinitionForPrompt(
    definition,
    card.dutchWord,
    card.englishWord,
  );
}

export function secondaryEnglishDefinition(card: {
  dutchWord?: string;
  englishWord?: string | null;
  englishDefinition: string;
}): string | null {
  const word = card.englishWord?.trim();
  const definition = sanitizeStoredDefinition(card);
  if (!word || !definition) return null;

  const wordLower = word.toLowerCase();
  const defLower = definition.toLowerCase();

  if (wordLower === defLower) return null;
  if (defLower.startsWith(wordLower + " ")) return definition;
  if (defLower.startsWith("a ") && defLower.includes(wordLower)) return definition;
  if (defLower.startsWith("an ") && defLower.includes(wordLower)) return definition;
  if (defLower.startsWith("the ") && defLower.includes(wordLower)) return definition;

  return definition;
}

export function englishForDefinitionPrompt(card: FlashcardDTO): string {
  const secondary = secondaryEnglishDefinition(card);
  const raw = secondary ?? primaryEnglish(card);
  if (isDefinitionSafeForTesting(raw, card.dutchWord)) {
    return raw;
  }
  return sanitizeDefinitionForPrompt(raw, card.dutchWord, card.englishWord);
}

export function englishForWordToDefinitionAnswer(card: FlashcardDTO): string {
  return primaryEnglish(card);
}
