"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { Tattoo } from "@/lib/types";

export default function AdminDashboard() {
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [price, setPrice] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (!file || !price) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("price", price);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setPrice("");
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
    if (!confirm(`Delete this tattoo ($${tattoo.price})?`)) return;

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">
        Admin Dashboard
        <span className="ml-3 text-lg font-normal text-zinc-400">
          {tattoos.length} tattoo{tattoos.length !== 1 ? "s" : ""}
        </span>
      </h1>

      {/* Upload form */}
      <form
        onSubmit={handleUpload}
        className="mb-10 rounded-2xl bg-zinc-900 p-6"
      >
        <h2 className="mb-4 text-xl font-semibold">Upload Tattoo</h2>

        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Dropzone / file picker */}
          <div className="flex-1">
            <label
              htmlFor="file-input"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 p-8 transition-colors hover:border-purple-500"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 rounded-lg object-contain"
                />
              ) : (
                <div className="text-center text-zinc-500">
                  <p className="text-lg font-medium">Click to select image</p>
                  <p className="text-sm">JPG, PNG, WebP</p>
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

          {/* Price + submit */}
          <div className="flex flex-col gap-3 sm:w-48">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price ($)"
              min="1"
              className="rounded-xl bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <button
              type="submit"
              disabled={uploading || !preview || !price}
              className="rounded-xl bg-gradient-to-r from-red-500 to-purple-500 py-3 font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </form>

      {/* Tattoo grid */}
      {loading ? (
        <p className="text-center text-zinc-500">Loading...</p>
      ) : tattoos.length === 0 ? (
        <p className="text-center text-zinc-500">
          No tattoos yet. Upload one above!
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {tattoos.map((tattoo) => (
            <div
              key={tattoo.id}
              className="group relative overflow-hidden rounded-xl bg-zinc-900"
            >
              <img
                src={tattoo.image_url}
                alt="Tattoo"
                className="aspect-square w-full object-cover"
              />
              <div className="p-2 text-center font-semibold">
                ${tattoo.price.toLocaleString()}
              </div>

              {/* Delete button - visible on hover */}
              <button
                onClick={() => handleDelete(tattoo)}
                className="absolute right-2 top-2 rounded-lg bg-red-600 px-3 py-1 text-sm font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
