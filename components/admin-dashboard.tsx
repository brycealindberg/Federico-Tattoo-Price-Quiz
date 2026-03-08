"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { Tattoo } from "@/lib/types";
import { formatPriceRange } from "@/lib/generate-prices";

export default function AdminDashboard() {
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");

  async function fetchTattoos() {
    try {
      const res = await fetch("/api/admin/tattoos");
      const data = await res.json();
      if (data.tattoos) setTattoos(data.tattoos);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTattoos();
  }, []);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !priceMin || !priceMax) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("price_min", priceMin);
    formData.append("price_max", priceMax);
    formData.append("description", description);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setPriceMin("");
        setPriceMax("");
        setDescription("");
        setPreview(null);
        if (fileRef.current) fileRef.current.value = "";
        await fetchTattoos();
      }
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(tattoo: Tattoo) {
    if (!confirm(`Delete this tattoo (${formatPriceRange(tattoo.price_min, tattoo.price_max)})?`)) return;

    try {
      const res = await fetch("/api/admin/tattoos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tattoo.id, image_url: tattoo.image_url }),
      });

      if (res.ok) {
        await fetchTattoos();
      }
    } catch {
      // silent
    }
  }

  async function handleSaveDescription(id: string) {
    try {
      await fetch("/api/admin/tattoos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, description: editDesc }),
      });
      setEditingId(null);
      await fetchTattoos();
    } catch {
      // silent
    }
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 pb-20">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-zinc-50">
            Admin
          </h1>
          <span className="text-xs font-medium text-zinc-500">
            {tattoos.length} tattoo{tattoos.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4">
        {/* Upload form */}
        <form
          onSubmit={handleUpload}
          className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5"
        >
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Upload Tattoo
          </h2>

          <div className="flex flex-col gap-4 md:flex-row">
            {/* Dropzone */}
            <div className="md:w-48">
              <label
                htmlFor="file-input"
                className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900 transition-colors hover:border-amber-500/50 hover:text-amber-500"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="text-center text-zinc-600">
                    <p className="text-sm font-medium">Select image</p>
                    <p className="mt-1 text-xs">JPG, PNG, WebP</p>
                  </div>
                )}
                <input
                  id="file-input"
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Fields */}
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Min price ($)"
                  min="1"
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-50 placeholder-zinc-600 outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
                  required
                />
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Max price ($)"
                  min="1"
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-50 placeholder-zinc-600 outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why it costs this much (optional)"
                rows={3}
                className="resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-50 placeholder-zinc-600 outline-none transition-all focus:ring-2 focus:ring-amber-500/50"
              />
              <button
                type="submit"
                disabled={uploading || !preview || !priceMin || !priceMax}
                className="rounded-xl bg-amber-500 py-3 font-bold text-zinc-950 transition-all hover:bg-amber-400 active:scale-[0.98] disabled:opacity-40"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </form>

        {/* Tattoo grid */}
        <div className="mt-6">
          {loading ? (
            <p className="py-12 text-center text-sm text-zinc-600">Loading...</p>
          ) : tattoos.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-600">
              No tattoos yet. Upload one above.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {tattoos.map((tattoo) => (
                <div
                  key={tattoo.id}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
                >
                  <div className="relative aspect-square">
                    <img
                      src={tattoo.image_url}
                      alt="Tattoo"
                      className="h-full w-full object-cover"
                    />
                    {/* Delete overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleDelete(tattoo)}
                        className="rounded-full bg-red-500/15 px-4 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/25"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5">
                    <div className="text-center text-sm font-semibold text-zinc-200">
                      {formatPriceRange(tattoo.price_min, tattoo.price_max)}
                    </div>
                    {editingId === tattoo.id ? (
                      <div className="mt-2 flex flex-col gap-1.5">
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          rows={2}
                          className="resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-300 outline-none focus:ring-1 focus:ring-amber-500/50"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleSaveDescription(tattoo.id)}
                            className="flex-1 rounded-lg bg-emerald-500/15 py-1 text-xs font-bold text-emerald-400"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 rounded-lg bg-zinc-800 py-1 text-xs font-bold text-zinc-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(tattoo.id);
                          setEditDesc(tattoo.description || "");
                        }}
                        className="mt-1 w-full text-[10px] text-zinc-600 transition-colors hover:text-amber-500"
                      >
                        {tattoo.description ? "Edit description" : "+ Add description"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
