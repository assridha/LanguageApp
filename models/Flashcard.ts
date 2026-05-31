import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { defaultTypeStats } from "@/types";

const typeStatsSchema = new Schema(
  {
    seen: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    lastResult: { type: String, enum: ["correct", "incorrect"] },
    lastTestedAt: { type: Date },
  },
  { _id: false },
);

const exampleSentenceSchema = new Schema(
  {
    dutch: { type: String, required: true },
    english: { type: String, required: true },
  },
  { _id: false },
);

const flashcardSchema = new Schema(
  {
    dutchWord: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    englishDefinition: { type: String, required: true },
    englishWord: { type: String },
    article: { type: String, enum: ["de", "het"], default: null },
    gender: {
      type: String,
      enum: ["masculine", "feminine", "neuter"],
      default: null,
    },
    exampleSentences: { type: [exampleSentenceSchema], default: [] },
    imageUrl: { type: String },
    imageAlt: { type: String },
    imageCredit: { type: String },
    userPinned: { type: Boolean, default: false },
    focusDismissed: { type: Boolean, default: false },
    stats: {
      masteryScore: { type: Number, default: 0, min: 0, max: 100 },
      timesSeen: { type: Number, default: 0 },
      timesCorrect: { type: Number, default: 0 },
      lastTestedAt: { type: Date },
      lastResult: { type: String, enum: ["correct", "incorrect"] },
      consecutiveCorrect: { type: Number, default: 0 },
      byType: {
        imageToWord: { type: typeStatsSchema, default: () => defaultTypeStats().imageToWord },
        definitionToWord: {
          type: typeStatsSchema,
          default: () => defaultTypeStats().definitionToWord,
        },
        wordToDefinition: {
          type: typeStatsSchema,
          default: () => defaultTypeStats().wordToDefinition,
        },
      },
    },
  },
  { timestamps: true },
);

flashcardSchema.index({ "stats.masteryScore": 1 });
flashcardSchema.index({ userPinned: 1 });

export type FlashcardDocument = InferSchemaType<typeof flashcardSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

// Dev HMR can keep a stale model that omits newer schema fields (e.g. focusDismissed).
if (process.env.NODE_ENV !== "production" && mongoose.models.Flashcard) {
  mongoose.deleteModel("Flashcard");
}

export const Flashcard: Model<FlashcardDocument> =
  mongoose.models.Flashcard ??
  mongoose.model<FlashcardDocument>("Flashcard", flashcardSchema);
