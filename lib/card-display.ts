import type { FlashcardDTO } from "@/types";

export function primaryEnglish(card: {
  englishWord?: string | null;
  englishDefinition: string;
}): string {
  const word = card.englishWord?.trim();
  if (word) return word;
  return card.englishDefinition.trim();
}

export function secondaryEnglishDefinition(card: {
  englishWord?: string | null;
  englishDefinition: string;
}): string | null {
  const word = card.englishWord?.trim();
  const definition = card.englishDefinition.trim();
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
  return secondary ?? primaryEnglish(card);
}

export function englishForWordToDefinitionAnswer(card: FlashcardDTO): string {
  return primaryEnglish(card);
}
