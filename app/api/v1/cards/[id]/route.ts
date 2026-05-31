import { NextRequest } from "next/server";
import { requireWriteAuth } from "@/lib/api/auth";
import {
  handleRouteError,
  parseJsonBody,
  success,
} from "@/lib/api/response";
import {
  deleteCard,
  getCard,
  patchCardSchema,
  replaceCard,
  updateCard,
} from "@/lib/services/cardService";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const byWord = req.nextUrl.searchParams.get("by") === "word";
    const card = await getCard(id, byWord);
    return success(card);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const authError = requireWriteAuth(req);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const body = await parseJsonBody<{
      englishDefinition: string;
      exampleSentences: { dutch: string; english: string }[];
      imageUrl?: string;
      imageAlt?: string;
      imageCredit?: string;
      userPinned?: boolean;
    }>(req);

    const card = await replaceCard(id, body);
    return success(card);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authError = requireWriteAuth(req);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const byWord = req.nextUrl.searchParams.get("by") === "word";
    const patch = patchCardSchema.parse(await parseJsonBody(req));
    const card = await updateCard(id, patch, byWord);
    return success(card);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const authError = requireWriteAuth(req);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const byWord = req.nextUrl.searchParams.get("by") === "word";
    const result = await deleteCard(id, byWord);
    return success(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
