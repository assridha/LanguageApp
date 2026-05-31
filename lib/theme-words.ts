import { Flashcard } from "@/models/Flashcard";
import { connectDB } from "@/lib/mongodb";
import { InsufficientThemeWordsError } from "@/lib/errors";
import { generateThemeWordCandidates } from "@/lib/openai";

const MAX_RETRIES = 3;
const EXCLUDE_HINT_LIMIT = 50;

export async function loadExistingDutchWordSet(): Promise<Set<string>> {
  await connectDB();
  const docs = await Flashcard.find({}, { dutchWord: 1, _id: 0 }).lean();
  return new Set(docs.map((doc) => doc.dutchWord));
}

function buildExcludeHint(
  excludeSet: Set<string>,
  attempted: Set<string>,
): string[] {
  const hint = new Set<string>();

  for (const word of attempted) {
    hint.add(word);
    if (hint.size >= EXCLUDE_HINT_LIMIT) break;
  }

  if (hint.size < EXCLUDE_HINT_LIMIT) {
    for (const word of excludeSet) {
      if (hint.has(word)) continue;
      hint.add(word);
      if (hint.size >= EXCLUDE_HINT_LIMIT) break;
    }
  }

  return Array.from(hint);
}

export async function selectNovelThemeWords(
  theme: string,
  excludeSet: Set<string>,
  count = 10,
): Promise<string[]> {
  const novel: string[] = [];
  const attempted = new Set<string>();

  for (let attempt = 0; attempt < MAX_RETRIES && novel.length < count; attempt++) {
    const needed = count - novel.length;
    const batchSize = needed * 2 + 5;
    const excludeHint = buildExcludeHint(excludeSet, attempted);

    const candidates = await generateThemeWordCandidates(
      theme,
      batchSize,
      excludeHint,
    );

    for (const word of candidates) {
      attempted.add(word);
      if (excludeSet.has(word)) continue;
      novel.push(word);
      if (novel.length >= count) break;
    }
  }

  if (novel.length < count) {
    throw new InsufficientThemeWordsError(
      `Only found ${novel.length} new words for this theme. Try a broader theme or remove some existing cards.`,
      theme,
      count,
      novel.length,
    );
  }

  return novel.slice(0, count);
}
