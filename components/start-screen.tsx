"use client";

interface StartScreenProps {
  totalAvailable: number;
  onStart: (count: number) => void;
}

const QUESTION_COUNTS = [5, 10, 15, 20];

export default function StartScreen({
  totalAvailable,
  onStart,
}: StartScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="mb-3 text-5xl font-extrabold tracking-tight sm:text-6xl">
        <span className="bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
          Tattoo Price Quiz
        </span>
      </h1>

      <p className="mb-10 text-lg text-zinc-400">
        Can you guess what these tattoos cost?
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {QUESTION_COUNTS.map((count) => {
          const disabled = count > totalAvailable;
          return (
            <button
              key={count}
              disabled={disabled}
              onClick={() => onStart(count)}
              className={`rounded-xl px-8 py-4 text-xl font-bold transition-all ${
                disabled
                  ? "cursor-not-allowed bg-zinc-800 text-zinc-600"
                  : "bg-gradient-to-r from-red-500 to-purple-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              }`}
            >
              {count}
            </button>
          );
        })}
      </div>

      <p className="mt-8 text-sm text-zinc-500">
        {totalAvailable} tattoo{totalAvailable !== 1 ? "s" : ""} available
      </p>
    </div>
  );
}
