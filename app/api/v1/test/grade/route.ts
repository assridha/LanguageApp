import { NextRequest } from "next/server";
import { z } from "zod";
import { requireWriteAuth } from "@/lib/api/auth";
import {
  handleRouteError,
  parseJsonBody,
  success,
} from "@/lib/api/response";
import { gradeTestAnswer } from "@/lib/services/testService";
import { QUESTION_TYPES } from "@/types";

const gradeSchema = z.object({
  cardId: z.string().min(1),
  type: z.enum(QUESTION_TYPES),
  answer: z.string(),
});

export async function POST(req: NextRequest) {
  const authError = requireWriteAuth(req);
  if (authError) return authError;

  try {
    const body = gradeSchema.parse(await parseJsonBody(req));
    const result = await gradeTestAnswer(body.cardId, body.type, body.answer);
    return success(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
