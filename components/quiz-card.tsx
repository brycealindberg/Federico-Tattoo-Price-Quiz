"use client";

import { useState, useEffect } from "react";
import { QuizQuestion } from "@/lib/types";

interface QuizCardProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (chosenPrice: number, isCorrect: boolean) => void;
}

export default function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
}: QuizCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const revealed = selectedIndex !== null;
  const isCorrect = selectedIndex === question.correctIndex;

  useEffect(() => {
    if (revealed && isCorrect) {
      const timer = setTimeout(() => {
        onAnswer(question.choices[selectedIndex], true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [revealed, isCorrect, selectedIndex, question.choices, onAnswer]);

  function handleSelect(index: number) {
    if (revealed) return;
    setSelectedIndex(index);
  }

  function handleNext() {
    if (selectedIndex === null) return;
    onAnswer(question.choices[selectedIndex], false);
  }

  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-md flex-col px-4 py-4">
      {/* Progress bar */}
      <div className="mb-3 shrink-0">
        <div className="mb-1.5 flex justify-between text-xs font-medium text-zinc-500">
          <span>{questionNumber} / {totalQuestions}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tattoo image — flexes to fill remaining space */}
      <div className="relative mb-3 min-h-0 flex-1 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50">
        <img
          src={question.tattoo.image_url}
          alt="Tattoo"
          className="h-full w-full object-contain p-1"
        />

        {/* Correct overlay */}
        {revealed && isCorrect && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm">
            <p className="text-2xl font-black tracking-tight text-emerald-400">Correct!</p>
          </div>
        )}

        {/* Wrong overlay */}
        {revealed && !isCorrect && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/70 px-6 backdrop-blur-sm">
            <p className="text-lg font-bold text-red-400">
              ${question.tattoo.price.toLocaleString()}
            </p>
            {question.tattoo.description && (
              <p className="max-w-xs text-center text-xs leading-relaxed text-zinc-400">
                {question.tattoo.description}
              </p>
            )}
            <button
              onClick={handleNext}
              className="mt-2 rounded-full bg-zinc-100 px-6 py-2 text-sm font-bold text-zinc-950 transition-all active:scale-[0.97]"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Choices — 2-column grid to fit on screen */}
      <div className="shrink-0">
        <p className="mb-2 text-center text-sm font-semibold text-zinc-400">
          How much did this cost?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {question.choices.slice(0, 4).map((price, index) => {
            let cls =
              "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ";

            if (!revealed) {
              cls +=
                "border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-amber-500/50 active:scale-[0.97]";
            } else if (index === question.correctIndex) {
              cls += "border-emerald-500 bg-emerald-500/10 text-emerald-400";
            } else if (index === selectedIndex) {
              cls += "border-red-500 bg-red-500/10 text-red-400";
            } else {
              cls += "border-zinc-800/50 bg-zinc-900/50 text-zinc-700";
            }

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={revealed}
                className={cls}
              >
                ${price.toLocaleString()}
              </button>
            );
          })}
        </div>
        {question.choices.length > 4 && (
          <button
            onClick={() => handleSelect(4)}
            disabled={revealed}
            className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
              !revealed
                ? "border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-amber-500/50 active:scale-[0.97]"
                : 4 === question.correctIndex
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                  : 4 === selectedIndex
                    ? "border-red-500 bg-red-500/10 text-red-400"
                    : "border-zinc-800/50 bg-zinc-900/50 text-zinc-700"
            }`}
          >
            ${question.choices[4].toLocaleString()}
          </button>
        )}
      </div>
    </div>
  );
}
