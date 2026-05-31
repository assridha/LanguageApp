import { pickAdaptiveQuestionType } from "@/lib/mastery";
import {
  englishForDefinitionPrompt,
  englishForWordToDefinitionAnswer,
} from "@/lib/card-display";
import type { FlashcardDTO, QuestionType, TestQuestion } from "@/types";

export function buildQuestion(
  card: FlashcardDTO,
  type: QuestionType,
): TestQuestion | null {
  switch (type) {
    case "imageToWord":
      if (!card.imageUrl) return null;
      return {
        cardId: card.id,
        dutchWord: card.dutchWord,
        type,
        prompt: { imageUrl: card.imageUrl, imageAlt: card.imageAlt },
        expectedAnswer: card.dutchWord,
      };
    case "definitionToWord":
      return {
        cardId: card.id,
        dutchWord: card.dutchWord,
        type,
        prompt: { englishDefinition: englishForDefinitionPrompt(card) },
        expectedAnswer: card.dutchWord,
      };
    case "wordToDefinition":
      return {
        cardId: card.id,
        dutchWord: card.dutchWord,
        type,
        prompt: { dutchWord: card.dutchWord },
        expectedAnswer: englishForWordToDefinitionAnswer(card),
      };
  }
}

export function buildRequeueQuestion(
  card: FlashcardDTO,
  previousType: QuestionType,
  enabledTypes: QuestionType[],
): TestQuestion | null {
  const type = pickAdaptiveQuestionType(
    card.stats,
    enabledTypes,
    previousType,
  );
  return buildQuestion(card, type);
}
