# Tattoo Price Quiz — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a tattoo price guessing quiz with admin dashboard, deployed on Vercel with Supabase backend.

**Architecture:** Next.js 14 App Router with server actions for Supabase mutations. Public quiz route fetches random tattoos and generates fake price choices client-side. Admin route is password-gated via env var, uses Supabase Storage for image uploads and `tattoos` table for metadata.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (Postgres + Storage), Vercel

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.js`, `.env.local`, `.gitignore`

**Step 1: Initialize Next.js with Tailwind**

```bash
cd /Users/user/Desktop/Federico-Tattoo-Price-Quiz
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Accept defaults. This creates the full Next.js scaffold.

**Step 2: Install Supabase client**

```bash
cd /Users/user/Desktop/Federico-Tattoo-Price-Quiz
npm install @supabase/supabase-js
```

**Step 3: Create `.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
ADMIN_PASSWORD=federico2026
```

**Step 4: Create Supabase client utility**

Create `lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role for admin operations
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

**Step 5: Init git and commit**

```bash
cd /Users/user/Desktop/Federico-Tattoo-Price-Quiz
git init
git add -A
git commit -m "feat: scaffold Next.js project with Supabase client"
```

---

### Task 2: Supabase Database & Storage Setup

**Files:**
- Create: `lib/database.sql`

**Step 1: Write SQL migration file for reference**

Create `lib/database.sql`:

```sql
-- Run this in Supabase SQL Editor

-- Tattoos table
CREATE TABLE tattoos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  price integer NOT NULL CHECK (price > 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tattoos ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can fetch tattoos for the quiz)
CREATE POLICY "Public read access" ON tattoos
  FOR SELECT USING (true);

-- Service role can insert/delete (admin operations go through API routes with service key)
CREATE POLICY "Service role full access" ON tattoos
  FOR ALL USING (auth.role() = 'service_role');

-- Storage bucket (run via Supabase dashboard or API):
-- Create bucket "tattoo-images" with public access enabled
```

**Step 2: Run SQL in Supabase dashboard**

Go to Supabase SQL Editor and run the migration. Then create the `tattoo-images` storage bucket with public access in Storage settings.

**Step 3: Commit**

```bash
git add lib/database.sql
git commit -m "feat: add database schema and storage setup SQL"
```

---

### Task 3: Type Definitions & Price Generation Utility

**Files:**
- Create: `lib/types.ts`
- Create: `lib/generate-prices.ts`

**Step 1: Define types**

Create `lib/types.ts`:

```typescript
export interface Tattoo {
  id: string;
  image_url: string;
  price: number;
  created_at: string;
}

export interface QuizQuestion {
  tattoo: Tattoo;
  choices: number[];
  correctIndex: number;
}

export interface QuizResult {
  tattoo: Tattoo;
  correctPrice: number;
  chosenPrice: number;
  isCorrect: boolean;
}
```

**Step 2: Build price generation logic**

Create `lib/generate-prices.ts`:

```typescript
function roundPrice(price: number): number {
  if (price < 25) return 25;
  if (price < 500) return Math.round(price / 25) * 25;
  return Math.round(price / 50) * 50;
}

export function generateChoices(realPrice: number): {
  choices: number[];
  correctIndex: number;
} {
  const fakes = new Set<number>();

  // Generate 4 unique fake prices
  while (fakes.size < 4) {
    // Random multiplier between 0.4 and 1.6 (±60%), excluding 0.8-1.2 range
    let multiplier: number;
    do {
      multiplier = 0.4 + Math.random() * 1.2;
    } while (multiplier > 0.85 && multiplier < 1.15);

    const fake = roundPrice(Math.round(realPrice * multiplier));
    if (fake !== realPrice && fake > 0) {
      fakes.add(fake);
    }
  }

  // Combine and shuffle
  const allChoices = [realPrice, ...Array.from(fakes)];
  for (let i = allChoices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
  }

  return {
    choices: allChoices,
    correctIndex: allChoices.indexOf(realPrice),
  };
}
```

**Step 3: Commit**

```bash
git add lib/types.ts lib/generate-prices.ts
git commit -m "feat: add type definitions and price choice generation"
```

---

### Task 4: Quiz API Route — Fetch Random Tattoos

**Files:**
- Create: `app/api/quiz/route.ts`

**Step 1: Create the quiz API endpoint**

Create `app/api/quiz/route.ts`:

```typescript
import { createServiceClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const count = parseInt(searchParams.get("count") || "10", 10);

  // Clamp between 1 and 50
  const safeCount = Math.min(Math.max(count, 1), 50);

  const supabase = createServiceClient();

  // Fetch random tattoos using Postgres random ordering
  const { data, error } = await supabase
    .from("tattoos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "No tattoos found" }, { status: 404 });
  }

  // Shuffle and take requested count
  const shuffled = data.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(safeCount, shuffled.length));

  return NextResponse.json({ tattoos: selected, total: data.length });
}
```

**Step 2: Commit**

```bash
git add app/api/quiz/route.ts
git commit -m "feat: add quiz API route for fetching random tattoos"
```

---

### Task 5: Admin API Routes — Auth, Upload, Delete

**Files:**
- Create: `app/api/admin/auth/route.ts`
- Create: `app/api/admin/tattoos/route.ts`
- Create: `app/api/admin/upload/route.ts`

**Step 1: Admin auth endpoint**

Create `app/api/admin/auth/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
```

**Step 2: Tattoo list + delete endpoint**

Create `app/api/admin/tattoos/route.ts`:

```typescript
import { createServiceClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tattoos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tattoos: data });
}

export async function DELETE(request: NextRequest) {
  const { id, image_url } = await request.json();
  const supabase = createServiceClient();

  // Delete from storage
  if (image_url) {
    const path = image_url.split("/tattoo-images/")[1];
    if (path) {
      await supabase.storage.from("tattoo-images").remove([path]);
    }
  }

  // Delete from database
  const { error } = await supabase.from("tattoos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 3: Image upload endpoint**

Create `app/api/admin/upload/route.ts`:

```typescript
import { createServiceClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("image") as File;
  const price = parseInt(formData.get("price") as string, 10);

  if (!file || !price || price <= 0) {
    return NextResponse.json({ error: "Image and valid price required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Upload image to storage
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const { error: uploadError } = await supabase.storage
    .from("tattoo-images")
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("tattoo-images")
    .getPublicUrl(fileName);

  // Insert into database
  const { data, error: dbError } = await supabase
    .from("tattoos")
    .insert({ image_url: urlData.publicUrl, price })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ tattoo: data });
}
```

**Step 4: Commit**

```bash
git add app/api/admin/
git commit -m "feat: add admin API routes (auth, upload, delete)"
```

---

### Task 6: Quiz Page — Start Screen, Game, Results

**Files:**
- Create: `app/page.tsx` (replace default)
- Create: `components/start-screen.tsx`
- Create: `components/quiz-card.tsx`
- Create: `components/results-screen.tsx`

**Step 1: Create StartScreen component**

Create `components/start-screen.tsx`:

```typescript
"use client";

interface StartScreenProps {
  totalAvailable: number;
  onStart: (count: number) => void;
}

const COUNTS = [5, 10, 15, 20];

export default function StartScreen({ totalAvailable, onStart }: StartScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
        Tattoo Price Quiz
      </h1>
      <p className="text-zinc-400 mb-10 text-lg">
        Can you guess what these tattoos cost?
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {COUNTS.map((count) => (
          <button
            key={count}
            disabled={count > totalAvailable}
            onClick={() => onStart(count)}
            className="w-full py-4 rounded-xl text-lg font-semibold transition-all
              bg-zinc-800 hover:bg-zinc-700 active:scale-95
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {count} Questions
          </button>
        ))}
      </div>

      {totalAvailable > 0 && (
        <p className="text-zinc-500 mt-6 text-sm">
          {totalAvailable} tattoo{totalAvailable !== 1 ? "s" : ""} in the database
        </p>
      )}
      {totalAvailable === 0 && (
        <p className="text-zinc-500 mt-6 text-sm">
          No tattoos uploaded yet. Ask the admin to add some!
        </p>
      )}
    </div>
  );
}
```

**Step 2: Create QuizCard component**

Create `components/quiz-card.tsx`:

```typescript
"use client";

import { useState } from "react";
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
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (choiceIndex: number) => {
    if (revealed) return;
    setSelected(choiceIndex);
    setRevealed(true);

    const isCorrect = choiceIndex === question.correctIndex;
    const chosenPrice = question.choices[choiceIndex];

    if (isCorrect) {
      // Auto-advance after 1.5s on correct answer
      setTimeout(() => {
        onAnswer(chosenPrice, true);
      }, 1500);
    }
  };

  const handleNext = () => {
    if (selected === null) return;
    onAnswer(question.choices[selected], false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8">
      {/* Progress */}
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between text-sm text-zinc-400 mb-2">
          <span>Question {questionNumber}/{totalQuestions}</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-red-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Tattoo Image */}
      <div className="w-full max-w-md aspect-square rounded-2xl overflow-hidden mb-6 bg-zinc-800">
        <img
          src={question.tattoo.image_url}
          alt="Tattoo"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Price Choices */}
      <div className="w-full max-w-md flex flex-col gap-3">
        <p className="text-center text-zinc-400 mb-1">How much did this tattoo cost?</p>
        {question.choices.map((price, index) => {
          let btnClass = "bg-zinc-800 hover:bg-zinc-700";

          if (revealed) {
            if (index === question.correctIndex) {
              btnClass = "bg-green-600 text-white";
            } else if (index === selected) {
              btnClass = "bg-red-600 text-white";
            } else {
              btnClass = "bg-zinc-800 opacity-40";
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={revealed}
              className={`w-full py-3.5 rounded-xl text-lg font-semibold transition-all active:scale-95 ${btnClass}`}
            >
              ${price.toLocaleString()}
            </button>
          );
        })}
      </div>

      {/* Next button (only on wrong answer) */}
      {revealed && selected !== question.correctIndex && (
        <button
          onClick={handleNext}
          className="mt-6 px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold transition-all active:scale-95"
        >
          Next →
        </button>
      )}

      {/* Correct feedback */}
      {revealed && selected === question.correctIndex && (
        <p className="mt-6 text-green-400 font-semibold text-lg animate-pulse">
          Correct! ✓
        </p>
      )}
    </div>
  );
}
```

**Step 3: Create ResultsScreen component**

Create `components/results-screen.tsx`:

```typescript
"use client";

import { QuizResult } from "@/lib/types";

interface ResultsScreenProps {
  results: QuizResult[];
  onRestart: () => void;
}

export default function ResultsScreen({ results, onRestart }: ResultsScreenProps) {
  const correct = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const percentage = Math.round((correct / total) * 100);

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8">
      {/* Score */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-2">
          {correct}/{total}
        </h2>
        <p className="text-zinc-400 text-lg">
          {percentage >= 80
            ? "You really know your tattoo prices!"
            : percentage >= 50
            ? "Not bad! You've got a decent eye."
            : "Tattoo pricing is tricky!"}
        </p>
      </div>

      {/* Review Grid */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {results.map((result, index) => (
          <div
            key={index}
            className={`rounded-xl overflow-hidden border-2 ${
              result.isCorrect ? "border-green-600" : "border-red-600"
            }`}
          >
            <div className="aspect-square bg-zinc-800">
              <img
                src={result.tattoo.image_url}
                alt="Tattoo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3 bg-zinc-900">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-zinc-500">Correct price</p>
                  <p className="font-bold text-green-400">
                    ${result.correctPrice.toLocaleString()}
                  </p>
                </div>
                {!result.isCorrect && (
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Your guess</p>
                    <p className="font-bold text-red-400">
                      ${result.chosenPrice.toLocaleString()}
                    </p>
                  </div>
                )}
                {result.isCorrect && (
                  <span className="text-green-400 text-xl">✓</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Play Again */}
      <button
        onClick={onRestart}
        className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold transition-all active:scale-95"
      >
        Play Again
      </button>
    </div>
  );
}
```

**Step 4: Wire up the main quiz page**

Replace `app/page.tsx`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import StartScreen from "@/components/start-screen";
import QuizCard from "@/components/quiz-card";
import ResultsScreen from "@/components/results-screen";
import { Tattoo, QuizQuestion, QuizResult } from "@/lib/types";
import { generateChoices } from "@/lib/generate-prices";

type GameState = "start" | "playing" | "results";

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);

  // Fetch total count on mount
  useEffect(() => {
    fetch("/api/quiz?count=1")
      .then((res) => res.json())
      .then((data) => setTotalAvailable(data.total || 0))
      .catch(() => setTotalAvailable(0));
  }, []);

  const startQuiz = useCallback(async (count: number) => {
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
  }, []);

  const handleAnswer = useCallback(
    (chosenPrice: number, isCorrect: boolean) => {
      const current = questions[currentIndex];
      setResults((prev) => [
        ...prev,
        {
          tattoo: current.tattoo,
          correctPrice: current.tattoo.price,
          chosenPrice,
          isCorrect,
        },
      ]);

      if (currentIndex + 1 >= questions.length) {
        setGameState("results");
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentIndex, questions]
  );

  const handleRestart = () => {
    setGameState("start");
    setQuestions([]);
    setResults([]);
    setCurrentIndex(0);
  };

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
```

**Step 5: Commit**

```bash
git add app/page.tsx components/
git commit -m "feat: add quiz UI — start screen, quiz card, results screen"
```

---

### Task 7: Admin Page — Password Gate + Dashboard

**Files:**
- Create: `app/admin/page.tsx`
- Create: `components/password-gate.tsx`
- Create: `components/admin-dashboard.tsx`

**Step 1: Create PasswordGate component**

Create `components/password-gate.tsx`:

```typescript
"use client";

import { useState } from "react";

interface PasswordGateProps {
  onAuth: () => void;
}

export default function PasswordGate({ onAuth }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      sessionStorage.setItem("admin_auth", "true");
      onAuth();
    } else {
      setError("Wrong password");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Access</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-purple-500 focus:outline-none mb-3"
        />
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold transition-all disabled:opacity-50"
        >
          {loading ? "Checking..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
```

**Step 2: Create AdminDashboard component**

Create `components/admin-dashboard.tsx`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { Tattoo } from "@/lib/types";

export default function AdminDashboard() {
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const fetchTattoos = useCallback(async () => {
    const res = await fetch("/api/admin/tattoos");
    const data = await res.json();
    setTattoos(data.tattoos || []);
  }, []);

  useEffect(() => {
    fetchTattoos();
  }, [fetchTattoos]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !price) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("price", price);

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setFile(null);
      setPreview(null);
      setPrice("");
      fetchTattoos();
    }
    setUploading(false);
  };

  const handleDelete = async (tattoo: Tattoo) => {
    if (!confirm("Delete this tattoo?")) return;

    await fetch("/api/admin/tattoos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tattoo.id, image_url: tattoo.image_url }),
    });

    fetchTattoos();
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="mb-10 p-6 bg-zinc-900 rounded-2xl">
        <h2 className="text-xl font-semibold mb-4">Upload Tattoo</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block w-full cursor-pointer">
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                preview ? "border-purple-500" : "border-zinc-700 hover:border-zinc-500"
              }`}>
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                ) : (
                  <p className="text-zinc-400">Click to select image</p>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex flex-col gap-3 sm:w-48">
            <input
              type="number"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price ($)"
              className="px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-purple-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!file || !price || uploading}
              className="py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold transition-all disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </form>

      {/* Tattoo List */}
      <h2 className="text-xl font-semibold mb-4">
        Tattoos ({tattoos.length})
      </h2>
      {tattoos.length === 0 ? (
        <p className="text-zinc-500">No tattoos uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tattoos.map((tattoo) => (
            <div key={tattoo.id} className="bg-zinc-900 rounded-xl overflow-hidden group">
              <div className="aspect-square">
                <img
                  src={tattoo.image_url}
                  alt="Tattoo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="font-bold">${tattoo.price.toLocaleString()}</span>
                <button
                  onClick={() => handleDelete(tattoo)}
                  className="text-red-400 hover:text-red-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Wire up admin page**

Create `app/admin/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import PasswordGate from "@/components/password-gate";
import AdminDashboard from "@/components/admin-dashboard";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") {
      setAuthed(true);
    }
  }, []);

  if (!authed) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <PasswordGate onAuth={() => setAuthed(true)} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <AdminDashboard />
    </main>
  );
}
```

**Step 4: Commit**

```bash
git add app/admin/ components/password-gate.tsx components/admin-dashboard.tsx
git commit -m "feat: add admin page with password gate and dashboard"
```

---

### Task 8: Global Styles & Layout Cleanup

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

**Step 1: Update layout.tsx**

Replace `app/layout.tsx` metadata and body styling:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tattoo Price Quiz",
  description: "Can you guess what these tattoos cost?",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**Step 2: Slim down globals.css**

Replace `app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}
```

**Step 3: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: clean up layout and global styles"
```

---

### Task 9: Deploy to Vercel

**Step 1: Push to GitHub**

```bash
cd /Users/user/Desktop/Federico-Tattoo-Price-Quiz
gh repo create Federico-Tattoo-Price-Quiz --public --source=. --push
```

**Step 2: Deploy via Vercel CLI**

```bash
npx vercel --yes
```

**Step 3: Set environment variables on Vercel**

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
npx vercel env add ADMIN_PASSWORD
```

**Step 4: Redeploy with env vars**

```bash
npx vercel --prod
```

**Step 5: Commit any Vercel config files**

```bash
git add -A
git commit -m "chore: add Vercel deployment config"
```

---
