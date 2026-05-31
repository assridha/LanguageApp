import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { DuplicateWordError, WordValidationError } from "@/lib/errors";

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export function success<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200,
): NextResponse {
  return NextResponse.json({ ok: true, data, meta }, { status });
}

export function created<T>(data: T, meta?: Record<string, unknown>): NextResponse {
  return success(data, meta, 201);
}

export function error(
  code: string,
  message: string,
  status: number,
  details?: unknown,
): NextResponse {
  return NextResponse.json(
    { ok: false, error: { code, message, details } satisfies ApiErrorBody },
    { status },
  );
}

export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof DuplicateWordError) {
    return error("DUPLICATE_WORD", err.message, 409, {
      dutchWord: err.dutchWord,
      existingCardId: err.existingCardId,
      inputWord: err.inputWord,
    });
  }

  if (err instanceof WordValidationError) {
    return error("UNKNOWN_WORD", err.message, 422, {
      word: err.word,
      suggestion: err.suggestion,
    });
  }

  if (err instanceof ZodError) {
    const message = err.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    return error("VALIDATION_ERROR", message, 400, err.issues);
  }

  if (err instanceof Error) {
    if (err.message.includes("duplicate key") || err.message.includes("E11000")) {
      return error(
        "DUPLICATE_WORD",
        "A card with this Dutch word already exists",
        409,
      );
    }
    if (err.message.includes("not found")) {
      return error("NOT_FOUND", err.message, 404);
    }
    if (err.message.includes("Validation")) {
      return error("VALIDATION_ERROR", err.message, 400);
    }
    console.error(err);
    return error("INTERNAL_ERROR", err.message, 500);
  }
  console.error(err);
  return error("INTERNAL_ERROR", "An unexpected error occurred", 500);
}

export function parseJsonBody<T>(req: NextRequest): Promise<T> {
  return req.json() as Promise<T>;
}
