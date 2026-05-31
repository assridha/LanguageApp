"use client";

import type { QuestionType } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface QuestionPrompt {
  imageUrl?: string;
  imageAlt?: string;
  englishDefinition?: string;
  dutchWord?: string;
}

interface QuestionCardProps {
  type: QuestionType;
  prompt: QuestionPrompt;
  questionNumber: number;
  total: number;
  answer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  feedback?: { correct: boolean; expectedAnswer?: string } | null;
}

export function QuestionCard({
  type,
  prompt,
  questionNumber,
  total,
  answer,
  onAnswerChange,
  onSubmit,
  loading,
  feedback,
}: QuestionCardProps) {
  return (
    <div className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="text-sm text-stone-500">
        Question {questionNumber} of {total} · {formatType(type)}
      </div>

      <div className="min-h-40 flex flex-col items-center justify-center">
        {type === "imageToWord" && prompt.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={prompt.imageUrl}
            alt={prompt.imageAlt ?? "Guess the Dutch word"}
            className="max-h-56 rounded-xl object-contain"
          />
        )}
        {type === "definitionToWord" && (
          <p className="text-center text-xl font-medium text-stone-800">
            {prompt.englishDefinition}
          </p>
        )}
        {type === "wordToDefinition" && (
          <p className="text-center text-4xl font-bold capitalize">
            {prompt.dutchWord}
          </p>
        )}
      </div>

      {!feedback ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <Input
            label={type === "wordToDefinition" ? "English definition" : "Dutch word"}
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            autoFocus
            disabled={loading}
          />
          <Button type="submit" loading={loading} className="w-full">
            Submit
          </Button>
        </form>
      ) : (
        <div
          className={`rounded-xl p-4 ${feedback.correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          <p className="font-semibold">
            {feedback.correct ? "Correct!" : "Incorrect"}
          </p>
          {!feedback.correct && feedback.expectedAnswer && (
            <p className="mt-1 text-sm">Answer: {feedback.expectedAnswer}</p>
          )}
        </div>
      )}
    </div>
  );
}

function formatType(type: QuestionType): string {
  switch (type) {
    case "imageToWord":
      return "Image → Word";
    case "definitionToWord":
      return "Definition → Word";
    case "wordToDefinition":
      return "Word → Definition";
  }
}
