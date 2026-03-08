# Tattoo Price Description Feature

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show a description explaining why a tattoo costs what it does when the user answers incorrectly.

**Architecture:** Add an optional `description` text column to the `tattoos` table. Admin sets it during upload or edits it on existing tattoos. Quiz card and results screen display it on wrong answers.

**Tech Stack:** Supabase (migration), Next.js API routes, React components, TypeScript

---

### Task 1: Add `description` column to database

**Files:**
- Modify: Supabase database via MCP migration

**Step 1: Apply migration**

Use the Supabase MCP tool `apply_migration` with:
- name: `add_description_to_tattoos`
- query:
```sql
ALTER TABLE tattoos ADD COLUMN description text DEFAULT '';
```

**Step 2: Verify**

Use `list_tables` with `verbose: true` to confirm the column exists.

---

### Task 2: Update TypeScript types

**Files:**
- Modify: `lib/types.ts`

**Step 1: Add `description` to the `Tattoo` interface**

```typescript
export interface Tattoo {
  id: string;
  image_url: string;
  price: number;
  description: string;
  created_at: string;
}
```

No other interfaces need changes — `QuizQuestion` and `QuizResult` reference `Tattoo` so they inherit it automatically.

---

### Task 3: Update upload API to accept description

**Files:**
- Modify: `app/api/admin/upload/route.ts`

**Step 1: Parse `description` from FormData and include it in the insert**

In the `POST` handler, after line 7 (`const price = ...`), add:
```typescript
const description = (formData.get("description") as string) || "";
```

In the `.insert()` call (line 36), change:
```typescript
.insert({ image_url: urlData.publicUrl, price })
```
to:
```typescript
.insert({ image_url: urlData.publicUrl, price, description })
```

---

### Task 4: Add PATCH route for editing existing tattoo descriptions

**Files:**
- Modify: `app/api/admin/tattoos/route.ts`

**Step 1: Add a PATCH handler after the existing DELETE handler**

```typescript
export async function PATCH(request: NextRequest) {
  const { id, description } = await request.json();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("tattoos")
    .update({ description })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

---

### Task 5: Update admin upload form to include description field

**Files:**
- Modify: `components/admin-dashboard.tsx`

**Step 1: Add description state**

After the `price` state (line 10), add:
```typescript
const [description, setDescription] = useState("");
```

**Step 2: Add description textarea to the upload form**

In the "Price + submit" `<div>` (after the price input, before the submit button), add:
```tsx
<textarea
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  placeholder="Why it costs this much (optional)"
  rows={3}
  className="rounded-xl bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-purple-500"
/>
```

**Step 3: Send description in FormData**

In `handleUpload`, after `formData.append("price", price)`, add:
```typescript
formData.append("description", description);
```

**Step 4: Clear description on successful upload**

In the success block, after `setPrice("")`, add:
```typescript
setDescription("");
```

---

### Task 6: Add inline description editing to admin tattoo grid

**Files:**
- Modify: `components/admin-dashboard.tsx`

**Step 1: Add editing state**

After the existing state declarations, add:
```typescript
const [editingId, setEditingId] = useState<string | null>(null);
const [editDesc, setEditDesc] = useState("");
```

**Step 2: Add save handler**

```typescript
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
```

**Step 3: Update the tattoo card in the grid**

Replace the card's `<div className="p-2 text-center font-semibold">` section with:
```tsx
<div className="p-2">
  <div className="text-center font-semibold">
    ${tattoo.price.toLocaleString()}
  </div>
  {editingId === tattoo.id ? (
    <div className="mt-2 flex flex-col gap-1">
      <textarea
        value={editDesc}
        onChange={(e) => setEditDesc(e.target.value)}
        rows={2}
        className="rounded-lg bg-zinc-800 px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-purple-500"
      />
      <div className="flex gap-1">
        <button
          onClick={() => handleSaveDescription(tattoo.id)}
          className="flex-1 rounded-lg bg-green-600 px-2 py-1 text-xs font-bold text-white"
        >
          Save
        </button>
        <button
          onClick={() => setEditingId(null)}
          className="flex-1 rounded-lg bg-zinc-700 px-2 py-1 text-xs font-bold text-white"
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
      className="mt-1 w-full text-xs text-zinc-500 hover:text-purple-400"
    >
      {tattoo.description ? "Edit description" : "+ Add description"}
    </button>
  )}
</div>
```

---

### Task 7: Show description on wrong answer in quiz card

**Files:**
- Modify: `components/quiz-card.tsx`

**Step 1: Show description between the answer reveal and the Next button**

In the `{revealed && ...}` section, update the wrong-answer branch. Replace:
```tsx
) : (
  <button
    onClick={handleNext}
    className="mt-2 rounded-xl bg-gradient-to-r from-red-500 to-purple-500 px-8 py-3 font-bold text-white transition-all hover:scale-105"
  >
    Next &rarr;
  </button>
)}
```

With:
```tsx
) : (
  <>
    {question.tattoo.description && (
      <p className="mt-2 max-w-md text-sm text-zinc-400 italic">
        {question.tattoo.description}
      </p>
    )}
    <button
      onClick={handleNext}
      className="mt-3 rounded-xl bg-gradient-to-r from-red-500 to-purple-500 px-8 py-3 font-bold text-white transition-all hover:scale-105"
    >
      Next &rarr;
    </button>
  </>
)}
```

---

### Task 8: Show description on wrong answers in results screen

**Files:**
- Modify: `components/results-screen.tsx`

**Step 1: Add description below the price comparison for wrong answers**

In the result card's `<div className="p-3">`, after the price/checkmark row, add:
```tsx
{!result.isCorrect && result.tattoo.description && (
  <p className="mt-1 text-xs text-zinc-400 italic">
    {result.tattoo.description}
  </p>
)}
```

---

### Task 9: Commit

```bash
git add lib/types.ts app/api/admin/upload/route.ts app/api/admin/tattoos/route.ts components/admin-dashboard.tsx components/quiz-card.tsx components/results-screen.tsx
git commit -m "feat: add tattoo price description shown on wrong answers"
```
