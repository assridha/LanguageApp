"use client";

import { useState } from "react";
import { QuestionCard } from "@/components/test/QuestionCard";
import { ResultsSummary } from "@/components/test/ResultsSummary";
import { TestModeSelector } from "@/components/test/TestModeSelector";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import {
  gradeTestAnswer,
  patchCard,
  startTestSession,
} from "@/lib/api-client";
import { getFocusPatch } from "@/lib/focus";
import { buildRequeueQuestion } from "@/lib/test-question";
import type {
  FlashcardDTO,
  QuestionType,
  TestMode,
  TestQuestion,
} from "@/types";
import { QUESTION_TYPES } from "@/types";

type ClientQuestion = Omit<TestQuestion, "expectedAnswer">;

interface SessionState {
  questions: ClientQuestion[];
  requeued: Set<string>;
  index: number;
  score: number;
  byType: Record<QuestionType, { correct: number; total: number }>;
  missed: FlashcardDTO[];
  cards: Map<string, FlashcardDTO>;
}

export default function TestPage() {
  const [phase, setPhase] = useState<"setup" | "quiz" | "results">("setup");
  const [mode, setMode] = useState<TestMode>("focus");
  const [count, setCount] = useState(10);
  const [types, setTypes] = useState<QuestionType[]>([...QUESTION_TYPES]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [session, setSession] = useState<SessionState | null>(null);
  const [answer, setAnswer] = useState("");
  const [grading, setGrading] = useState(false);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    expectedAnswer?: string;
  } | null>(null);

  function toggleType(type: QuestionType) {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  async function startSession() {
    if (types.length === 0) {
      setError("Select at least one question type");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await startTestSession({ mode, count, types });
      if (data.questions.length === 0) {
        setError("No questions available for this mode. Try another mode or add cards.");
        return;
      }

      setSession({
        questions: data.questions,
        requeued: new Set(),
        index: 0,
        score: 0,
        byType: {
          imageToWord: { correct: 0, total: 0 },
          definitionToWord: { correct: 0, total: 0 },
          wordToDefinition: { correct: 0, total: 0 },
        },
        missed: [],
        cards: new Map(),
      });
      setPhase("quiz");
      setAnswer("");
      setFeedback(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start test");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!session) return;
    const q = session.questions[session.index];
    if (!answer.trim()) return;

    setGrading(true);
    try {
      const { data } = await gradeTestAnswer({
        cardId: q.cardId,
        type: q.type,
        answer: answer.trim(),
      });

      setFeedback({
        correct: data.correct,
        expectedAnswer: data.correct ? undefined : data.expectedAnswer,
      });

      const newSession = { ...session };
      newSession.byType[q.type].total += 1;
      if (data.correct) {
        newSession.score += 1;
        newSession.byType[q.type].correct += 1;
      } else {
        newSession.missed = [...newSession.missed, data.card];
        newSession.cards.set(data.card.id, data.card);

        if (!newSession.requeued.has(q.cardId)) {
          const requeue = buildRequeueQuestion(data.card, q.type, types);
          if (requeue) {
            newSession.questions.push({
              cardId: requeue.cardId,
              dutchWord: requeue.dutchWord,
              type: requeue.type,
              prompt: requeue.prompt,
            });
            newSession.requeued.add(q.cardId);
          }
        }
      }

      setSession(newSession);

      setTimeout(() => {
        if (newSession.index >= newSession.questions.length - 1) {
          setPhase("results");
        } else {
          setSession((s) => (s ? { ...s, index: s.index + 1 } : s));
          setAnswer("");
          setFeedback(null);
        }
        setGrading(false);
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed");
      setGrading(false);
    }
  }

  async function handlePin(id: string) {
    await patchCard(id, getFocusPatch(true));
  }

  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Test</h1>
          <p className="text-stone-600">
            Adaptive quizzes prioritize words you need to focus on.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-semibold">Mode</h2>
          <TestModeSelector mode={mode} onChange={setMode} />
        </section>

        <Input
          label="Number of questions"
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />

        <section className="space-y-2">
          <h2 className="font-semibold">Question types</h2>
          {QUESTION_TYPES.map((type) => (
            <Toggle
              key={type}
              label={formatType(type)}
              checked={types.includes(type)}
              onChange={() => toggleType(type)}
            />
          ))}
        </section>

        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button onClick={startSession} loading={loading} className="w-full">
          Start test
        </Button>
      </div>
    );
  }

  if (phase === "results" && session) {
    const uniqueMissed = Array.from(
      new Map(session.missed.map((c) => [c.id, c])).values(),
    );

    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">Results</h1>
        <ResultsSummary
          score={session.score}
          total={session.questions.length}
          byType={session.byType}
          missed={uniqueMissed}
          onPin={handlePin}
        />
      </div>
    );
  }

  if (!session) return null;

  const q = session.questions[session.index];

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Test</h1>
      <QuestionCard
        type={q.type}
        prompt={q.prompt}
        questionNumber={session.index + 1}
        total={session.questions.length}
        answer={answer}
        onAnswerChange={setAnswer}
        onSubmit={submitAnswer}
        loading={grading}
        feedback={feedback}
      />
    </div>
  );
}

function formatType(type: QuestionType): string {
  switch (type) {
    case "imageToWord":
      return "Image → Dutch word";
    case "definitionToWord":
      return "English definition → Dutch word";
    case "wordToDefinition":
      return "Dutch word → English definition";
  }
}
