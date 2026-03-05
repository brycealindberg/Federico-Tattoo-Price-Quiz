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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {authed ? (
        <AdminDashboard />
      ) : (
        <PasswordGate onAuth={() => setAuthed(true)} />
      )}
    </main>
  );
}
