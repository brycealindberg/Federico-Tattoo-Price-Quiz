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

  const progress = ((questionNumber) / totalQuestions) * 100;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-8">
      {/* Progress bar */}
      <div className="mb-6 w-full">
        <div className="mb-2 flex justify-between text-sm text-zinc-400">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tattoo image */}
      <div className="mb-6 w-full overflow-hidden rounded-2xl">
        <img
          src={question.tattoo.image_url}
          alt="Tattoo"
          className="aspect-square w-full rounded-2xl object-cover"
        />
      </div>

      {/* Prompt */}
      <p className="mb-4 text-lg font-semibold text-zinc-200">
        How much did this tattoo cost?
      </p>

      {/* Choices */}
      <div className="flex w-full flex-col gap-3">
        {question.choices.map((price, index) => {
          let buttonClass =
            "w-full rounded-xl px-6 py-3 text-lg font-semibold transition-all ";

          if (!revealed) {
            buttonClass +=
              "bg-zinc-800 text-white hover:bg-zinc-700 hover:scale-[1.02]";
          } else if (index === question.correctIndex) {
            buttonClass += "bg-green-600 text-white scale-[1.02]";
          } else if (index === selectedIndex) {
            buttonClass += "bg-red-600 text-white";
          } else {
            buttonClass += "bg-zinc-800/50 text-zinc-600";
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={revealed}
              className={buttonClass}
            >
              ${price.toLocaleString()}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {revealed && (
        <div className="mt-4 text-center">
          {isCorrect ? (
            <p className="text-lg font-bold text-green-400">Correct!</p>
          ) : (
            <button
              onClick={handleNext}
              className="mt-2 rounded-xl bg-gradient-to-r from-red-500 to-purple-500 px-8 py-3 font-bold text-white transition-all hover:scale-105"
            >
              Next &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
