import type {
  CardStats,
  FlashcardDTO,
  LastResult,
  QuestionType,
} from "@/types";
import { FOCUS_THRESHOLD, QUESTION_TYPES } from "@/types";

const STALE_DAYS = 7;

function typeAccuracy(stats: { seen: number; correct: number }): number {
  if (stats.seen === 0) return 0;
  return (stats.correct / stats.seen) * 100;
}

function weakestTypeGap(stats: CardStats): number {
  const accuracies = QUESTION_TYPES.map((t) =>
    typeAccuracy(stats.byType[t]),
  );
  const tested = accuracies.filter((_, i) => stats.byType[QUESTION_TYPES[i]].seen > 0);
  if (tested.length < 2) return 0;
  return Math.max(...accuracies) - Math.min(...accuracies);
}

function isStaleWeak(stats: CardStats): boolean {
  if (!stats.lastTestedAt || stats.masteryScore >= 70) return false;
  const days =
    (Date.now() - new Date(stats.lastTestedAt).getTime()) / (1000 * 60 * 60 * 24);
  return days > STALE_DAYS;
}

export function computePriorityScore(
  stats: CardStats,
  userPinned: boolean,
): number {
  const neverTested = stats.timesSeen === 0;
  let score = (100 - stats.masteryScore) * 0.35;

  if (neverTested) score += 35;
  if (stats.lastResult === "incorrect") score += 25;
  if (userPinned) score += 20;
  if (isStaleWeak(stats)) score += 15;
  score += weakestTypeGap(stats) * 0.15;

  return Math.round(score * 10) / 10;
}

export function isFocusWord(priorityScore: number): boolean {
  return priorityScore >= FOCUS_THRESHOLD;
}

export function getWeakestType(stats: CardStats): QuestionType | undefined {
  let weakest: QuestionType | undefined;
  let lowest = Infinity;

  for (const type of QUESTION_TYPES) {
    const s = stats.byType[type];
    const acc = s.seen === 0 ? -1 : typeAccuracy(s);
    if (acc < lowest) {
      lowest = acc;
      weakest = type;
    }
  }

  return weakest;
}

export function pickAdaptiveQuestionType(
  stats: CardStats,
  enabledTypes: QuestionType[],
  excludeType?: QuestionType,
): QuestionType {
  const candidates = enabledTypes.filter((t) => t !== excludeType);
  if (candidates.length === 0) {
    return enabledTypes[0] ?? "definitionToWord";
  }

  const sorted = [...candidates].sort((a, b) => {
    const accA = typeAccuracy(stats.byType[a]);
    const accB = typeAccuracy(stats.byType[b]);
    const seenA = stats.byType[a].seen;
    const seenB = stats.byType[b].seen;
    if (seenA === 0 && seenB > 0) return -1;
    if (seenB === 0 && seenA > 0) return 1;
    return accA - accB;
  });

  return sorted[0];
}

export function applyTestResult(
  stats: CardStats,
  type: QuestionType,
  correct: boolean,
): CardStats {
  const now = new Date().toISOString();
  const result: LastResult = correct ? "correct" : "incorrect";
  const updated = structuredClone(stats);

  updated.timesSeen += 1;
  if (correct) updated.timesCorrect += 1;

  updated.lastTestedAt = now;
  updated.lastResult = result;

  const typeStats = updated.byType[type];
  typeStats.seen += 1;
  if (correct) typeStats.correct += 1;
  typeStats.lastResult = result;
  typeStats.lastTestedAt = now;

  if (correct) {
    updated.consecutiveCorrect += 1;
    const bonus = Math.min(updated.consecutiveCorrect, 5);
    updated.masteryScore = Math.min(100, updated.masteryScore + 8 + bonus);
  } else {
    updated.consecutiveCorrect = 0;
    updated.masteryScore = Math.max(0, updated.masteryScore - 18);
  }

  return updated;
}

export function applyPracticeKnownBump(stats: CardStats): CardStats {
  const updated = structuredClone(stats);
  updated.masteryScore = Math.min(100, updated.masteryScore + 5);
  return updated;
}

export function enrichCard<T extends { stats: CardStats; userPinned: boolean }>(
  card: T,
): T & { priorityScore: number; weakestType?: QuestionType } {
  const priorityScore = computePriorityScore(card.stats, card.userPinned);
  return {
    ...card,
    priorityScore,
    weakestType: getWeakestType(card.stats),
  };
}

export function computeDeckSummary(cards: FlashcardDTO[]) {
  const total = cards.length;
  const avgMastery =
    total === 0
      ? 0
      : Math.round(
          cards.reduce((sum, c) => sum + c.stats.masteryScore, 0) / total,
        );
  const focusCount = cards.filter(
    (c) =>
      c.userPinned ||
      (!c.focusDismissed && (c.priorityScore ?? 0) >= FOCUS_THRESHOLD),
  ).length;

  return { total, avgMastery, focusCount };
}
