import { NextRequest } from "next/server";
import { requireWriteAuth } from "@/lib/api/auth";
import {
  created,
  handleRouteError,
  parseJsonBody,
  success,
} from "@/lib/api/response";
import {
  createCard,
  createCardSchema,
  listCards,
  listCardsSchema,
} from "@/lib/services/cardService";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = listCardsSchema.parse(params);
    const result = await listCards(query);
    return success(result.cards, result.meta);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  const authError = requireWriteAuth(req);
  if (authError) return authError;

  try {
    const body = createCardSchema.parse(await parseJsonBody(req));
    const card = await createCard(body);
    return created(card);
  } catch (err) {
    return handleRouteError(err);
  }
}
