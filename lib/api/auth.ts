import { NextRequest } from "next/server";
import { error } from "@/lib/api/response";

function isLocalhost(req: NextRequest): boolean {
  const host = req.headers.get("host") ?? "";
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function requireAgentAuth(req: NextRequest): Response | null {
  const agentKey = process.env.AGENT_API_KEY;
  if (!agentKey) return null;

  if (isLocalhost(req) || isSameOrigin(req)) return null;

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${agentKey}`) return null;

  return error("UNAUTHORIZED", "Valid AGENT_API_KEY Bearer token required", 401);
}

export function requireWriteAuth(req: NextRequest): Response | null {
  return requireAgentAuth(req);
}
