# Tattoo Price Quiz — Design Doc

**Date:** 2026-03-04
**Stack:** Next.js 14 (App Router) + Supabase + Vercel + Tailwind CSS

## Overview

Quiz web app where users see tattoo photos and guess the price from 5 multiple-choice options. Admin dashboard lets Federico upload tattoos and set prices.

## Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/` | Public | Quiz — start screen, gameplay, results |
| `/admin` | Password-gated | Upload tattoos, set prices, manage library |

## Database (Supabase)

### Table: `tattoos`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Default `gen_random_uuid()` |
| `image_url` | text | Public URL from Supabase Storage |
| `price` | integer | Price in dollars (whole numbers) |
| `created_at` | timestamptz | Default `now()` |

### Storage

- Bucket: `tattoo-images` (public read, authenticated write)

## Quiz Flow

1. **Start screen** — Pick question count (5, 10, 15, 20), hit "Start Quiz"
2. **Question** — Show tattoo image + 5 price buttons (1 real, 4 generated)
3. **Correct** — Green flash on chosen answer, auto-advance after 1.5s
4. **Wrong** — Red on chosen, green on correct, "Next" button appears
5. **Results** — Score summary + review grid (each tattoo, your guess, correct price)

## Price Choice Generation

- Take real price, generate 4 fakes at ±20-60% spread
- Round to nearest $25 (under $500) or $50 (over $500)
- No duplicates, randomize position of correct answer
- Minimum price floor of $25

## Admin Dashboard

- **Password gate:** Single password via `ADMIN_PASSWORD` env var, stored in sessionStorage
- **Tattoo list:** Table with thumbnail, price, delete button
- **Upload form:** Image dropzone + price input
- **Upload flow:** Image → Supabase Storage → get public URL → insert row into `tattoos`

## Components

### Quiz (`/`)
- `StartScreen` — Title, count selector, start button
- `QuizCard` — Image display, 5 price buttons, feedback state
- `ResultsScreen` — Score, review grid with color-coded answers

### Admin (`/admin`)
- `PasswordGate` — Password input, sessionStorage persistence
- `TattooList` — All tattoos table with delete
- `UploadForm` — Drag-and-drop image + price field

## Styling

- Dark theme (fits tattoo aesthetic)
- Tailwind CSS, mobile-first
- Minimal and clean
