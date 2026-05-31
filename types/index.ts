export type DutchArticle = "de" | "het";
export type DutchGender = "masculine" | "feminine" | "neuter";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "interjection"
  | "phrase"
  | "other";

export type QuestionType =
  | "imageToWord"
  | "definitionToWord"
  | "wordToDefinition";

export type TestMode = "focus" | "weak-only" | "new-only" | "full";

export type LastResult = "correct" | "incorrect";

export interface ExampleSentence {
  dutch: string;
  english: string;
}

export interface TypeStats {
  seen: number;
  correct: number;
  lastResult?: LastResult;
  lastTestedAt?: string;
}

export interface CardStats {
  masteryScore: number;
  timesSeen: number;
  timesCorrect: number;
  lastTestedAt?: string;
  lastResult?: LastResult;
  consecutiveCorrect: number;
  byType: Record<QuestionType, TypeStats>;
}

export interface FlashcardDTO {
  id: string;
  dutchWord: string;
  englishDefinition: string;
  englishWord?: string | null;
  article?: DutchArticle | null;
  gender?: DutchGender | null;
  partOfSpeech?: PartOfSpeech | null;
  exampleSentences: ExampleSentence[];
  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;
  userPinned: boolean;
  focusDismissed?: boolean;
  stats: CardStats;
  priorityScore?: number;
  weakestType?: QuestionType;
  createdAt: string;
  updatedAt: string;
}

export interface TestQuestion {
  cardId: string;
  dutchWord: string;
  type: QuestionType;
  prompt: {
    imageUrl?: string;
    imageAlt?: string;
    englishDefinition?: string;
    dutchWord?: string;
  };
  expectedAnswer: string;
}

export const QUESTION_TYPES: QuestionType[] = [
  "imageToWord",
  "definitionToWord",
  "wordToDefinition",
];

export const FOCUS_THRESHOLD = 50;

export function defaultTypeStats(): Record<QuestionType, TypeStats> {
  return {
    imageToWord: { seen: 0, correct: 0 },
    definitionToWord: { seen: 0, correct: 0 },
    wordToDefinition: { seen: 0, correct: 0 },
  };
}

export function defaultStats(): CardStats {
  return {
    masteryScore: 0,
    timesSeen: 0,
    timesCorrect: 0,
    consecutiveCorrect: 0,
    byType: defaultTypeStats(),
  };
}
