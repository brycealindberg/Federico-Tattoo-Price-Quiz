"use client";

import { useState, useEffect, useCallback } from "react";
import { Tattoo, QuizQuestion, QuizResult } from "@/lib/types";
import { generateChoices } from "@/lib/generate-prices";
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

  // On mount: fetch total available tattoos
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
      const { choices, correctIndex } = generateChoices(tattoo.price);
      return { tattoo, choices, correctIndex };
    });

    setQuestions(quizQuestions);
    setCurrentIndex(0);
    setResults([]);
    setGameState("playing");
  }

  const handleAnswer = useCallback(
    (chosenPrice: number, isCorrect: boolean) => {
      const question = questions[currentIndex];
      const result: QuizResult = {
        tattoo: question.tattoo,
        correctPrice: question.tattoo.price,
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
    // Re-fetch total in case new tattoos were added
    fetch("/api/quiz?count=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.total) setTotalAvailable(data.total);
      })
      .catch(() => {});
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
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
