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
2. Paste the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and run it.

This creates:
- `profiles` (role: `admin` or `sales_rep`, auto-created whenever a new user signs up)
- `leads` (with a `status` pipeline field)
- `call_logs` (a timestamped record of every logged call)
- Row Level Security policies so sales reps only see leads assigned to them plus the unassigned pool, while admins see everything.

## 4. Create your users

There's no public sign-up page on purpose — accounts are created by you so only your team has access.

1. In the Supabase dashboard, go to **Authentication → Users → Add user** and create an account for yourself (and each sales rep) with an email + password.
2. Every new user automatically gets a row in `profiles` with `role = sales_rep`.
3. To make yourself an admin, go to **Table Editor → profiles**, find your row, and change `role` to `admin`.

Admins can add leads and assign/reassign them to any rep. Sales reps can see leads assigned to them, claim unassigned leads, log calls, and move leads through the pipeline — but can't reassign a lead to a teammate.

## 5. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## How it works

- **`/leads`** — the pipeline. Toggle between a Kanban board (grouped by stage) and a filterable list view. Admins can filter by rep and search by name/phone/email/company.
- **`/leads/new`** — add a lead (admin only): contact info, source, notes, and optional initial assignment.
- **`/leads/[id]`** — lead detail: contact info, status/assignment controls, editable notes, a "Log a call" form, and full call history.
- **`/dashboard`** — lead counts per pipeline stage; admins also see a per-rep breakdown.

## Deploying

Deploy to [Vercel](https://vercel.com/new) (or any Next.js host) and set the same two environment variables in your hosting provider's dashboard.
