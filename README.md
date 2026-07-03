# Ned Yuen — Site

Three pages: Career Profile (`/`), Achievement Explorer (`/explorer`), Interview Mode (`/interview`, placeholder).
`schema.sql` (not yet applied anywhere) is the intended Supabase data model — see `docs/requirements.md` for the full design reasoning behind it.

## 1. Run it locally

```bash
npm install
npm run dev
```
Opens at `http://localhost:5173`. All three routes work via React Router.

Right now every page still uses hardcoded JS arrays for its content (the `PROJECTS`, `ROLE_EVIDENCE`, `TARGET_ROLES` etc. consts at the top of each page file) — nothing reads from Supabase yet. That's the next real step, not something that happens automatically once the database exists.

## 2. Continue with Claude Code

This is a good point to hand off to an agent rather than hand-edit further. A reasonable first prompt once you're in this folder:

> Read requirements.md and schema.sql. The three pages in src/pages currently store their content as hardcoded consts. Set up a Supabase client (see .env.example) and replace the hardcoded arrays with live queries against the schema, keeping all existing UI, filtering, and interaction logic identical. Also convert the plain `<a href>` tags between pages into React Router `<Link>` components for client-side navigation instead of full page reloads.

Worth reviewing what it does in small steps rather than one giant diff — the filtering/grouping logic in Explorer.jsx especially is easy to accidentally break while rewiring the data source.

## 3. Supabase — already provisioned

The "Hire Ned" Supabase project is live with this schema applied (7 tables: `profiles`, `companies`, `roles`, `projects`, `responsibilities`, `evidence`, `audiences`, all with Row Level Security enabled and no security lints). `.env.example` already has the real project URL and public anon key filled in — just copy it:

```bash
cp .env.example .env.local
```

**What's not done yet:** the tables are empty, and no page fetches from Supabase — every page still reads from its own hardcoded JS arrays. Two things remain:
1. Seed the tables with your real content (the arrays in each page file are the source data to migrate in).
2. Replace the hardcoded consts with live queries via `@supabase/supabase-js` (already in `package.json`).

Note on the schema vs. your original design: `client_name` is a plain text field on `projects` and `evidence`, not a foreign key to `companies` — companies are employers only (UBS/Accenture/JP Morgan); a project's client (e.g. Goldman Sachs during an Accenture secondment) was never meant to be a `companies` row, since you never worked *for* them.

## 4. Deploy

This is a static Vite build (`npm run build` → `dist/`), deployable as-is to Vercel/Netlify. Client-side routing means the host needs a rewrite rule sending all paths to `index.html` (Vercel does this automatically for Vite projects; other hosts may need a `vercel.json` / `_redirects` file).

## Known gaps to close before this is public
- Interview Mode is a static placeholder — no actual chat backend yet.
- ~13 achievement cards in the Explorer are marked as placeholder/sample content and need real write-ups.
- `<a href>` navigation between pages currently causes full page reloads instead of client-side transitions (see Claude Code prompt above).
