# ThoughtPad — Deployment & Operations Guide

ThoughtPad is a mobile-first **brain dump / quick-capture** platform built with
Next.js (App Router), Tailwind CSS, Drizzle ORM, and PostgreSQL. This guide
covers local development and production deployment (Neon PostgreSQL + Vercel).

---

## 1. Tech Stack & Architecture

| Layer            | Choice                                             |
| ---------------- | -------------------------------------------------- |
| Framework        | Next.js 16 (App Router, Server Actions, RSC)       |
| Styling          | Tailwind CSS 4, custom parchment design tokens     |
| Database         | PostgreSQL via Drizzle ORM (`node-postgres`)       |
| Auth             | Username + password, scrypt hashes, DB sessions    |
| PWA              | `manifest.webmanifest`, standalone display, icons  |
| Smart sorting    | Local adaptive classifier (keyword priors + Naive Bayes over user history) |

### Repository layout

```
src/
├── actions/          # Server actions (auth, thoughts, drawers, settings)
├── app/
│   ├── (auth)/       # Login & registration — the auth wall
│   ├── api/export/   # JSON / CSV data-export endpoint
│   ├── icons/[size]/ # Dynamic PWA icons (ImageResponse)
│   ├── page.tsx      # Protected stream (requires a session)
│   ├── manifest.ts   # PWA manifest
│   └── layout.tsx    # Fonts (Fraunces / Inter / Courier Prime) + metadata
├── components/       # App shell, header, sidebar, composer, cards, views
├── db/               # Drizzle client, schema, seed script
└── lib/              # Auth helpers, classifier, data loaders, constants
```

Security model: every table carries a `user_id`; **every** query filters by
the session's user id, giving each account a fully isolated data container.
Sessions are opaque 256-bit tokens stored in an `httpOnly` cookie and hashed
(SHA-256) at rest.

---

## 2. Run Locally

### Prerequisites

- **Node.js 20+** (or 22 LTS)
- **npm** (comes with Node)
- **PostgreSQL 14+** — local instance, Docker, or a free [Neon](https://neon.tech) database

Quick local Postgres via Docker:

```bash
docker run --name thoughtpad-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=app_db \
  -p 5432:5432 -d postgres:16
```

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env        # or create .env manually, see below

# 3. Push the schema to the database (no migration files needed)
npx drizzle-kit push

# 4. Seed the demo account (demo / thoughtpad123) — optional but recommended
npm run seed

# 5. Start the dev server
npm run dev
```

Open **http://localhost:3000** → you land on the login gate.

### Environment variables

| Variable       | Required | Example                                            |
| -------------- | -------- | -------------------------------------------------- |
| `DATABASE_URL` | Yes      | `postgresql://postgres:postgres@127.0.0.1:5432/app_db` |

That is the only variable the app needs. No third-party API keys are required —
the smart-sorting classifier runs entirely locally.

### Useful scripts

| Command              | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Development server (hot reload)           |
| `npm run build`      | Production build                          |
| `npm run start`      | Start the production server               |
| `npm run typecheck`  | Strict TypeScript check                   |
| `npm run seed`       | Create the demo account with sample data  |
| `npx drizzle-kit push`   | Sync `src/db/schema.ts` to the database |
| `npx drizzle-kit studio` | Visual database browser                 |

### Testing checklist (local)

1. Register a new account → you should be dropped into an empty, auto-focused stream.
2. Type `buy eggs and milk` → Save → the card lands tagged **Errands** with a task chip.
3. Check the task off → it vanishes to **Archive** (sidebar → Archive).
4. Delete a thought → **Recently Deleted** → restore it.
5. Sidebar → Brain Drawers → create `Gift Ideas`; save `gift for mom — silk scarf` → tagged automatically.
6. Search icon → type `milk` → live filtering.
7. Settings → switch fonts, then **Export JSON / CSV** → file downloads.
8. Sign out → `/` redirects to `/login`; other users' data stays invisible.

---

## 3. Deploy to Production

### 3.1 Database — Neon PostgreSQL

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy the **pooled connection string** from the dashboard, e.g.
   `postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require`
3. Keep it handy for Vercel.

### 3.2 Vercel

1. Push the repository to GitHub/GitLab and **import it in Vercel**
   (Framework preset: *Next.js* — auto-detected; no overrides needed).
2. In **Project → Settings → Environment Variables**, add:
   - `DATABASE_URL` → your Neon connection string (Production + Preview).
3. Deploy. Build command `next build` and output are defaults.
4. Apply the schema **once**, from your machine:

   ```bash
   DATABASE_URL="your-neon-url" npx drizzle-kit push
   DATABASE_URL="your-neon-url" npm run seed   # optional demo data
   ```

5. Visit your deployment, register, and start dumping.

> **Scaling note:** the Drizzle client reuses a warm `pg.Pool` across
> invocations. On serverless platforms prefer Neon's pooled (`-pooler`)
> endpoint to stay within connection limits.

### 3.3 PWA installation (phones)

Once deployed over HTTPS, open the site in mobile Safari/Chrome →
**Share → Add to Home Screen**. ThoughtPad then launches full-screen
(`display: standalone`) with its parchment icon, exactly like a native app.

---

## 4. Troubleshooting

| Symptom                                   | Fix                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `DATABASE_URL is required` at boot        | `.env` missing — create it and restart.                             |
| `relation "users" does not exist`          | Schema not pushed — run `npx drizzle-kit push`.                     |
| Stuck on /login after registering          | Cookies blocked — allow cookies for the domain.                     |
| Icons/manifest 404 locally                 | Next caches generated assets — hard-reload or restart the dev server.|
| `drizzle-kit push` SSL errors on Neon      | Ensure `?sslmode=require` is present in the URL.                    |
