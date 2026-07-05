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
- Profile's Functional Expertise cards now show 1-2 "Example —" proof bullets per category, via a hand-maintained `CAREER_HIGHLIGHTS` mapping (same pattern as Explorer's `TARGET_ROLES`) plus a local `HIGHLIGHT_TEXT` lookup holding just those 8 referenced items' bullet/goal text, copied word-for-word from Explorer's `PROJECTS`/`ROLE_EVIDENCE`. **Known fragility:** `ref` matches by evidence `title` or project `name` string — renaming an achievement title or project name in Explorer without updating `CAREER_HIGHLIGHTS`/`HIGHLIGHT_TEXT` will silently drop that card's example (no error, it just stops showing). Once wired to Supabase, this should become a live query by title/name instead of a manual copy.
- Explorer's `groupBy` and `filtersOpen` are now both URL-param-aware (previously hardcoded to `"company"` / `true`): `groupBy` reads `?groupBy=`; `filtersOpen` defaults to collapsed when landing with any of `type`/`cat`/`role`/`tier`/`preset`/`company`/`audience`/`q`/`groupBy` present (arriving pre-filtered from Profile), expanded otherwise (direct nav). Don't accidentally revert these to hardcoded defaults.
- Fixed a latent gap while wiring this up: `?preset=` previously only set the `activePreset` label/pill on load — it never actually applied that preset's `categories`/`deliveryRole`/`audience` to the real filter state, so a preset link filtered nothing. `lens`/`selectedCats`/`selectedDeliveryRoles` now also seed from `TARGET_ROLES[preset]` on mount (only when the more-specific `cat`/`role`/`audience` params aren't already present) so Profile's "Roles I'm looking for" chips (`explorerLink({ preset: roleName })`) actually filter on arrival, not just label the pill.
- Profile now has a "07 — In their words" Testimonials section (between Education & Qualifications and the footer CTA), showing 2 reviews via a hand-maintained `TESTIMONIALS` mapping (title/source refs, same reference-not-reauthor pattern as `CAREER_HIGHLIGHTS`) plus a local `TESTIMONIAL_TEXT` lookup holding the matching quote text verbatim from Explorer's `PROJECTS`/`ROLE_EVIDENCE`. Both source reviews are currently `sample: true` in Explorer — placeholder content, same as ~13 other evidence items — so this section is surfacing sample quotes for now; swap in real reviews during the broader content-review pass (see requirements.md §6.3, ~14 placeholder projects). Same title-matching fragility as `CAREER_HIGHLIGHTS` applies here.

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
