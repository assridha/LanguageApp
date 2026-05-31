#!/usr/bin/env npx tsx
import { backfillGenderMetadata } from "../lib/services/cardService";

async function main() {
  const force = process.argv.includes("--force");
  console.log(
    force
      ? "Backfilling article/gender for all cards..."
      : "Backfilling article/gender for cards missing metadata...",
  );

  const result = await backfillGenderMetadata({ force, concurrency: 3 });

  console.log(JSON.stringify(result, null, 2));

  if (result.failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
