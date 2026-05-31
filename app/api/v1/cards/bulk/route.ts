import { NextRequest } from "next/server";
import { requireWriteAuth } from "@/lib/api/auth";
import {
  handleRouteError,
  parseJsonBody,
  success,
} from "@/lib/api/response";
import {
  bulkCreateCards,
  bulkCreateSchema,
  bulkDeleteCards,
  bulkMutationSchema,
  bulkPatchCards,
} from "@/lib/services/cardService";

export async function POST(req: NextRequest) {
  const authError = requireWriteAuth(req);
  if (authError) return authError;

  try {
    const body = bulkCreateSchema.parse(await parseJsonBody(req));
    const result = await bulkCreateCards(body);
    const status = result.failed.length > 0 && result.created.length > 0 ? 207 : 200;
    return success(result, result.meta, status);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireWriteAuth(req);
  if (authError) return authError;

  try {
    const body = bulkMutationSchema.parse(await parseJsonBody(req));
    const result = await bulkPatchCards(body);
    return success(result);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireWriteAuth(req);
  if (authError) return authError;

  try {
    const body = bulkMutationSchema.parse(await parseJsonBody(req));
    const result = await bulkDeleteCards(body);
    return success(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
