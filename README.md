# Marketplace

**Live demo:** https://test3-marketplace-edna.vercel.app

A Facebook Marketplace–inspired web app where anyone can list an item for sale with a photo, browse and search listings by category, open a listing's own page, and message the seller. No account is needed. Listings, photos, and messages are stored in Supabase.

## Features

- **Create a listing** (`/create`): photo upload with preview, title, description, price, seller email, and category. Validation runs in the browser and again on the server. Large phone photos are resized in the browser before upload.
- **Browse and filter** (`/`): a responsive grid of real listings from Supabase, category chips, and keyword search over titles and descriptions. Includes loading skeletons and empty, no-results, and error states.
- **Listing detail** (`/item/[id]`): a large photo, price, category, date posted, description, and seller email. Bad IDs and missing listings show a not-found page.
- **Message seller**: a modal that saves the buyer's email and message to Supabase, linked to the listing and its seller.

## Tech stack

- Next.js 16 (App Router, Cache Components), React 19, TypeScript
- Tailwind CSS 4 and Lucide icons
- Supabase PostgreSQL, Supabase Storage, and `@supabase/supabase-js`
- Deployed on Vercel

## Project structure

```
src/
├── app/
│   ├── api/listings/route.ts        GET list (category, q), POST create (multipart)
│   ├── api/listings/[id]/route.ts   GET one listing
│   ├── api/messages/route.ts        POST message to seller
│   ├── create/page.tsx              Create listing page
│   ├── item/[id]/                   Detail page + not-found + error boundary
│   └── page.tsx                     Homepage (browse, filter, search)
├── components/{layout,marketplace,ui}/
├── lib/
│   ├── supabase.ts         anon-key client (RLS applies)
│   ├── supabase-server.ts  service-role client (server-only, Storage uploads)
│   ├── listings.ts         database queries
│   ├── validations.ts      shared validation rules
│   └── images.ts, rate-limit.ts, env.ts, utils.ts, categories.ts
└── types/marketplace.ts
supabase-schema.sql         tables, indexes, RLS, bucket, storage policies
```

## Security model

- **Row Level Security** is on for both tables. The public can read listings and insert listings and messages. Messages can't be read publicly because they contain buyer emails. Nobody can update or delete through the public API.
- **CHECK constraints** in Postgres repeat the validation rules (lengths, price range, allowed categories, email format, image URL inside the bucket). They apply no matter which client writes to the database.
- **A trigger** copies `seller_email` from the listing onto each message, so a client can't point a message at a different email address.
- **Storage**: the `listing-images` bucket is publicly readable. Only the server, using the service role key, can upload, and only after it checks the file's real type (magic bytes) and its size (4 MB max). The bucket also enforces the same type and size limits.
- **The service role key** is read only in `src/lib/supabase-server.ts`, which imports `server-only`, so it never reaches the browser.
- **Abuse protection**: a per-IP rate limit (5 listings or 10 messages per 10 minutes for each server instance) and a hidden honeypot field.

## Setup

### 1. Install

```bash
npm install
```

### 2. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the whole of [`supabase-schema.sql`](./supabase-schema.sql), and click **Run**. This creates:
   - the `listings` and `messages` tables, with indexes, constraints, and the seller-email trigger
   - the RLS policies
   - the public `listing-images` Storage bucket (4 MB limit; JPEG, PNG, and WebP only) and its read policy

   The script is idempotent, so running it again is safe.

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in the values from **Project Settings → API Keys** in the Supabase dashboard:

| Variable | Where it's used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, e.g. `https://abcd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key (public; RLS protects the data) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role / secret key. **Server only, never commit it.** |

If any variable is missing, the app shows a clear "not configured" message instead of failing silently.

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

### Checks

```bash
npm run lint
```

```bash
npm run build
```

## Deploying to Vercel

1. Push the repository to GitHub, then on vercel.com choose **Add New → Project** and import it. Alternatively, run `npx vercel` from this folder.
2. In **Settings → Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for Production (and Preview if you use it).
3. Deploy. If you add the variables after the first deploy, redeploy so the `NEXT_PUBLIC_` values get built in.
4. Check that a listing with a photo can be created, appears on the homepage, opens at `/item/<id>`, and that a sent message shows up in the Supabase `messages` table.

## Demo data

`seed/listings.tsv` and `seed/images/` hold the 8 demo listings on the live site, one per category. The images are AI-generated (Figma AI) and the seller emails are placeholder `@example.com` addresses. To reseed a fresh project, create each row through the app's `/create` form or `POST /api/listings`.

## Notes

- Vercel functions run in `sin1` (Singapore), the same region as the Supabase project, to keep database round trips short (see `vercel.json`).

- Prices are shown in USD.
- Messages are stored in Supabase. No email is sent.
- Uploads are capped at 4 MB to stay under Vercel's 4.5 MB request-body limit. Larger photos (up to 20 MB) are resized in the browser first.
