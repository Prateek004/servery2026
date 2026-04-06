# BillMate v17 — Production POS

## Quick Start (Local)

```bash
npm install
npm run dev
```
Open http://localhost:3000

---

## Deploy to Vercel (Step by Step)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "BillMate v17"
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

> ⚠️ Do NOT add `.env.local` to GitHub. It's already in `.gitignore`.

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Vercel auto-detects Next.js — no framework changes needed

### 3. Add Environment Variables in Vercel
In your Vercel project → **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `NEXT_PUBLIC_ANTHROPIC_API_KEY` | Your Anthropic key (OCR only) |

> ✅ The app works **without** Supabase — data stays in the browser (IndexedDB).  
> Only add Supabase keys if you want cloud sync.

### 4. Deploy
Click **Deploy**. Done. ✅

---

## Environment Variables Reference

Copy `.env.example` → `.env.local` for local dev:

```bash
cp .env.example .env.local
# Then edit .env.local with your actual keys
```

---

## Supabase Setup (Optional)

1. Create project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → run the contents of `supabase-schema.sql`
3. Copy your Project URL and anon key into Vercel env vars

---

## Features

| Feature | Status |
|---|---|
| POS Billing | ✅ |
| Cart (dedup, add-ons, portions) | ✅ |
| Checkout — Cash / UPI / Split | ✅ |
| Discount (flat ₹ or %) | ✅ |
| WhatsApp bill share | ✅ |
| KOT printing | ✅ |
| Receipt printing | ✅ |
| Table management | ✅ |
| Bar mode (ml / peg / bottle) | ✅ |
| Menu CRUD (categories, veg/non-veg) | ✅ |
| Add-ons & Portions | ✅ |
| Inventory — Raw Materials + Finished Goods | ✅ |
| OCR menu import (AI-powered) | ✅ |
| Dashboard / Stats | ✅ |
| Owner PIN & role (Owner / Cashier) | ✅ |
| Offline-first (Dexie IndexedDB) | ✅ |
| Supabase cloud sync | ✅ |

---

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Dexie** (IndexedDB offline storage)
- **Supabase** (optional cloud sync)
- **Zustand** (UI state)
