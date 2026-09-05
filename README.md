# Salon Central CRM

A simple leads CRM for cold-calling: add leads, assign them to your sales team, and move each one through a pipeline (New → Contacted → Interested → Follow-up → Not Interested → Won/Lost). Every call made to a lead is logged so there's a history of outreach.

Built with Next.js (App Router) + Supabase (Postgres, Auth, Row Level Security).

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (free tier is fine to start).
2. In the project dashboard, go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key

## 2. Configure environment variables

Copy the example env file and fill in the values from step 1:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Run the database migration

1. In the Supabase dashboard, open the **SQL Editor**.
2. Paste the contents of each file in [`supabase/migrations/`](supabase/migrations/) and run them **in filename order**, starting with `0001_init.sql`.

This creates:
- `profiles` (role: `admin` or `sales_rep`, auto-created whenever a new user signs up)
- `leads` (with a `status` pipeline field and a `product` field — see below)
- `call_logs` (a timestamped record of every logged call)
- Row Level Security policies so sales reps only see leads assigned to them, while admins see everything (including the unassigned pool).

## 4. Create your users

There's no public sign-up page on purpose — accounts are created by you so only your team has access.

1. In the Supabase dashboard, go to **Authentication → Users → Add user** and create an account for yourself (and each sales rep) with an email + password.
2. Every new user automatically gets a row in `profiles` with `role = sales_rep`.
3. To make yourself an admin, go to **Table Editor → profiles**, find your row, and change `role` to `admin`.

Admins add leads and assign them to reps (unassigned leads are admin-only). Sales reps only see leads assigned to them — they log calls and move their leads through the pipeline, but can't see the unassigned pool or reassign a lead to a teammate.

## 5. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Two pipelines: Salon Central and Pointly

Leads are tracked per product. Every lead row carries a `product` value —
`salon_central` or `pointly` — and each product gets its own set of pages:

| | Salon Central | Pointly |
| --- | --- | --- |
| Pipeline | `/leads` | `/pointly` |
| Add a lead | `/leads/new` | `/pointly/new` |
| Lead detail | `/leads/[id]` | `/pointly/[id]` |
| Import CSV | `/leads/import` | `/pointly/import` |
| Export CSV | `/leads/export` | `/pointly/export` |

The two pipelines are fully separate: searching, filtering, importing,
exporting, "Delete All … Leads", and the board/list counts all stay within one
product, and opening a lead under the wrong product's URL 404s. What they
*share* is everything else — the same six stages, the same venue categories,
the same sales reps and RLS rules, and one call-log history per lead.

Adding a third product is a small enum value plus one entry in `LEAD_PRODUCTS`
([`src/lib/types/database.ts`](src/lib/types/database.ts)) and a route folder
that mirrors [`src/app/(app)/pointly/`](src/app/\(app\)/pointly/); the page
bodies live in [`src/components/leads/`](src/components/leads/) and are shared.

## How it works

- **`/leads`, `/pointly`** — the pipeline for that product. Toggle between a Kanban board (grouped by stage) and a filterable list view. Admins can filter by rep and search by name/phone/email/company.
- **`/leads/new`, `/pointly/new`** — add a lead (admin only): contact info, source, notes, and optional initial assignment.
- **`/leads/[id]`, `/pointly/[id]`** — lead detail: contact info, status/assignment controls, editable notes, a "Log a call" form, and full call history.
- **`/dashboard`** — lead counts per pipeline stage, one section per product; admins also see a per-rep breakdown split by product.

## Deploying

Deploy to [Vercel](https://vercel.com/new) (or any Next.js host) and set the same two environment variables in your hosting provider's dashboard.
