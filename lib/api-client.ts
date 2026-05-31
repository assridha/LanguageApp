import type {
  FlashcardDTO,
  QuestionType,
  TestMode,
  TestQuestion,
} from "@/types";
import type { InputLanguage } from "@/lib/word-input";
import { showFocusBadge } from "@/lib/focus";

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: {
      word?: string;
      suggestion?: string;
      dutchWord?: string;
      existingCardId?: string;
      inputWord?: string;
    };
  };
}

export class ApiError extends Error {
  code?: string;
  details?: ApiResponse<unknown>["error"] extends infer E
    ? E extends { details?: infer D }
      ? D
      : never
    : never;

  constructor(message: string, code?: string, details?: ApiError["details"]) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok || json.data === undefined) {
    throw new ApiError(
      json.error?.message ?? "Request failed",
      json.error?.code,
      json.error?.details,
    );
  }
  return { data: json.data, meta: json.meta };
}

export async function fetchCards(params?: Record<string, string>) {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  return apiFetch<FlashcardDTO[]>(`/api/v1/cards${qs}`);
}

export async function fetchFocusCards(limit = 20) {
  return apiFetch<FlashcardDTO[]>(`/api/v1/cards/focus?limit=${limit}`);
}

export async function fetchCard(id: string) {
  return apiFetch<FlashcardDTO>(`/api/v1/cards/${id}`);
}

export async function createCard(body: {
  word: string;
  inputLanguage: InputLanguage;
  imageUrl?: string;
}) {
  return apiFetch<FlashcardDTO>("/api/v1/cards", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface BulkCreateResult {
  created: Array<{ dutchWord: string; id: string }>;
  skipped: Array<{ dutchWord: string; reason: string }>;
  failed: Array<{
    dutchWord: string;
    error: {
      code: string;
      message: string;
      suggestion?: string;
      existingCardId?: string;
    };
  }>;
}

export async function bulkCreateCards(body: {
  words: string[];
  inputLanguage: InputLanguage;
}) {
  return apiFetch<BulkCreateResult>("/api/v1/cards/bulk", {
    method: "POST",
    body: JSON.stringify({
      words: body.words,
      options: { inputLanguage: body.inputLanguage },
    }),
  });
}

export async function generateCardsByTheme(body: {
  theme: string;
  count?: number;
}) {
  return apiFetch<BulkCreateResult>("/api/v1/cards/generate-by-theme", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchCard(
  id: string,
  body: Record<string, unknown>,
) {
  return apiFetch<FlashcardDTO>(`/api/v1/cards/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteCard(id: string) {
  return apiFetch<{ id: string }>(`/api/v1/cards/${id}`, {
    method: "DELETE",
  });
}

export async function startTestSession(body: {
  mode: TestMode;
  count: number;
  types: QuestionType[];
}) {
  return apiFetch<{ questions: Omit<TestQuestion, "expectedAnswer">[] }>(
    "/api/v1/test/session",
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function gradeTestAnswer(body: {
  cardId: string;
  type: QuestionType;
  answer: string;
}) {
  return apiFetch<{
    correct: boolean;
    expectedAnswer: string;
    masteryScore: number;
    priorityScore: number;
    card: FlashcardDTO;
  }>("/api/v1/test/grade", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function computeDeckSummary(cards: FlashcardDTO[]) {
  const total = cards.length;
  const avgMastery =
    total === 0
      ? 0
      : Math.round(
          cards.reduce((sum, c) => sum + c.stats.masteryScore, 0) / total,
        );
  const focusCount = cards.filter((c) => showFocusBadge(c)).length;
  return { total, avgMastery, focusCount };
}
