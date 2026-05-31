import { NextRequest } from "next/server";
import { requireWriteAuth } from "@/lib/api/auth";
import {
  handleRouteError,
  parseJsonBody,
  success,
} from "@/lib/api/response";
import {
  generateByThemeSchema,
  generateCardsByTheme,
} from "@/lib/services/cardService";

export async function POST(req: NextRequest) {
  const authError = requireWriteAuth(req);
  if (authError) return authError;

  try {
    const body = generateByThemeSchema.parse(await parseJsonBody(req));
    const result = await generateCardsByTheme(body);
    const status =
      result.failed.length > 0 && result.created.length > 0 ? 207 : 200;
    return success(result, result.meta, status);
  } catch (err) {
    return handleRouteError(err);
  }
}
