# Tattoo Price Quiz — Setup Guide

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish provisioning

### Database

3. Go to **SQL Editor** in the left sidebar
4. Paste and run this SQL:

```sql
CREATE TABLE tattoos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  price integer NOT NULL CHECK (price > 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tattoos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON tattoos
  FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON tattoos
  FOR ALL USING (auth.role() = 'service_role');
```

### Storage

5. Go to **Storage** in the left sidebar
6. Click **New bucket**
7. Name it `tattoo-images`
8. Toggle **Public bucket** ON
9. Click **Create bucket**

### Get Your Keys

10. Go to **Settings > API**
11. Copy these three values:
    - **Project URL** (starts with `https://xxx.supabase.co`)
    - **anon public** key
    - **service_role** key (click to reveal)

## 2. Local Environment

12. Open `.env.local` in the project root and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
ADMIN_PASSWORD=federico2026
```

## 3. Run Locally

```bash
npm install
npm run dev
```

- Quiz: http://localhost:3000
- Admin: http://localhost:3000/admin (password: `federico2026`)

## 4. Deploy to Vercel

```bash
# Push to GitHub
gh repo create Federico-Tattoo-Price-Quiz --public --source=. --push

# Deploy
npx vercel --yes

# Set env vars (it will prompt for each value)
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
npx vercel env add ADMIN_PASSWORD

# Deploy to production with env vars
npx vercel --prod
```

## Usage

### Admin Dashboard (`/admin`)

1. Enter the admin password
2. Upload tattoo photos and set the price for each
3. Delete tattoos you don't want anymore

### Quiz (`/`)

1. Pick how many questions (5, 10, 15, or 20)
2. For each tattoo, pick the price you think is correct
3. See your score and review all answers at the end
