import { NextRequest } from "next/server";
import { z } from "zod";
import { requireWriteAuth } from "@/lib/api/auth";
import {
  handleRouteError,
  parseJsonBody,
  success,
} from "@/lib/api/response";
import { buildTestSession } from "@/lib/services/testService";
import { QUESTION_TYPES } from "@/types";

const sessionSchema = z.object({
  mode: z.enum(["focus", "weak-only", "new-only", "full"]).default("focus"),
  count: z.number().min(1).max(50).default(10),
  types: z.array(z.enum(QUESTION_TYPES)).default([...QUESTION_TYPES]),
});

export async function POST(req: NextRequest) {
  const authError = requireWriteAuth(req);
  if (authError) return authError;

  try {
    const body = sessionSchema.parse(await parseJsonBody(req));
    const session = await buildTestSession(body);

    const clientQuestions = session.questions.map((q) => ({
      cardId: q.cardId,
      dutchWord: q.dutchWord,
      type: q.type,
      prompt: q.prompt,
    }));

    return success(
      { questions: clientQuestions },
      session.meta,
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
