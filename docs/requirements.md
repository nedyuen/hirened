# HireNed.Now — Product Requirements

## 1. What this is

A personal site to sell yourself to future employers, built as **two pages** with a shared data backend:

1. **Profile (landing page)** — narrative, visual, fast to read. The hook.
2. **Achievement Explorer** — filterable, groupable, searchable database of evidence. The proof.

They are deliberately separate because they do different jobs: Profile answers "who is this person, in 30 seconds"; Explorer answers "prove it" for someone who wants to dig. A data table can't carry personality; a narrative page can't hold 50+ tagged bullets without becoming unreadable. Don't merge them.

Long-term: same data model becomes a multi-tenant SaaS (anyone signs up, gets their own Profile + Explorer). Every table is owner-scoped from day one so this isn't a later rebuild.

---

## 2. Data model

### Hierarchy
```
Company (employer)
 └─ Role (job stint: title + date range)
     └─ Project (a named piece of delivery work)
         ├─ Responsibility (a task/scope you owned — optional, 0..n)
         └─ Evidence (achievement / award / review — 0..n, optionally linked to 1+ Responsibilities)
```

### Key modeling decisions (and why)

**Company = employer, not client.** UBS / Accenture / JP Morgan are companies. Goldman Sachs / Morgan Stanley (Accenture secondment clients) are a *property of the project* (`client_name`), not a top-level entity. Don't conflate these — it was a real bug earlier in this project when they were merged.

**A company can have multiple roles.** One-to-many. UBS alone had two: Operations Analyst (2012–16) then Sales Associate (2016–17). Resolve which role a piece of evidence belongs to by date range, or tag explicitly if two roles ever overlap in time.

**Project's "functional role" ≠ job title.** You can hold the title "Transformation VP" while acting as a de facto Product Manager on one project and a Business Analyst on another. Keep these as two separate fields: `role.job_title` (company-level) and `project.functional_role` (project-level, aka "delivery role"). Never merge them — that erases signal about range.

**Description vs. Evidence — the "delete the subject" test.** For any bullet, remove "I"/"this" and see if it survives as a standalone fact:
- Survives → **Description** (a property: `goal` on Project, `description` on Role, `blurb` on Company). Exactly one per entity. Not filterable, not counted, not a card.
- Collapses without the person specifically → **Evidence** (a child record: achievement/award/review). Zero-to-many, independently taggable/filterable/countable.

Example: "This role is about leadership engagement" → description (property). "Got this role through my internal reputation" → evidence (achievement/award, since it doesn't survive without *you* specifically).

**Evidence has three types, not one flat list:**
| Type | Answers | Has a metric? | Has a quote? |
|---|---|---|---|
| `achievement` | What changed because of you | Yes | No |
| `award` | Someone's formal recognition of you | Sometimes | No |
| `review` | Someone's judgement, in their words | No | Yes (`quote` + `source`) |

**Evidence has a level, independent of type:** `company` / `role` / `project`. A firm-wide award (e.g. "Top 15% performance rating") is role-level — it must NOT be forced under one project just because it needs a parent. Use `related_project_id` (nullable) to *reference* a project without the evidence being *owned* by it — e.g. an award that recognizes work spanning a project without being earned solely for it. This is the same pattern as tags: reference without ownership.

**Responsibility and Evidence are siblings under Project, not parent-child.** Reasoning: the relationship is many-to-many, not one-to-many —
- One responsibility can produce multiple achievements (e.g. "evaluated ways to streamline the process" → reduced processing time AND reduced error rate).
- One achievement can stem from multiple responsibilities combined (can't cleanly attribute to just one).
- Forcing evidence to require a parent responsibility also blocks the "log it now, structure it later" workflow — you want to be able to jot down an achievement before its full context is defined.

So: `evidence.related_responsibility_ids` (nullable, multi-valued) — optional link, not ownership. A responsibility with zero linked achievements is still valid to show (ongoing scope without a quantified result yet, e.g. "manages stakeholder relationships across 5 teams").

**Tags are multi-valued — grouping by tag must not duplicate full content.** Each evidence item has 1+ `category_tags` from a fixed enum (Strategy, Operations, Product, Data, Programming, Change, Finance, Management — matches the skill-radar categories, one taxonomy used everywhere). When grouping by tag: show the full card once, under its *first-listed* tag ("home" group); show a compact one-line cross-reference stub ("→ see under X") in every other matching group. Never repeat the full card text — that's a real readability cost, not just redundancy.

**Company/Role/Project/Type are single-valued dimensions — grouping by these is a clean partition, no duplication logic needed.**

### Suggested schema (Postgres/Supabase shape)

```sql
companies(id, owner_id, name, blurb, sort_order)
roles(id, owner_id, company_id, job_title, description, start_date, end_date)
projects(id, owner_id, company_id [client], role_id, functional_role, name, goal, sort_order)
responsibilities(id, owner_id, project_id, description, sort_order)
evidence(
  id, owner_id, type ['achievement'|'award'|'review'], level ['company'|'role'|'project'],
  company_id, role_id (nullable), project_id (nullable),
  related_project_id (nullable), related_responsibility_ids (uuid[], nullable),
  title, metric, quote, source, detail, year,
  is_sample (bool, default false),
  audience_tags text[] default '{both}',
  category_tags text[] default '{}',
  sort_order
)
```
RLS: every table scoped by `owner_id = auth.uid()` for writes, public read — this is what makes "Ned's site" and "the SaaS platform" the same schema later, not a rebuild.

---

## 3. Page 1 — Profile (landing page)

**Not yet built. Spec:**
- Hero: name, one-line positioning, short career-profile paragraph
- **Audience lens toggle** (Tech / Banking / Both) — reframes headline roles-sought and skill emphasis; same content, different framing, not two separate sites
- "Reasons to hire" — 5-7 short punchy traits with one-line justification each
- Handful of headline KPI stats (years experience, programs led, institutions, systems retired, etc.)
- Skill radar chart (tech vs. banking emphasis across the 8 categories) — reused from the Explorer's dataviz
- Clear CTA at the end: **"Browse all achievements →"** linking into the Explorer
- One scroll, no filters, no clutter — if it needs a filter, it belongs on the Explorer, not here.

---

## 4. Page 2 — Achievement Explorer

**Built and iterated. Spec as currently implemented:**

### Layout
- **Company → Role → Project tree** at top: compact indented/collapsible tree (not a node-link diagram with drawn connector lines — too fragile on resize/mobile). Click any node at any level to cascade-filter (click Company → filters to employer; click Role → filters to company+stint, shows role description inline; click Project chip → filters to that exact project, auto-sets parents too). "Reset selection" appears whenever a tree filter is active.
- **Search bar** — full text, matches title + project goal + full detail write-up + quotes + tags. Not just the bullet headline. Matching is **AND-of-words**, not phrase/substring: each space-separated word must appear somewhere on the card, independently — "Python data" matches a card that mentions Python in one sentence and data elsewhere, not just cards where those words appear adjacent and in that order.
- **Primary filters, always visible:** Company (via tree), Search.
- **Secondary filters, collapsed behind "More filters ▾" with an active-count badge:** Type (achievement/award/review, with icons), Expertise (the 8-category multi-select, click-to-toggle), Delivery role (project-level hat — labeled distinctly from job-title Role to avoid confusion).
- **Group-by control:** Company / Role / Delivery role / Project / Type / Expertise-tag / Flat. Each labeled plainly (what it groups by, in plain language, not just a keyword).
- **Descriptions surface consistently at their own level, matching the grouping:** group by Company → company blurb shows under the header; group by Role → role description shows under the header; group by Project → project goal shows under the header. Same pattern, same placement, every level.
- **Cards:** icon indicates type (target=achievement, medal=award, quote-marks=review) — same icon set used on filter chips as a legend. Level badge (Company-level/Role-level/Project-level) on every card. Metric badge (colored by company accent). Tags as small chips. Click to expand → full detail write-up + a distinct "Project context" box (the goal, visually separated from the achievement's own text, not overwriting it).
- **Placeholder projects** (no evidence logged yet) shown as dashed-border cards with a toggle to show/hide — doubles as a visible content backlog/checklist.
- **Sample/fabricated data** clearly flagged: amber "SAMPLE" tag per card + a banner count at the top, so nothing fake accidentally reads as verified once real content replaces it.

### Explicitly rejected approaches (don't rebuild these — already tried and reasoned against)
- One flat page with all achievements inline (original ask) → too long, no way to navigate volume. This is *why* the Explorer exists.
- Ad-hoc free-text tags per achievement → replaced with the fixed 8-category enum shared with the skill radar.
- Grouping by tag showing full duplicate cards in every matching group → replaced with home-group-plus-stub pattern.
- Achievement requiring a mandatory parent Responsibility → rejected, kept as optional many-to-many link (see §2).
- Merging Company(employer) and Company(client) into one filter dimension → caused real filter bugs, now explicitly separate.
- Free-text OR search (comma-separated terms or similar "match any word" syntax) → considered and deferred. The Company/Role/Project/Delivery role/Expertise/Type chip filters already serve "match any of these values" for anything structured; OR-style free text would just duplicate that. Search stays AND-of-words.

---

## 5. Design language

- **Palette:** off-white paper background (~#F2F3EF), ink navy text (~#1C2230), per-company accent colors rather than one global accent (JP Morgan teal, Goldman Sachs brass, Morgan Stanley purple, UBS red, Accenture blue) — reinforces "same person, different contexts" visually.
- **Type:** Space Grotesk (display/headings), Inter (body), IBM Plex Mono (data labels, metrics, filter chips, tags) — the mono typeface is doing a lot of work signaling "this is a data-driven capital-markets/tech person," not decorative.
- **Tone:** professional yet sleek — avoid generic "AI-default" look (near-black+neon or warm-serif-on-cream). Small distinctive touch: a market-ticker-style scrolling stat bar on the original mockup, evoking capital markets.
- **Icons:** minimal line-SVG, not emoji, colored to match context rather than fixed brand colors.

---

## 6. Open decisions (resolve before/while building)

1. Should Responsibility get its own filter/group-by row, or stay as nested structure inside a project's drill-down only? (Leaning: nested only — five+ filter dimensions is already close to the usability ceiling.)
2. Profile page: build as fully static content, or pull live from the same Supabase tables as the Explorer from day one?
3. Content backlog: ~14 placeholder projects still need real write-ups before this can go live publicly — this is writing work, not design/build work.
4. SaaS phasing: (1) static personal site → (2) auth-gated self-editor (same schema, `owner_id` already supports it) → (3) public signup with per-user slugs/subdomains.

---

## 7. Stack notes
- Frontend: React (Vite) + Tailwind
- Backend: Supabase (Postgres + Auth + RLS) — schema in §2 is ready to apply as-is
- Hosting: Vercel
- Charts: Recharts (skill radar already prototyped)
