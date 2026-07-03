# HireNed.Now

@docs/requirements.md

Personal site selling Ned Yuen's professional experience to employers. Three pages, one Supabase backend, eventual multi-tenant SaaS. Full reasoning behind every data-model decision is in the imported requirements.md above — read it before making changes, not just this file.

## Current state (keep this section updated as work progresses)
- Supabase project "Hire Ned" is live, schema applied, RLS enabled, 7 tables, **currently empty**.
- All three pages (`src/pages/`) still render from hardcoded consts, not Supabase.
- `<a href>` used for cross-page nav — should become React Router `<Link>` eventually.
- Interview.jsx is an intentional placeholder — do not build it out unless explicitly asked.
- The Company→Role→Project node-link tree diagram was removed from Explorer.jsx's filter panel (too much vertical space for how rarely it was used) and replaced with flat multi-select chip groups for Company, Role, and Project, matching the existing Delivery role/Expertise/Type chip pattern.
- A compact, two-level Company→Role diagram (not exploded to projects) now lives in Profile.jsx's Career Journey section instead, using a local `COMPANIES_ROLES` const — every node links into the Explorer via `explorerLink()` with pre-applied filters.
- Explorer's URL params: `company` sets the Company filter; `jobRole` (paired with `company`) sets the job-title Role filter; `role` is reserved for the Delivery role filter — these are deliberately distinct params, don't conflate them (see "Role vs Delivery role" below).

## Non-negotiable constraints
- **Company = employer only** (UBS, Accenture, JP Morgan). Never make a client (Goldman Sachs, Morgan Stanley) a foreign-keyed `companies` row — they go in `client_name` as plain text. This was a real bug caught before shipping; don't reintroduce it.
- **Role** (job stint / job title) and **Delivery role** (project-specific hat, e.g. Product Manager) are different fields. Never merge them.
- `title` / `bullet` / `detail` on evidence are three distinct things: short label / scannable one-line claim / additive paragraph. `detail` must never just restate `bullet`.
- Grouping by Expertise (multi-valued tags) must never duplicate a full card into every matching group — one full card under its primary (first-listed) tag, a compact cross-reference stub elsewhere.
- `highlighted` is a single boolean, deliberately rare (~4 items). Don't turn it back into a rating scale.
- Filter/group-by dimensions always display in this order: Company → Role → Project → Delivery role → Expertise → Type.
- Search is AND-of-words (every typed word must appear somewhere on the card), never OR. OR-style "match any" search was considered and explicitly rejected — that need is already served by the Company/Role/Project/Delivery role/Expertise/Type chip filters for anything structured; free-text OR would solve a problem the chips already solve. Don't add comma-separated or token-based OR search without a concrete case the chips can't cover.
- RLS requires `auth.uid() = owner_id` for writes — seeding needs the service_role key (server-side/script only, never `VITE_`-prefixed, never committed).

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- No test suite yet.
