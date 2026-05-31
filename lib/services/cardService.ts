import pLimit from "p-limit";
import { z } from "zod";
import type { FlashcardDocument } from "@/models/Flashcard";
import { Flashcard } from "@/models/Flashcard";
import { connectDB } from "@/lib/mongodb";
import {
  applyPracticeKnownBump,
  applyTestResult,
  computePriorityScore,
  enrichCard,
  getWeakestType,
} from "@/lib/mastery";
import { showFocusBadge } from "@/lib/focus";
import { DuplicateWordError, WordValidationError } from "@/lib/errors";
import {
  fetchEnglishWordMetadata,
  fetchGenderMetadata,
  isGenerationComplete,
  validateAndGenerateCard,
} from "@/lib/openai";
import { normalizeArticleAndGender } from "@/lib/gender";
import type { InputLanguage } from "@/lib/word-input";
import type { CardStats, DutchArticle, DutchGender, FlashcardDTO, QuestionType } from "@/types";

const inputLanguageSchema = z.enum(["dutch", "english"]);

const optionalUrl = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
  z.string().url().optional(),
);

const createCardBaseSchema = z.object({
  inputLanguage: inputLanguageSchema.default("dutch"),
  word: z.string().min(1).max(100).optional(),
  dutchWord: z.string().min(1).max(100).optional(),
  englishWord: z.string().min(1).max(100).optional(),
  generate: z.boolean().optional().default(true),
  englishDefinition: z.string().optional(),
  exampleSentences: z
    .array(z.object({ dutch: z.string(), english: z.string() }))
    .optional(),
  imageUrl: optionalUrl,
  imageAlt: z.string().optional(),
  article: z.enum(["de", "het"]).nullable().optional(),
  gender: z.enum(["masculine", "feminine", "neuter"]).nullable().optional(),
});

export const createCardSchema = createCardBaseSchema.superRefine((data, ctx) => {
  if (!data.word?.trim() && !data.dutchWord?.trim() && !data.englishWord?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "word, dutchWord, or englishWord is required",
      path: ["word"],
    });
  }
});

export const bulkOptionsSchema = z.object({
  generateMissing: z.boolean().default(true),
  skipDuplicates: z.boolean().default(true),
  inputLanguage: inputLanguageSchema.default("dutch"),
  dryRun: z.boolean().default(false),
  concurrency: z.number().min(1).max(10).default(3),
});

export const bulkCreateSchema = z.object({
  cards: z
    .array(
      createCardBaseSchema
        .omit({ generate: true })
        .extend({ generate: z.boolean().optional() }),
    )
    .optional(),
  words: z.array(z.string().min(1)).optional(),
  options: bulkOptionsSchema.optional(),
});

export const listCardsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
  search: z.string().optional(),
  sort: z.enum(["createdAt", "masteryScore", "dutchWord", "priority"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  hasImage: z.enum(["true", "false"]).optional(),
  focusOnly: z.enum(["true", "false"]).optional(),
  ids: z.string().optional(),
});

export const patchCardSchema = z.object({
  englishWord: z.string().optional(),
  englishDefinition: z.string().optional(),
  exampleSentences: z
    .array(z.object({ dutch: z.string(), english: z.string() }))
    .optional(),
  imageUrl: optionalUrl.nullable().optional(),
  imageAlt: z.string().nullable().optional(),
  imageCredit: z.string().nullable().optional(),
  article: z.enum(["de", "het"]).nullable().optional(),
  gender: z.enum(["masculine", "feminine", "neuter"]).nullable().optional(),
  userPinned: z.boolean().optional(),
  focusDismissed: z.boolean().optional(),
  markKnown: z.boolean().optional(),
  stats: z.never().optional(),
});

export const bulkMutationSchema = z.object({
  ids: z.array(z.string()).optional(),
  dutchWords: z.array(z.string()).optional(),
  patch: patchCardSchema.optional(),
});

function toStatsFromDoc(doc: FlashcardDocument): CardStats {
  return toDTO(doc).stats;
}

function toDTO(doc: FlashcardDocument): FlashcardDTO {
  const base = {
    id: doc._id.toString(),
    dutchWord: doc.dutchWord,
    englishWord: doc.englishWord ?? undefined,
    englishDefinition: doc.englishDefinition,
    article: (doc.article as DutchArticle | null | undefined) ?? null,
    gender: (doc.gender as DutchGender | null | undefined) ?? null,
    exampleSentences: doc.exampleSentences.map((s) => ({
      dutch: s.dutch,
      english: s.english,
    })),
    imageUrl: doc.imageUrl ?? undefined,
    imageAlt: doc.imageAlt ?? undefined,
    imageCredit: doc.imageCredit ?? undefined,
    userPinned: doc.userPinned ?? false,
    focusDismissed: doc.focusDismissed ?? false,
    stats: {
      masteryScore: doc.stats?.masteryScore ?? 0,
      timesSeen: doc.stats?.timesSeen ?? 0,
      timesCorrect: doc.stats?.timesCorrect ?? 0,
      lastTestedAt: doc.stats?.lastTestedAt?.toISOString(),
      lastResult: doc.stats?.lastResult as "correct" | "incorrect" | undefined,
      consecutiveCorrect: doc.stats?.consecutiveCorrect ?? 0,
      byType: {
        imageToWord: {
          seen: doc.stats?.byType?.imageToWord?.seen ?? 0,
          correct: doc.stats?.byType?.imageToWord?.correct ?? 0,
          lastResult: doc.stats?.byType?.imageToWord?.lastResult as
            | "correct"
            | "incorrect"
            | undefined,
          lastTestedAt: doc.stats?.byType?.imageToWord?.lastTestedAt?.toISOString(),
        },
        definitionToWord: {
          seen: doc.stats?.byType?.definitionToWord?.seen ?? 0,
          correct: doc.stats?.byType?.definitionToWord?.correct ?? 0,
          lastResult: doc.stats?.byType?.definitionToWord?.lastResult as
            | "correct"
            | "incorrect"
            | undefined,
          lastTestedAt: doc.stats?.byType?.definitionToWord?.lastTestedAt?.toISOString(),
        },
        wordToDefinition: {
          seen: doc.stats?.byType?.wordToDefinition?.seen ?? 0,
          correct: doc.stats?.byType?.wordToDefinition?.correct ?? 0,
          lastResult: doc.stats?.byType?.wordToDefinition?.lastResult as
            | "correct"
            | "incorrect"
            | undefined,
          lastTestedAt: doc.stats?.byType?.wordToDefinition?.lastTestedAt?.toISOString(),
        },
      },
    },
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };

  return enrichCard(base);
}

function normalizeCreateInput(input: z.infer<typeof createCardSchema>): {
  inputLanguage: InputLanguage;
  word: string;
} {
  if (input.word?.trim()) {
    return {
      inputLanguage: input.inputLanguage,
      word: input.word.trim(),
    };
  }
  if (input.inputLanguage === "english" && input.englishWord?.trim()) {
    return { inputLanguage: "english", word: input.englishWord.trim() };
  }
  if (input.dutchWord?.trim()) {
    return { inputLanguage: "dutch", word: input.dutchWord.trim() };
  }
  throw new Error("Validation: word is required");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findExistingByInput(
  word: string,
  inputLanguage: InputLanguage,
) {
  const trimmed = word.trim();
  const lower = trimmed.toLowerCase();

  if (inputLanguage === "dutch") {
    return Flashcard.findOne({ dutchWord: lower });
  }

  const byDutchSpelling = await Flashcard.findOne({ dutchWord: lower });
  if (byDutchSpelling) return byDutchSpelling;

  return Flashcard.findOne({
    $or: [
      {
        englishWord: {
          $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i"),
        },
      },
      {
        englishDefinition: {
          $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i"),
        },
      },
    ],
  });
}

async function findExistingByDutchWord(dutchWord: string) {
  return Flashcard.findOne({ dutchWord: dutchWord.trim().toLowerCase() });
}

function assertNotDuplicate(
  existing: Awaited<ReturnType<typeof findExistingByDutchWord>>,
  inputWord: string,
) {
  if (!existing) return;
  throw new DuplicateWordError(
    `"${inputWord}" is already in your deck as "${existing.dutchWord}".`,
    existing.dutchWord,
    existing._id.toString(),
    inputWord,
  );
}

async function buildCardFields(input: z.infer<typeof createCardSchema>) {
  const { inputLanguage, word } = normalizeCreateInput(input);
  const shouldGenerate =
    input.generate !== false && !isGenerationComplete(input);

  let dutchWord = input.dutchWord?.trim().toLowerCase() ?? "";
  let englishWord = input.englishWord?.trim() ?? "";
  let englishDefinition = input.englishDefinition ?? "";
  let exampleSentences = input.exampleSentences ?? [];
  let article: DutchArticle | null = input.article ?? null;
  let gender: DutchGender | null = input.gender ?? null;
  const imageUrl = input.imageUrl;
  let imageAlt = input.imageAlt;

  if (shouldGenerate) {
    const generated = await validateAndGenerateCard(word, inputLanguage);
    dutchWord = generated.dutchWord;
    englishWord = generated.englishWord;
    englishDefinition = generated.englishDefinition;
    exampleSentences = generated.exampleSentences;
    article = generated.article;
    gender = generated.gender;
  } else if (!dutchWord) {
    dutchWord = word.trim().toLowerCase();
  }

  ({ article, gender } = normalizeArticleAndGender({ article, gender }));

  if (!imageAlt && imageUrl) {
    imageAlt = dutchWord;
  }

  return {
    dutchWord,
    englishWord: englishWord || undefined,
    englishDefinition,
    exampleSentences,
    article,
    gender,
    imageUrl,
    imageAlt,
  };
}

export async function listCards(query: z.infer<typeof listCardsSchema>) {
  await connectDB();

  const filter: Record<string, unknown> = {};

  if (query.search) {
    filter.$or = [
      { dutchWord: { $regex: query.search, $options: "i" } },
      { englishWord: { $regex: query.search, $options: "i" } },
      { englishDefinition: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.hasImage === "true") filter.imageUrl = { $exists: true, $ne: null };
  if (query.hasImage === "false") {
    filter.$or = [{ imageUrl: { $exists: false } }, { imageUrl: null }];
  }

  if (query.ids) {
    const idList = query.ids.split(",").filter(Boolean);
    filter._id = { $in: idList };
  }

  const docs = await Flashcard.find(filter).lean();
  let cards = docs.map((d) => toDTO(d as FlashcardDocument));

  if (query.focusOnly === "true") {
    cards = cards.filter((c) => showFocusBadge(c));
  }

  if (query.sort === "priority") {
    cards.sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));
  } else if (query.sort === "masteryScore") {
    cards.sort((a, b) =>
      query.order === "asc"
        ? a.stats.masteryScore - b.stats.masteryScore
        : b.stats.masteryScore - a.stats.masteryScore,
    );
  } else if (query.sort === "dutchWord") {
    cards.sort((a, b) =>
      query.order === "asc"
        ? a.dutchWord.localeCompare(b.dutchWord)
        : b.dutchWord.localeCompare(a.dutchWord),
    );
  } else {
    cards.sort((a, b) =>
      query.order === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  const total = cards.length;
  const start = (query.page - 1) * query.limit;
  const pageItems = cards.slice(start, start + query.limit);

  return { cards: pageItems, meta: { page: query.page, limit: query.limit, total } };
}

export async function getFocusCards(limit = 20) {
  await connectDB();
  const docs = await Flashcard.find().lean();
  const cards = docs
    .map((d) => toDTO(d as FlashcardDocument))
    .filter((c) => showFocusBadge(c))
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
    .slice(0, limit);

  return cards;
}

export async function getCard(id: string, byWord = false) {
  await connectDB();
  const doc = byWord
    ? await Flashcard.findOne({ dutchWord: id.toLowerCase() })
    : await Flashcard.findById(id);

  if (!doc) throw new Error("Card not found");
  return toDTO(doc);
}

export async function createCard(input: z.infer<typeof createCardSchema>) {
  await connectDB();

  const normalized = normalizeCreateInput(input);
  const existingBefore = await findExistingByInput(
    normalized.word,
    normalized.inputLanguage,
  );
  assertNotDuplicate(existingBefore, normalized.word);

  const fields = await buildCardFields(input);

  if (normalized.inputLanguage === "english") {
    const existingByDutch = await findExistingByDutchWord(fields.dutchWord);
    assertNotDuplicate(existingByDutch, normalized.word);
  }

  const doc = await Flashcard.create({
    ...fields,
    userPinned: false,
  });

  return toDTO(doc);
}

export async function bulkCreateCards(body: z.infer<typeof bulkCreateSchema>) {
  const options = bulkOptionsSchema.parse(body.options ?? {});
  const concurrency = options.concurrency;
  const limit = pLimit(concurrency);

  const items: z.infer<typeof createCardSchema>[] = [];

  if (body.words?.length) {
    for (const word of body.words) {
      items.push({
        word,
        inputLanguage: options.inputLanguage,
        generate: options.generateMissing,
      });
    }
  }

  if (body.cards?.length) {
    for (const card of body.cards) {
      items.push({
        ...card,
        generate: card.generate ?? options.generateMissing,
      });
    }
  }

  if (items.length === 0) {
    throw new Error("Validation: cards or words array required");
  }
  if (items.length > 100) {
    throw new Error("Validation: maximum 100 items per bulk request");
  }

  const created: Array<{ dutchWord: string; id: string }> = [];
  const skipped: Array<{ dutchWord: string; reason: string }> = [];
  const failed: Array<{
    dutchWord: string;
    error: {
      code: string;
      message: string;
      suggestion?: string;
      existingCardId?: string;
    };
  }> = [];

  await connectDB();

  const processItem = async (item: z.infer<typeof createCardSchema>) => {
    const { word, inputLanguage } = normalizeCreateInput(item);
    const dutchWordKey = word.trim().toLowerCase();

    try {
      const preExisting = await findExistingByInput(word, inputLanguage);
      if (preExisting && options.skipDuplicates !== false) {
        skipped.push({ dutchWord: preExisting.dutchWord, reason: "duplicate" });
        return;
      }

      if (options.dryRun) {
        created.push({
          dutchWord: inputLanguage === "dutch" ? dutchWordKey : word,
          id: "dry-run",
        });
        return;
      }

      if (preExisting && options.skipDuplicates === false) {
        const fields = await buildCardFields(item);
        preExisting.englishWord = fields.englishWord;
        preExisting.englishDefinition = fields.englishDefinition;
        preExisting.set("exampleSentences", fields.exampleSentences);
        preExisting.article = fields.article ?? undefined;
        preExisting.gender = fields.gender ?? undefined;
        if (fields.imageUrl) {
          preExisting.imageUrl = fields.imageUrl;
          preExisting.imageAlt = fields.imageAlt;
        }
        await preExisting.save();
        created.push({ dutchWord: preExisting.dutchWord, id: preExisting._id.toString() });
        return;
      }

      const fields = await buildCardFields(item);
      const dutchWord = fields.dutchWord;
      const existingByDutch = await findExistingByDutchWord(dutchWord);

      if (existingByDutch && options.skipDuplicates !== false) {
        skipped.push({ dutchWord, reason: "duplicate" });
        return;
      }

      if (existingByDutch && options.skipDuplicates === false) {
        existingByDutch.englishWord = fields.englishWord;
        existingByDutch.englishDefinition = fields.englishDefinition;
        existingByDutch.set("exampleSentences", fields.exampleSentences);
        existingByDutch.article = fields.article ?? undefined;
        existingByDutch.gender = fields.gender ?? undefined;
        if (fields.imageUrl) {
          existingByDutch.imageUrl = fields.imageUrl;
          existingByDutch.imageAlt = fields.imageAlt;
        }
        await existingByDutch.save();
        created.push({ dutchWord, id: existingByDutch._id.toString() });
        return;
      }

      const doc = await Flashcard.create({
        ...fields,
        userPinned: false,
      });
      created.push({ dutchWord, id: doc._id.toString() });
    } catch (err) {
      if (err instanceof DuplicateWordError) {
        failed.push({
          dutchWord: dutchWordKey,
          error: {
            code: "DUPLICATE_WORD",
            message: err.message,
            existingCardId: err.existingCardId,
          },
        });
        return;
      }

      const message = err instanceof Error ? err.message : "Unknown error";
      const code = err instanceof WordValidationError ? "UNKNOWN_WORD" : "GENERATION_FAILED";

      failed.push({
        dutchWord: dutchWordKey,
        error: {
          code,
          message,
          ...(err instanceof WordValidationError && err.suggestion
            ? { suggestion: err.suggestion }
            : {}),
        },
      });
    }
  };

  await Promise.all(items.map((item) => limit(() => processItem(item))));

  return {
    created,
    skipped,
    failed,
    meta: {
      requested: items.length,
      created: created.length,
      skipped: skipped.length,
      failed: failed.length,
    },
  };
}

export async function updateCard(
  id: string,
  patch: z.infer<typeof patchCardSchema>,
  byWord = false,
) {
  await connectDB();
  const doc = byWord
    ? await Flashcard.findOne({ dutchWord: id.toLowerCase() })
    : await Flashcard.findById(id);

  if (!doc) throw new Error("Card not found");

  if (patch.englishWord !== undefined) {
    doc.englishWord = patch.englishWord;
  }
  if (patch.englishDefinition !== undefined) {
    doc.englishDefinition = patch.englishDefinition;
  }
  if (patch.exampleSentences !== undefined) {
    doc.set("exampleSentences", patch.exampleSentences);
  }
  if (patch.imageUrl !== undefined) {
    doc.imageUrl = patch.imageUrl ?? undefined;
    if (patch.imageUrl && patch.imageAlt === undefined && !doc.imageAlt) {
      doc.imageAlt = doc.dutchWord;
    }
    if (!patch.imageUrl) {
      doc.imageAlt = undefined;
      doc.imageCredit = undefined;
    }
  }
  if (patch.imageAlt !== undefined) doc.imageAlt = patch.imageAlt ?? undefined;
  if (patch.imageCredit !== undefined) {
    doc.imageCredit = patch.imageCredit ?? undefined;
  }
  if (patch.article !== undefined || patch.gender !== undefined) {
    const normalized = normalizeArticleAndGender({
      article: patch.article !== undefined ? patch.article : doc.article,
      gender: patch.gender !== undefined ? patch.gender : doc.gender,
    });
    doc.article = normalized.article ?? undefined;
    doc.gender = normalized.gender ?? undefined;
  }
  if (patch.userPinned !== undefined) doc.userPinned = patch.userPinned;
  if (patch.focusDismissed !== undefined) {
    doc.focusDismissed = patch.focusDismissed;
  }

  if (patch.markKnown) {
    const currentStats = toStatsFromDoc(doc);
    const updated = applyPracticeKnownBump(currentStats);
    doc.set("stats", updated);
  }

  await doc.save();

  if (patch.userPinned !== undefined || patch.focusDismissed !== undefined) {
    await Flashcard.collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          ...(patch.userPinned !== undefined
            ? { userPinned: patch.userPinned }
            : {}),
          ...(patch.focusDismissed !== undefined
            ? { focusDismissed: patch.focusDismissed }
            : {}),
        },
      },
    );
  }

  return toDTO(doc);
}

export async function replaceCard(
  id: string,
  body: {
    englishWord?: string;
    englishDefinition: string;
    exampleSentences: { dutch: string; english: string }[];
    article?: DutchArticle | null;
    gender?: DutchGender | null;
    imageUrl?: string;
    imageAlt?: string;
    imageCredit?: string;
    userPinned?: boolean;
  },
) {
  await connectDB();
  const doc = await Flashcard.findById(id);
  if (!doc) throw new Error("Card not found");

  if (body.englishWord !== undefined) doc.englishWord = body.englishWord;
  doc.englishDefinition = body.englishDefinition;
  doc.set("exampleSentences", body.exampleSentences);
  if (body.article !== undefined || body.gender !== undefined) {
    const normalized = normalizeArticleAndGender({
      article: body.article ?? null,
      gender: body.gender ?? null,
    });
    doc.article = normalized.article ?? undefined;
    doc.gender = normalized.gender ?? undefined;
  }
  if (body.imageUrl !== undefined) doc.imageUrl = body.imageUrl;
  if (body.imageAlt !== undefined) doc.imageAlt = body.imageAlt;
  if (body.imageCredit !== undefined) doc.imageCredit = body.imageCredit;
  if (body.userPinned !== undefined) doc.userPinned = body.userPinned;

  await doc.save();
  return toDTO(doc);
}

export async function deleteCard(id: string, byWord = false) {
  await connectDB();
  const doc = byWord
    ? await Flashcard.findOneAndDelete({ dutchWord: id.toLowerCase() })
    : await Flashcard.findByIdAndDelete(id);

  if (!doc) throw new Error("Card not found");
  return { id: doc._id.toString(), dutchWord: doc.dutchWord };
}

export async function bulkDeleteCards(body: z.infer<typeof bulkMutationSchema>) {
  await connectDB();
  const filter: Record<string, unknown> = {};

  if (body.ids?.length) filter._id = { $in: body.ids };
  else if (body.dutchWords?.length) {
    filter.dutchWord = { $in: body.dutchWords.map((w) => w.toLowerCase()) };
  } else {
    throw new Error("Validation: ids or dutchWords required");
  }

  const result = await Flashcard.deleteMany(filter);
  return { deletedCount: result.deletedCount };
}

export async function bulkPatchCards(body: z.infer<typeof bulkMutationSchema>) {
  if (!body.patch) throw new Error("Validation: patch object required");
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (body.ids?.length) filter._id = { $in: body.ids };
  else if (body.dutchWords?.length) {
    filter.dutchWord = { $in: body.dutchWords.map((w) => w.toLowerCase()) };
  } else {
    throw new Error("Validation: ids or dutchWords required");
  }

  const update: Record<string, unknown> = {};
  if (body.patch.userPinned !== undefined) {
    update.userPinned = body.patch.userPinned;
  }

  const result = await Flashcard.updateMany(filter, { $set: update });
  return { modifiedCount: result.modifiedCount };
}

export async function gradeAndUpdateCard(
  cardId: string,
  type: QuestionType,
  correct: boolean,
) {
  await connectDB();
  const doc = await Flashcard.findById(cardId);
  if (!doc) throw new Error("Card not found");

  const currentStats = toStatsFromDoc(doc);
  const updated = applyTestResult(currentStats, type, correct);
  doc.set("stats", updated);

  if (!correct) {
    doc.focusDismissed = false;
  }

  await doc.save();
  const dto = toDTO(doc);

  return {
    correct,
    masteryScore: dto.stats.masteryScore,
    priorityScore: dto.priorityScore ?? computePriorityScore(dto.stats, dto.userPinned),
    weakestType: dto.weakestType ?? getWeakestType(dto.stats),
  };
}

export { toDTO };

export async function backfillGenderMetadata(options?: {
  concurrency?: number;
  force?: boolean;
}) {
  await connectDB();
  const concurrency = options?.concurrency ?? 3;
  const limit = pLimit(concurrency);

  const filter = options?.force
    ? {}
    : {
        $or: [
          { article: { $exists: false } },
          { article: null },
          { gender: { $exists: false } },
          { gender: null },
        ],
      };

  const docs = await Flashcard.find(filter);
  const updated: string[] = [];
  const failed: Array<{ dutchWord: string; error: string }> = [];

  await Promise.all(
    docs.map((doc) =>
      limit(async () => {
        try {
          const metadata = await fetchGenderMetadata(
            doc.dutchWord,
            doc.englishWord?.trim() || doc.englishDefinition,
          );
          doc.article = metadata.article ?? undefined;
          doc.gender = metadata.gender ?? undefined;
          await doc.save();
          updated.push(doc.dutchWord);
        } catch (err) {
          failed.push({
            dutchWord: doc.dutchWord,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }),
    ),
  );

  return {
    processed: docs.length,
    updated: updated.length,
    failed,
    updatedWords: updated,
  };
}

export async function backfillEnglishWords(options?: {
  concurrency?: number;
  force?: boolean;
}) {
  await connectDB();
  const concurrency = options?.concurrency ?? 3;
  const limit = pLimit(concurrency);

  const filter = options?.force
    ? {}
    : {
        $or: [
          { englishWord: { $exists: false } },
          { englishWord: null },
          { englishWord: "" },
        ],
      };

  const docs = await Flashcard.find(filter);
  const updated: string[] = [];
  const failed: Array<{ dutchWord: string; error: string }> = [];

  await Promise.all(
    docs.map((doc) =>
      limit(async () => {
        try {
          const metadata = await fetchEnglishWordMetadata(
            doc.dutchWord,
            doc.englishWord?.trim() || doc.englishDefinition,
          );
          doc.englishWord = metadata.englishWord;
          doc.englishDefinition = metadata.englishDefinition;
          await doc.save();
          updated.push(doc.dutchWord);
        } catch (err) {
          failed.push({
            dutchWord: doc.dutchWord,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }),
    ),
  );

  return {
    processed: docs.length,
    updated: updated.length,
    failed,
    updatedWords: updated,
  };
}
