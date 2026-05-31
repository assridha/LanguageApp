import { NextRequest } from "next/server";
import { handleRouteError, success } from "@/lib/api/response";
import { getFocusCards } from "@/lib/services/cardService";
import { z } from "zod";

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const { limit } = querySchema.parse(params);
    const cards = await getFocusCards(limit);
    return success(cards, { total: cards.length });
  } catch (err) {
    return handleRouteError(err);
  }
}
