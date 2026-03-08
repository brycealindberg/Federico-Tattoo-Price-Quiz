"use client";

import { useState, FormEvent } from "react";

interface PasswordGateProps {
  onAuth: () => void;
}

export default function PasswordGate({ onAuth }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
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
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8"
      >
        <h1 className="mb-2 text-center text-xl font-bold tracking-tight text-zinc-50">
          Admin Access
        </h1>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-50 placeholder-zinc-600 outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
          required
        />

        {error && (
          <p className="text-center text-sm font-medium text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-amber-500 py-3 font-bold text-zinc-950 transition-all hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Checking..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
