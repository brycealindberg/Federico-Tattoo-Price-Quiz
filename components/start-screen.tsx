"use client";

import { useState } from "react";

interface StartScreenProps {
  totalAvailable: number;
  onStart: (count: number) => void;
}

export default function StartScreen({
  totalAvailable,
  onStart,
}: StartScreenProps) {
  const [count, setCount] = useState(Math.min(5, totalAvailable));

  const max = Math.min(totalAvailable, 50);
  const disabled = totalAvailable === 0;

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center px-6 pb-16">
      <h1 className="mb-2 text-center text-4xl font-black tracking-tighter text-zinc-50 sm:text-5xl">
        Tattoo Price Quiz
      </h1>

      <p className="mb-10 text-sm font-medium text-zinc-500">
        {totalAvailable} tattoo{totalAvailable !== 1 ? "s" : ""} available
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <label className="text-xs font-medium uppercase tracking-wider text-zinc-600">
          Questions
        </label>
        <input
          type="number"
          min={1}
          max={max}
          value={count}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val)) setCount(Math.max(1, Math.min(val, max)));
          }}
          disabled={disabled}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-center text-xl font-bold text-zinc-50 shadow-inner outline-none transition-all focus:ring-2 focus:ring-amber-500/50 disabled:cursor-not-allowed disabled:text-zinc-700"
        />
        <button
          disabled={disabled}
          onClick={() => onStart(count)}
          className="rounded-2xl bg-amber-500 py-4 text-lg font-bold text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all hover:bg-amber-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Start
        </button>
      </div>
    </div>
  );
}
