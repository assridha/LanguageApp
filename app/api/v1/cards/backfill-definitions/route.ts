import { NextRequest } from "next/server";
import { requireWriteAuth } from "@/lib/api/auth";
import { handleRouteError, parseJsonBody, success } from "@/lib/api/response";
import { backfillDefinitions } from "@/lib/services/cardService";
import { z } from "zod";

const bodySchema = z.object({
  concurrency: z.number().min(1).max(10).optional(),
  force: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const authError = requireWriteAuth(req);
  if (authError) return authError;

  try {
    const body = bodySchema.parse(await parseJsonBody(req));
    const result = await backfillDefinitions(body);
    return success(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
