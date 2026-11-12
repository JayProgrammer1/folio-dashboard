# Folio

A clean, private project & task workspace built with **Next.js (App Router)**, **Drizzle ORM**, and **PostgreSQL**. Every account starts completely empty — no fake or sample data — and automatically creates its PostgreSQL tables on first connection.

## Deploy Live for Free (Vercel + Neon — ~2 minutes)

1. **Push or export this project to a GitHub repository** (`.gitignore` already excludes `.env` and build artifacts).
2. Go to **[vercel.com/new](https://vercel.com/new)** and import your GitHub repository.
3. In Vercel, open **Storage → Create Database → Neon Postgres (Free)** and connect it to the project (this sets `DATABASE_URL` automatically).
4. Click **Deploy**. On first visit, Folio automatically creates all PostgreSQL tables (`users`, `sessions`, `members`, `projects`, `tasks`, `activities`).

## One-Click Alternative: Render Blueprint (`render.yaml`)

1. Push this repository to GitHub.
2. Go to **[dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)** → **New Blueprint Instance** and select your repo.
3. Render reads `render.yaml`, provisions a free PostgreSQL database + Node web service, wires `DATABASE_URL`, and verifies `/api/health`.

## Mobile App (Flutter WebView)

A ready-to-use Flutter wrapper lives in [`flutter-webview/`](./flutter-webview/README.md) —
copy `lib/main.dart`, set `folioUrl`, and run `flutter build apk` / `flutter build ipa`.
The site is tuned for WebView: PWA manifest + icons, 16px inputs (no iOS auto-zoom),
larger touch targets, and notch-safe insets.

## Run Locally

```bash
cp .env.example .env
# Set DATABASE_URL in .env
npm install
npm run dev
```
