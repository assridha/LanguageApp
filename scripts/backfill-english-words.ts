#!/usr/bin/env npx tsx
import { backfillEnglishWords } from "../lib/services/cardService";

async function main() {
  const force = process.argv.includes("--force");
  console.log(
    force
      ? "Backfilling englishWord for all cards..."
      : "Backfilling englishWord for cards missing it...",
  );

  const result = await backfillEnglishWords({ force, concurrency: 3 });

  console.log(JSON.stringify(result, null, 2));

  if (result.failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
