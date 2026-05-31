#!/usr/bin/env npx tsx
import { backfillDefinitions } from "../lib/services/cardService";

async function main() {
  const force = process.argv.includes("--force");
  console.log(
    force
      ? "Rewriting definitions for all cards..."
      : "Fixing definitions that include the Dutch word...",
  );

  const result = await backfillDefinitions({ force, concurrency: 3 });

  console.log(JSON.stringify(result, null, 2));

  if (result.failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
