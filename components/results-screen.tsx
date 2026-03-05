"use client";

import { QuizResult } from "@/lib/types";

interface ResultsScreenProps {
  results: QuizResult[];
  onRestart: () => void;
}

function getMessage(percentage: number): string {
  if (percentage >= 80) return "Amazing! You really know your ink!";
  if (percentage >= 50) return "Not bad! You have a decent eye for pricing.";
  return "Tattoo pricing is tricky! Better luck next time.";
}

export default function ResultsScreen({
  results,
  onRestart,
}: ResultsScreenProps) {
  const correct = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const percentage = total > 0 ? (correct / total) * 100 : 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-12">
      {/* Score */}
      <div className="mb-2 text-6xl font-extrabold tracking-tight">
        <span className="bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
          {correct}/{total}
        </span>
      </div>

      <p className="mb-8 text-lg text-zinc-400">{getMessage(percentage)}</p>

      {/* Result cards grid */}
      <div className="mb-8 grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
        {results.map((result, index) => (
          <div
            key={index}
            className={`overflow-hidden rounded-xl border-2 bg-zinc-900 ${
              result.isCorrect ? "border-green-500" : "border-red-500"
            }`}
          >
            <img
              src={result.tattoo.image_url}
              alt="Tattoo"
              className="aspect-square w-full object-cover"
            />
            <div className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-green-400">
                  ${result.correctPrice.toLocaleString()}
                </span>
                {result.isCorrect ? (
                  <span className="text-green-400">&#10003;</span>
                ) : (
                  <span className="text-sm font-semibold text-red-400">
                    ${result.chosenPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Play Again */}
      <button
        onClick={onRestart}
        className="rounded-xl bg-gradient-to-r from-red-500 to-purple-500 px-10 py-4 text-xl font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
      >
        Play Again
      </button>
    </div>
  );
}
