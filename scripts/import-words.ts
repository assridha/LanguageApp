#!/usr/bin/env npx tsx
import { readFileSync } from "fs";

const file = process.argv[2];
const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";
const apiKey = process.env.AGENT_API_KEY;

if (!file) {
  console.error("Usage: npx tsx scripts/import-words.ts <words.txt>");
  process.exit(1);
}

const words = readFileSync(file, "utf-8")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean);

if (words.length === 0) {
  console.error("No words found in file");
  process.exit(1);
}

async function main() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(`${baseUrl}/api/v1/cards/bulk`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      words,
      options: { skipDuplicates: true },
    }),
  });

  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));

  if (!json.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
