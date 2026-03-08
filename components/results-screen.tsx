"use client";

import { QuizResult } from "@/lib/types";
import { formatPriceRange } from "@/lib/generate-prices";

interface ResultsScreenProps {
  results: QuizResult[];
  onRestart: () => void;
}

function getMessage(percentage: number): string {
  if (percentage >= 80) return "You really know your ink.";
  if (percentage >= 50) return "Decent eye for pricing.";
  return "Pricing is tricky. Try again.";
}

export default function ResultsScreen({
  results,
  onRestart,
}: ResultsScreenProps) {
  const correct = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const percentage = total > 0 ? (correct / total) * 100 : 0;

  return (
    <div className="flex h-[100dvh] w-full flex-col">
      {/* Sticky header */}
      <div className="shrink-0 border-b border-zinc-800/50 bg-zinc-950/95 px-4 pb-5 pt-10 text-center backdrop-blur-sm">
        <div className="mb-1 text-5xl font-black tracking-tighter text-amber-500">
          {correct}/{total}
        </div>
        <p className="mb-4 text-sm font-medium text-zinc-500">{getMessage(percentage)}</p>
        <button
          onClick={onRestart}
          className="rounded-full bg-zinc-100 px-8 py-2.5 text-sm font-bold text-zinc-950 transition-all active:scale-[0.97]"
        >
          Play Again
        </button>
      </div>

      {/* Scrollable results grid */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          {results.map((result, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
            >
              <div className="relative aspect-square">
                <img
                  src={result.tattoo.image_url}
                  alt="Tattoo"
                  className="h-full w-full object-cover"
                />
                <span
                  className={`absolute right-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    result.isCorrect
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {result.isCorrect ? "Correct" : "Wrong"}
                </span>
              </div>
              <div className="p-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400">
                    {formatPriceRange(result.correctPrice[0], result.correctPrice[1])}
                  </span>
                  {!result.isCorrect && (
                    <span className="font-semibold text-red-400 line-through">
                      {formatPriceRange(result.chosenPrice[0], result.chosenPrice[1])}
                    </span>
                  )}
                </div>
                {!result.isCorrect && result.tattoo.description && (
                  <p className="mt-1 text-[10px] leading-snug text-zinc-500">
                    {result.tattoo.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
