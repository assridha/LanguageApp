import { gradeAnswer } from "@/lib/grading";
import { englishForWordToDefinitionAnswer } from "@/lib/card-display";
import { showFocusBadge } from "@/lib/focus";
import { pickAdaptiveQuestionType } from "@/lib/mastery";
import {
  getCard,
  gradeAndUpdateCard,
  listCards,
} from "@/lib/services/cardService";
import type {
  FlashcardDTO,
  QuestionType,
  TestMode,
  TestQuestion,
} from "@/types";
import { QUESTION_TYPES } from "@/types";

export interface SessionOptions {
  mode: TestMode;
  count: number;
  types: QuestionType[];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function weightedSample(cards: FlashcardDTO[], count: number): FlashcardDTO[] {
  const pool = [...cards];
  const selected: FlashcardDTO[] = [];
  const highPriority = pool.filter((c) => showFocusBadge(c));
  const lowPriority = pool.filter((c) => !showFocusBadge(c));

  const focusCount = Math.ceil(count * 0.7);

  const pickWeighted = (source: FlashcardDTO[], n: number) => {
    const available = [...source];
    for (let i = 0; i < n && available.length > 0; i++) {
      const weights = available.map((c) => Math.max(c.priorityScore ?? 1, 1));
      const total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      let idx = 0;
      for (let j = 0; j < weights.length; j++) {
        r -= weights[j];
        if (r <= 0) {
          idx = j;
          break;
        }
      }
      selected.push(available[idx]);
      available.splice(idx, 1);
    }
  };

  pickWeighted(shuffle(highPriority), Math.min(focusCount, count));
  const remaining = count - selected.length;
  if (remaining > 0) {
    pickWeighted(shuffle(lowPriority), remaining);
  }

  if (selected.length < count) {
    const used = new Set(selected.map((c) => c.id));
    const extras = shuffle(pool.filter((c) => !used.has(c.id)));
    selected.push(...extras.slice(0, count - selected.length));
  }

  return selected.slice(0, count);
}

function filterByMode(cards: FlashcardDTO[], mode: TestMode): FlashcardDTO[] {
  switch (mode) {
    case "weak-only":
      return cards.filter(
        (c) => c.stats.masteryScore < 60 || c.stats.lastResult === "incorrect",
      );
    case "new-only":
      return cards.filter((c) => c.stats.timesSeen === 0);
    case "focus":
    case "full":
    default:
      return cards;
  }
}

import { buildQuestion } from "@/lib/test-question";

export async function buildTestSession(options: SessionOptions) {
  const { cards } = await listCards({
    page: 1,
    limit: 500,
    sort: "createdAt",
    order: "desc",
  });

  const types =
    options.types.length > 0
      ? options.types.filter((t) => QUESTION_TYPES.includes(t))
      : [...QUESTION_TYPES];

  const filtered = filterByMode(cards, options.mode);

  if (filtered.length === 0) {
    return {
      questions: [] as TestQuestion[],
      meta: { focusCount: 0, totalAvailable: 0, mode: options.mode },
    };
  }

  const count = Math.min(Math.max(options.count, 1), 50);
  const selected =
    options.mode === "full"
      ? shuffle(filtered).slice(0, count)
      : weightedSample(filtered, Math.min(count, filtered.length));

  const questions: TestQuestion[] = [];

  for (const card of selected) {
    const type = pickAdaptiveQuestionType(card.stats, types);
    let question = buildQuestion(card, type);

    if (!question) {
      const fallback = types.find((t) => t !== type) ?? "definitionToWord";
      question = buildQuestion(card, fallback);
    }

    if (question) questions.push(question);
  }

  const focusCount = selected.filter((c) => showFocusBadge(c)).length;

  return {
    questions: shuffle(questions),
    meta: {
      focusCount,
      totalAvailable: filtered.length,
      mode: options.mode,
      count: questions.length,
    },
  };
}

export async function gradeTestAnswer(
  cardId: string,
  type: QuestionType,
  answer: string,
) {
  const card = await getCard(cardId);
  const expected = getExpected(card, type);
  const isCorrect = gradeAnswer(type, expected, answer);
  const result = await gradeAndUpdateCard(cardId, type, isCorrect);

  return {
    ...result,
    expectedAnswer: expected,
    card: await getCard(cardId),
  };
}

function getExpected(card: FlashcardDTO, type: QuestionType): string {
  if (type === "wordToDefinition") return englishForWordToDefinitionAnswer(card);
  return card.dutchWord;
}
