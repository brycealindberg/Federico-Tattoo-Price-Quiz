"use client";

import { useState, useEffect, useCallback } from "react";
import { Tattoo, QuizQuestion, QuizResult } from "@/lib/types";
import { generateChoices } from "@/lib/generate-prices";
import Link from "next/link";
import StartScreen from "@/components/start-screen";
import QuizCard from "@/components/quiz-card";
import ResultsScreen from "@/components/results-screen";

type GameState = "start" | "playing" | "results";

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);

  useEffect(() => {
    fetch("/api/quiz?count=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.total) setTotalAvailable(data.total);
      })
      .catch(() => setTotalAvailable(0));
  }, []);

  async function startQuiz(count: number) {
    const res = await fetch(`/api/quiz?count=${count}`);
    const data = await res.json();

    if (!data.tattoos || data.tattoos.length === 0) return;

    const quizQuestions: QuizQuestion[] = data.tattoos.map((tattoo: Tattoo) => {
      const { choices, correctIndex } = generateChoices(tattoo.price_min, tattoo.price_max);
      return { tattoo, choices, correctIndex };
    });

    setQuestions(quizQuestions);
    setCurrentIndex(0);
    setResults([]);
    setGameState("playing");
  }

  const handleAnswer = useCallback(
    (chosenPrice: [number, number], isCorrect: boolean) => {
      const question = questions[currentIndex];
      const result: QuizResult = {
        tattoo: question.tattoo,
        correctPrice: [question.tattoo.price_min, question.tattoo.price_max],
        chosenPrice,
        isCorrect,
      };

      const newResults = [...results, result];
      setResults(newResults);

      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setGameState("results");
      }
    },
    [questions, currentIndex, results]
  );

  function handleRestart() {
    setGameState("start");
    setQuestions([]);
    setCurrentIndex(0);
    setResults([]);
    fetch("/api/quiz?count=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.total) setTotalAvailable(data.total);
      })
      .catch(() => {});
  }

  return (
    <main className="relative bg-zinc-950 text-zinc-50">
      <Link
        href="/admin"
        className="fixed right-3 top-3 z-50 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-500 backdrop-blur-sm transition-colors hover:border-zinc-700 hover:text-zinc-300"
      >
        Admin
      </Link>

      {gameState === "start" && (
        <StartScreen totalAvailable={totalAvailable} onStart={startQuiz} />
      )}

      {gameState === "playing" && questions[currentIndex] && (
        <QuizCard
          key={currentIndex}
          question={questions[currentIndex]}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
        />
      )}

      {gameState === "results" && (
        <ResultsScreen results={results} onRestart={handleRestart} />
      )}
    </main>
  );
}
