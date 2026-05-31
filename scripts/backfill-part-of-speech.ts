#!/usr/bin/env npx tsx
import { backfillPartOfSpeech } from "../lib/services/cardService";

async function main() {
  const force = process.argv.includes("--force");
  console.log(
    force
      ? "Backfilling part of speech for all cards..."
      : "Backfilling part of speech for cards missing metadata...",
  );

  const result = await backfillPartOfSpeech({ force, concurrency: 3 });

  console.log(JSON.stringify(result, null, 2));

  if (result.failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
