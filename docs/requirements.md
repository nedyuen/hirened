# HireNed.Now — Product Requirements

## 1. What this is

A personal site to sell yourself to future employers, built as **three pages** sharing one data backend:

1. **Career Profile** (`/`) — narrative, visual, fast to read. The hook.
2. **Achievement Explorer** (`/explorer`) — filterable, groupable, searchable database of evidence. The proof.
3. **Interview Mode** (`/interview`) — placeholder, "Coming soon." A future chatbot ("InterviewNed.Now") trained on the site's content.

Profile and Explorer are deliberately separate because they do different jobs: Profile answers "who is this person, in 30 seconds"; Explorer answers "prove it" for someone who wants to dig. A data table can't carry personality; a narrative page can't hold 50+ tagged bullets without becoming unreadable. Don't merge them.

**Single lens throughout — no tech/banking audience toggle.** An early draft explored this; it was explicitly removed. Content is presented once, not reframed per audience. (Explorer.jsx's UI hadn't fully caught up to this decision until the Supabase-wiring pass — a leftover `lens`/`?audience=` filtering mechanism was removed then, once `evidence.audience_tags` also stopped existing in the schema.)

All three pages share one consistent nav bar (Career Profile / Achievement Explorer / Interview Mode, same order, current page filled in teal #1F5C56, others outlined) and one design system (section 5).

Long-term: same data model becomes a multi-tenant SaaS (anyone signs up, gets their own instance). Every table is owner-scoped from day one so this isn't a later rebuild.

---

## 2. Data model

### Hierarchy
```
Company (employer)
 -> Role (job stint: title + date range)
     -> Project (a named piece of delivery work)
         -> Responsibility (a task/scope you owned - optional, 0..n, designed but not yet built into the UI)
         -> Evidence (achievement / award / review - 0..n, optionally linked to 1+ Responsibilities)
```

### Key modeling decisions (and why)

**Company = employer, never a client.** UBS / Accenture / JP Morgan are companies. Goldman Sachs / Morgan Stanley (Accenture secondment clients) are a property of a project or piece of evidence (client_name, plain text) — never a foreign-keyed company row. This was a real bug caught before the schema was ever applied: an early draft made company_id a foreign key on projects/evidence, which would fail on insert for any GS/MS record since they were never companies Ned worked for.

**A company can have multiple roles (one-to-many).** UBS alone had two: Operations Analyst (2012-16) then Sales Associate (2016-17), each with its own description, resolved per evidence item by matching its year against the stint's date range.

**Role (job stint) is not the same as Delivery role (project-specific hat).** You can hold the title "Transformation VP" while acting as a de facto Product Manager on one project and a Business Analyst on another. Two separate fields: roles.job_title (company-level) and projects.functional_role (project-level). Never merge them — that erases signal about range. In the UI, "Delivery role" is explicitly labeled "distinct from job title" so this is never re-confused.

**Delivery role's filter chips are derived from live data, not a hardcoded list — deliberately different from Expertise and Type.** Expertise is a closed 8-value taxonomy (new values there are more likely typos than genuine new categories) and Type is a fixed 3-value enum; both are legitimately fine as constants. Delivery role is different: it's inherently open-ended, expected to keep growing as more of Ned's career gets logged, so a hardcoded list (`FUNC_ROLES`, formerly `["Transformation Lead", "Product Manager", "Project Manager", "Program Manager", "Business Analyst"]`) inevitably drifted behind the real data — by the time this was caught, the live data actually contained 10 distinct values (AI Lead, Business Analyst, Data Lead, Management Consultant, Operations Specialist, People Manager, Product Manager, Program Manager, Project Manager, Salesperson), several of which had no way to be filtered on despite being correctly stored, while "Transformation Lead" — the one hardcoded value that turned out not to reflect anything in the live data — was still shown. Fixed by deriving the filter chip options with a `useMemo` off the already-fetched `projects` data (`[...new Set(projects.map(p => p.functionalRole).filter(Boolean))].sort()`) — zero maintenance, always exactly matches what's actually filterable, no new query. **The group-by-delivery-role logic was already fine** — its key function (`r.functionalRole || "Role-level (no project)"`) always read whatever value was actually on each row, never depended on the hardcoded list; only the filter *chip list* was the stale part.

**`roles.team` vs. `roles.description` — structural vs. narrative, same two-facet split as elsewhere in this schema.** `description` is the narrative blurb (what the role actually involved, in prose) — shown in the Explorer's role-group header, already correct and untouched by this split. `team` is structural/org information (which teams/functions the role sat across, e.g. "Rates Middle Office (Risk Control, Trade Control, Desk Services); Derivatives Operations (OTC Confirmations, ETD Regulatory Reporting)") — shown on the Profile's Career Journey timeline instead of `description`, since a compact org-structure line reads better in a scannable timeline than a full narrative paragraph would. `team` is nullable and starts empty for every role — Ned populates it directly in Supabase; the Profile timeline omits the line entirely for any role where it's still null rather than rendering an awkward blank line.

**`projects.start_date`/`end_date` replaced the single `projects.year` column**, matching the date-range shape `roles` already used — including the same `end_date = null` means ongoing/current convention. A single int couldn't express a project spanning a boundary or one still in progress, and keeping two different date representations (`roles` uses a range, `projects` used one int) was an unforced inconsistency once `roles` already had the better shape. **The backfilled `start_date` values are a placeholder, not researched data**: for each project's old `year`, `start_date` was set to January 1 of that year via `make_date(year, 1, 1)`, and `end_date` was left null for every project — same caveat as the (also inferred, unconfirmed) Accenture secondment date boundary elsewhere in this project. Ned should go through and correct actual start/end dates directly in Supabase. `projects.year` itself was dropped after the backfill was verified — confirmed via direct code search that no frontend logic (sorting, display, or otherwise) in Explorer.jsx or Profile.jsx ever actually read `projects.year`; it was fetched incidentally by `select("*")` calls but never used downstream, so dropping it required zero frontend changes.

**`projects.goal` renamed to `projects.description`, plus a new `projects.detail` column — the `evidence.bullet`/`evidence.detail` pattern applied one level up.** `description` keeps exactly the same job it always had (a one-liner shown wherever the project is referenced — the Explorer's group-by-project header, the "Project context" box inside an expanded evidence card, `CAREER_HIGHLIGHTS` project references), just renamed for consistency with `roles.description` and `companies.blurb` (every entity's single-line narrative field is now consistently named `description`, not a mix of `goal`/`blurb`/`description`). `detail` is new: longer optional context (origin, benefits, how it came about) that wasn't representable before — nullable, and **deliberately not backfilled or invented**; Ned writes it directly in Supabase over time, same as `roles.team`. The two places that display a project's `description` (the Explorer's group-by-project header and the "Project context" box) both got the same click-to-expand affordance evidence cards already use for `bullet` → `detail`: collapsed by default, an "expand ↓" control appears only when that project's `detail` is actually populated (never an affordance pointing at nothing), and clicking reveals it in place. Verified this doesn't accidentally collapse the parent evidence card when the "Project context" box's own expand control is clicked (it's nested inside the card's own click-to-expand region, so its button needs `stopPropagation`).

**Description vs. Evidence — the "delete the subject" test.** Remove "I"/"this" from a candidate bullet:
- Survives as a standalone fact -> Description, a single-valued property (companies.blurb, roles.description, projects.description). Exactly one per entity, never filterable, never a card.
- Collapses without the person specifically -> Evidence, a child record. Zero-to-many, independently taggable/filterable/countable.

**Evidence has three types — each answers a different question, colored and rendered distinctly, independent of company:**

| Type | Answers | Color | Rendering |
|---|---|---|---|
| achievement | What changed because of you | teal #1F5C56 | standard card |
| award | Someone's formal recognition of you | gold #B8860B | standard card |
| review | Someone's judgement, in their words or reflected through their action/decision | purple #6B4C8A | distinct: indented, tinted, italic quote block |

The Review definition was deliberately broadened during the build: it doesn't require a literal quoted sentence. Being personally sought out by name (e.g. "the head of department specifically asked me to come in to save the project") is still someone else's judgment about you, just expressed through action instead of speech — it belongs in Review, paraphrased with a source, not invented as a new category.

Considered and rejected: a broader "proof of success" category spanning achievement/award/review. Tested against real examples (a contract renewed three times; being personally requested for a rescue) — both fit cleanly into existing achievement/review definitions once those definitions were applied precisely. A fourth type would have blurred a distinction that's doing real visual/structural work.

**Evidence has a level, independent of type:** company / role / project. A firm-wide award must never be forced under one project just because it needs a parent. Originally, a nullable `related_project_id` let evidence reference a project without being owned by it (e.g. a role-level award recognizing work spanning a project without being earned solely for it). **This field no longer exists in the live schema** (dropped in a post-seeding simplification, done outside a Claude Code session — see requirements.md §7/§9 and CLAUDE.md). The one evidence row that used it (Digital & Platform Services Excellence Award) is now directly `project_id`-owned by Data Science Solutions with `level: 'project'` instead — the reference-without-ownership pattern this paragraph describes isn't representable in the schema as it currently stands. Its `detail` text used to still describe the old role-level framing, inconsistent with its `level: 'project'` assignment — fixed with a one-row content update directly in Supabase (see §9).

**Responsibility and Evidence were designed as siblings under Project, not parent-child** — the relationship was many-to-many (one responsibility can produce multiple achievements; one achievement can stem from multiple responsibilities), and a mandatory parent would have blocked the "log now, structure later" workflow used throughout. **The `responsibilities` table and `evidence.related_responsibility_ids` no longer exist in the live schema** — dropped in the same post-seeding simplification, since no page ever rendered this and no source data existed to seed it from. This section is now historical design rationale, not a description of live structure.

**Tags ("Expertise") are multi-valued, from a fixed 8-value enum** (Strategy, Operations, Product, Data, Programming, Change, Finance, Management) — same taxonomy driving the Profile's Functional Expertise section. Grouping by Expertise must not duplicate full cards across every matching group: each item gets one full card under its first-listed ("primary") tag, and a compact one-line cross-reference stub ("see under X") everywhere else it also applies. Tag order matters — list the most defining discipline first.

**Title vs. Bullet vs. Detail — three fields, three jobs, not three lengths of one sentence:**
- title — short label
- bullet — a real, authored, one-sentence resume-quality claim (action + result), always shown on the card
- detail — genuinely additive content shown only on click (why it mattered, how it was done) — must never restate the bullet

An earlier version showed a short title, then an auto-truncated 100-character slice of detail as a "preview" (sometimes cutting off mid-word), then the same sentence again in full on expand — three layers restating one fact. Fixed to the shape above.

**highlighted — a single boolean, deliberately rare (currently 4 items), not a rating scale.** Went through two rejected iterations first: a literal 5-star system (rejected — self-assessed ratings drift upward, nothing wants to call itself "2 stars," so a star scale stops discriminating), then a 3-tier Signature/Notable split (simplified further — more granularity than the actual decision needed, which is just "is this one of the few things I most want seen"). Rendered as a dark navy (#1E3A5F) badge, top-right of the card — a color distinct from every company accent and every type color.

**is_sample** originally marked fabricated/placeholder content, never shown in the UI (an amber "SAMPLE" badge and a page-level warning banner were built, then explicitly removed once real-content review became the plan). **This column no longer exists in the live schema** (dropped in the post-seeding simplification — Ned is reviewing all content directly rather than tracking a sample flag going forward). ~13 evidence items are still placeholder content in substance, just no longer flagged as such in the data.

### Schema — as originally designed (see below for what's actually live)

```sql
create table profiles (
  id uuid primary key references auth.users(id) default auth.uid(),
  slug text unique not null,
  full_name text not null,
  tagline text,
  summary text,
  headshot_url text,
  created_at timestamptz default now()
);

create table audiences (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  key text not null,
  label text not null,
  accent_color text
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  name text not null,
  blurb text,
  sort_order int default 0
);

create table roles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  company_id uuid references companies(id) not null,
  job_title text not null,
  description text,
  start_date date,
  end_date date
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  role_id uuid references roles(id) not null,
  client_name text,
  functional_role text,
  name text not null,
  goal text,
  sort_order int default 0
);

create table responsibilities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  project_id uuid references projects(id) not null,
  description text not null,
  sort_order int default 0
);

create table evidence (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  type text not null check (type in ('achievement', 'award', 'review')),
  level text not null check (level in ('company', 'role', 'project')),
  role_id uuid references roles(id),
  project_id uuid references projects(id),
  related_project_id uuid references projects(id),
  related_responsibility_ids uuid[] default '{}',
  client_name text,
  title text not null,
  bullet text,
  metric text,
  quote text,
  source text,
  detail text,
  year int,
  is_sample boolean default false,
  highlighted boolean default false,
  audience_tags text[] default '{both}',
  category_tags text[] default '{}',
  sort_order int default 0
);

alter table profiles enable row level security;
alter table audiences enable row level security;
alter table companies enable row level security;
alter table roles enable row level security;
alter table projects enable row level security;
alter table responsibilities enable row level security;
alter table evidence enable row level security;
-- (public-read / owner-write policy pair repeated per table, keyed on owner_id)
```

### Schema — as actually live today (post-simplification, see section 7)

`audiences` and `responsibilities` tables dropped entirely. `evidence` lost `related_project_id`, `related_responsibility_ids`, `year`, `is_sample`, `audience_tags`. `projects` gained, then lost, a `year` column (one year per project, not per-evidence) — since replaced by `start_date`/`end_date` (see the note above). `projects.goal` was renamed to `projects.description`, and `projects` gained a `detail` column (nullable, optional longer context — see the note above). `roles` gained a `team` column (structural, nullable — see the `roles.team` vs. `roles.description` note above). Net: **5 tables, not 7.**

```sql
create table profiles (
  id uuid primary key references auth.users(id) default auth.uid(),
  slug text unique not null,
  full_name text not null,
  tagline text,
  summary text,
  headshot_url text,
  created_at timestamptz default now()
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  name text not null,
  blurb text,
  sort_order int default 0
);

create table roles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  company_id uuid references companies(id) not null,
  job_title text not null,
  description text,
  team text,
  start_date date,
  end_date date
  -- no sort_order on this table, unlike companies/projects/evidence
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  role_id uuid references roles(id) not null,
  client_name text,
  functional_role text,
  name text not null,
  description text, -- renamed from `goal`; one-liner, same role as before
  detail text, -- new: optional longer context (origin, benefits, etc.) — evidence.bullet/detail pattern one level up
  start_date date,
  end_date date,
  -- end_date = null means ongoing/current, same convention as roles.end_date
  sort_order int default 0
);

create table evidence (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  type text not null check (type in ('achievement', 'award', 'review')),
  level text not null check (level in ('company', 'role', 'project')),
  role_id uuid references roles(id),
  project_id uuid references projects(id),
  client_name text,
  title text not null,
  bullet text,
  metric text,
  quote text,
  source text,
  detail text,
  highlighted boolean default false,
  category_tags text[] default '{}',
  sort_order int default 0
);

alter table profiles enable row level security;
alter table companies enable row level security;
alter table roles enable row level security;
alter table projects enable row level security;
alter table evidence enable row level security;
-- (public-read / owner-write policy pair repeated per table, keyed on owner_id)
```

### Filter/group-by dimensions and required display order

Company then Role then Project then Delivery role then Expertise then Type, always in this sequence, wherever filters or group-by controls appear — plus two supplementary, non-hierarchical controls: Impact (highlighted-only toggle) and free-text Search.

**All six dimensions are multi-select** (Company, Role, Project, Delivery role, Expertise, Type) — Delivery role was originally single-select and was later brought in line with the others for consistency.

**Search is AND-of-words, never OR/phrase-matching.** Typing "Python data" requires both words to appear somewhere on the card, not adjacent and in that order. Free-text OR search was considered and explicitly deferred — the chip filters already serve "match any of these" for anything structured. Matching search-term highlighting marks every occurrence of every individual word, not just a full-phrase match.

---

## 3. Career Profile page (/)

Nav bar carries a fourth element beyond the three page links: a filled "Contact Me" button, top-right, visually distinct from the outlined page-nav chips (reads as the page's primary action, not another nav destination). Currently a plain `mailto:` link — placeholder for an intended future purpose-selector modal ("Request my CV" / "Discuss an opportunity" / "Just want to connect"), each prefilling a different message template. Not built yet.

Sections, in order, sourced from the real Notion professional site. Each numbered heading below is a **SectionHeader eyebrow / bold-title pair** — the eyebrow is a short plain label, the bold title is a hook phrased as a question (a deliberate style decision: eyebrow=label, title=question, no numbered prefixes). Hero is the exception — no question treatment, just a plain small label ("Professional Summary") above the headline (headline text: "Senior Strategy and Transformation Lead — driving operational efficiency through AI, Product & Program Delivery." — updated directly by Ned; the earlier "Senior Strategy & Transformation Lead, 13 years inside Capital Markets." wording is retired).

Also new: a small headshot sits beside the hero's eyebrow/headline (circular, ~80px, restrained — not a dominant banner photo). Points at `/headshot-placeholder.jpg`, which doesn't exist yet (Ned needs to supply a real photo there); falls back to a circular "NY" initials avatar if the image fails to load, so the hero doesn't visibly break in the meantime.

1. **Hero** — eyebrow "Professional Summary", headline unchanged, then a 2-paragraph prose professional summary (not a bullet list — rewritten as flowing sentences covering years of experience, programs led, domain expertise, positioning, and certifications). Context tags (Industries, Companies, Functions — **Divisions removed**, judged redundant alongside the other three) come next. **Roles I'm looking for** — chip list (8 roles; 2 originally-listed roles removed on request), each linking to its matching target-role preset in the Explorer — closes out the hero, right after the context tags.
2. **Reasons to Hire** — eyebrow "Why Hire Me", title "Why should you hire me?". 7 traits, icon-badged. Each trait is a clickable chip linking to the Explorer with the matching target-role preset applied (section 4.6). (Roles I'm looking for used to live in this section; moved up into the hero, see above.)
3. **About Me** — eyebrow "Personality & Motivators", title "What am I like to work with?". Merged Personality/Work Style section, one card, toggled via two clearly-labeled tabs ("Personality" / "Work Style"; default view is Personality). Personality: 7 traits. Work Style: 6 "what motivates me" preferences. This replaces what were previously two separate sections (About Me, Work Style). **Strengths (8 items, click-to-expand) was removed entirely** — judged duplicative with Reasons to Hire, both being "why hire me"-framed content.
4. **Expertise** — eyebrow "Functional & Technical Depth", title "What are my areas of expertise?". Functional Expertise (8 category cards, icon-badged) + Technical Toolkit (17 real tools, each linking to the Explorer filtered by that tool name). Each Functional Expertise card also shows 1-2 example proof bullets, pulled — not re-authored — from real evidence/project data via a maintained CAREER_HIGHLIGHTS mapping (category to either a specific achievement's bullet, for a sharp metric-driven example, or a project's description, for a more general one). The card's existing single click-through to the Explorer is unchanged; the example bullets are always-visible static text, not a second interactive element on the same card.
5. **Career Journey** — eyebrow "Work History", title "What is my professional journey?". Timeline only, latest first. **The compact Company→Role diagram was removed** — the timeline below it already showed the same company/role facts, so the diagram was redundant. Instead, the timeline entries themselves are now the link surface: each entry's role text and company text are independently clickable (role → Explorer filtered to that job-title role + `groupBy=role`; company → filtered to that company + `groupBy=company`), styled with underline-on-hover rather than looking like separate buttons bolted onto the row.
6. **Education & Certifications** — eyebrow "Education & Certifications", title "What are my qualifications?". Certifications rendered as visual badges, not a plain list.
7. **Testimonials** — eyebrow "Testimonials", title "What do people say about me?". 2-3 hand-picked reviews, referenced (not re-typed) from Explorer review evidence via a maintained TESTIMONIALS mapping, placed right before the footer CTA. Reviews were not split into a separate page/system (section 4.1) — this section is a curated front door onto content that still fully lives in the Explorer's Type filter.
8. **Footer CTA** — clickable stat strip (Signature/Awards/Reviews counts) + "Browse the Achievement Explorer" button, plus email (`mailto:`) and LinkedIn (`https://www.linkedin.com/in/nedyuen/`, real profile link) contact links.

**Reviewed and kept as-is:** 5 of the 6 section titles above share a near-identical "What is/are/am I ___?" question template back-to-back, which risks reading FAQ-like when scrolled straight through. Ned looked at the rendered page and explicitly chose to keep all 6 as questions rather than vary the phrasing or revert some to plain labels — don't re-relitigate this without new input from Ned.

Explicitly excluded: Personal Life, Analysis Style, Management Style, Learning, and a "Capital Markets Domain" section (built, then removed on request). Business Projects/Technical Work/Publications live as Evidence in the Explorer, not here.

### Page-linkage behavior (Profile to Explorer)

Every cross-link uses URL query params, read by the Explorer on mount: type, q, cat, **jobRole** (job-title Role — distinct from `role`, which is the Delivery-role param), tier, preset, company, audience, groupBy.

- Reasons to Hire chips and Roles-I'm-looking-for chips link with a preset param, applying the matching TARGET_ROLES entry.
- Career Journey timeline entries: clicking a company name sets `company` and `groupBy=company`; clicking a role/title name sets `company` + `jobRole` (matching Explorer's `ROLES[].title` exactly) and `groupBy=role`.
- Any arrival with filter params already present: the Explorer's Filters panel defaults to collapsed (active-filters summary strip stays visible). Arriving via the plain nav link with no params: panel defaults expanded.

Caveat: this mechanism only becomes a real cross-page jump once all three pages are actual routes on one deployed site.

---

## 4. Achievement Explorer page (/explorer)

### 4.1 Why this page exists

Original ask was a one-page visual CV. Rejected once volume became clear. The fix is letting the viewer choose what to see rather than picking what to cut. Same reasoning applied to Reviews: high volume doesn't justify a separate system — it justifies a curated front door (Profile's Testimonials section) while full browsing stays in the Explorer, filtered by Type.

### 4.2 Filters panel — single merged container, collapsible

One bordered panel, all six dimensions in order, plus Impact:
- Company, Role, Project — flat multi-select chip groups (not a tree diagram)
- Delivery role — multi-select chips, labeled distinct from job-title Role. **Options are derived live from the data** (distinct non-null `functional_role` values actually present, sorted alphabetically), not a maintained constant — see the data-model note below for why this dimension specifically needs to be open-ended rather than a fixed list.
- Expertise — the 8-category multi-select
- Type — achievement/award/review, icon plus own color per chip
- Impact — single "Highlighted only" toggle

All six chip groups use the same standardized shape (an earlier version mixed pill/rectangle shapes inconsistently).

Unified active-filters summary strip at the top — every applied filter shows as a removable pill colored to match its origin, with one "Clear all."

Collapse toggle on the panel header — collapsing hides the chip groups but keeps the active-filters summary visible with a count badge.

### 4.3 Company/Role/Project — flat chips, not a tree diagram

An earlier version used a real node-link tree diagram for Company-to-Role-to-Project selection. It was removed — the tree's job (visual storytelling) and the Explorer's job (fast filtering) were competing for the same space, and the tree took disproportionate vertical space (~800px before any filtering). A compact, two-level version now lives on the Profile page's Career Journey section instead, linking into the Explorer with filters plus groupBy pre-applied. The Explorer's Company/Role/Project controls are now flat multi-select chip groups.

### 4.4 Cards

- Icon (type-colored) plus title plus explicit type-label pill
- Meta line: Company, Job Role, Project (delivery role deliberately not printed here)
- No metric badge shown (data field retained, unused by the UI)
- Bullet shown by default; click to expand reveals detail, plus (only when not already grouped by Project) a distinct "Project context" box showing the project's `description` — itself independently click-to-expandable to the project's own `detail`, when populated, same collapsed-by-default/only-show-when-populated pattern as the card's own bullet/detail
- Highlighted badge (dark navy, top-right) if flagged
- Left border stripe in the type's color
- Reviews render as a distinct indented/tinted italic quote block with attribution
- No SAMPLE badges or warning banners
- Search-term highlighting: every matched word highlighted independently

### 4.5 Search, grouping, and URL-driven deep links

- Full-text, AND-of-words, across title, bullet, project name, project description, detail, quote, tags
- Group-by: Company / Role / Project / Delivery role / Expertise / Type / Flat — Expertise grouping uses the primary-tag/stub pattern
- Placeholder projects shown as dashed cards with a show/hide toggle — doubles as a visible content backlog
- Whole filter state is URL-param driven (groupBy included), enabling every Profile cross-link

### 4.6 Target-role presets

Named buttons matching the Profile's "Roles I'm looking for" list, each mapping to a combination of existing filters:

```js
const TARGET_ROLES = {
  "Strategy & Operations":     { categories: ["Strategy", "Operations"], deliveryRole: "All", audience: "both" },
  "Business Transformation":   { categories: ["Strategy", "Change"], deliveryRole: "Transformation Lead", audience: "both" },
  "Product Manager":           { categories: ["Product", "Data"], deliveryRole: "Product Manager", audience: "tech" },
  "Product Operations":        { categories: ["Product", "Operations"], deliveryRole: "Product Manager", audience: "both" },
  "Program Manager":           { categories: ["Operations", "Management"], deliveryRole: "Program Manager", audience: "both" },
  "AI Transformation Lead":    { categories: ["Data", "Change", "Programming"], deliveryRole: "Transformation Lead", audience: "both" },
  "AI Product Manager":        { categories: ["Data", "Product", "Programming"], deliveryRole: "Product Manager", audience: "tech" },
  "Technical Program Manager": { categories: ["Programming", "Operations"], deliveryRole: "Project Manager", audience: "tech" },
};
```

Hand-maintained, not auto-derived. A couple of presets currently return zero results against real data — treat as a signal, not a bug. **Now that Delivery role's filter options are derived live from the data (see §2), it's confirmed why**: `"Transformation Lead"` (used by the Business Transformation and AI Transformation Lead presets above) doesn't match any `functional_role` value actually present in the live data — it was in the old hardcoded `FUNC_ROLES` list but apparently never real. This is the same string-matching fragility already documented for `CAREER_HIGHLIGHTS`/`TESTIMONIALS` (item 8 in §9): a preset referencing a delivery-role string that's since been renamed or never existed silently returns nothing rather than erroring. Not in scope to fix by itself — if `TARGET_ROLES` gets a maintenance pass, this is exactly the kind of drift it should also account for.

### Explicitly rejected approaches

- One flat page listing every achievement inline.
- Free-text ad-hoc tags per achievement — replaced with the fixed 8-category enum.
- Full card duplication when grouping by a multi-valued tag — replaced with primary-tag-home plus cross-reference-stub.
- Achievement requiring a mandatory parent Responsibility.
- Merging Company(employer) and Company(client) into one filter dimension.
- The node-link tree diagram for Company/Role/Project inside the Explorer — removed; relocated in compact form to Profile.
- 5-star impact rating, then a 3-tier Signature/Notable system — simplified to a single scarce highlighted boolean.
- Per-tag wording variants for the same bullet.
- Full parallel finance-language vs. plain-language bullet copies.
- A separate manually-tagged "target role" field per achievement — replaced by saved filter presets.
- Free-text OR search via comma syntax.
- A broader "proof of success" evidence type spanning achievement/award/review.
- Splitting Reviews into a separate page/system due to volume — replaced by the Testimonials curated section.
- A new manually-tagged "reason-to-hire" dimension, or embedding reason-to-hire keywords into bullet text — deferred, not rejected outright (see section 6).

---

## 5. Design language

- Palette: off-white paper (#F2F3EF), ink navy text (#1C2230); per-company accent colors (JP Morgan teal #1F5C56, Goldman Sachs brass #A9803F, Morgan Stanley purple #7A4B8C, UBS red #B0473C, Accenture blue #3B5B7A). Type colors are a separate palette (achievement teal, award gold #B8860B, review purple #6B4C8A), and Highlighted has its own dark navy #1E3A5F — three independent color systems, never conflated.
- Type: Space Grotesk (display), Inter (body), IBM Plex Mono (data labels, metrics, chips, tags).
- Explicitly avoided: generic "AI-default" looks.
- Icons: minimal line-SVG, colored per-context.
- Certifications as visual badges, not a plain list.
- The Profile page uses one single accent (teal) throughout its own sections — the Explorer's per-type/per-company color system is intentionally not imported into Profile.

---

## 6. Future / deferred — the generalized "curated link" pattern

Four features, built at different points, turned out to be the same underlying shape:

| Feature | Shape |
|---|---|
| Target-role presets (4.6) | label to filter combination |
| Career highlights (3.6) | label (category) to specific evidence/project reference |
| Testimonials (3.8) | label to specific evidence reference |
| Reason-to-hire links (deferred, not built) | label to either filter combination or specific reference |

Currently implemented four times as separate hardcoded JS objects — the right level of complexity for a single-user, code-edited site right now. Do not refactor this prematurely.

If the SaaS phase builds a self-serve editor, recognizing this as one pattern means one curated_links table and one generic editor UI, reused four times, instead of four bespoke systems.

Proposed future schema sketch (not to be built now):
```sql
create table curated_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  context text not null,
  label text not null,
  mode text not null check (mode in ('filter', 'reference')),
  filter_criteria jsonb,
  evidence_ids uuid[],
  sort_order int default 0
);
```

Trigger to actually build this: whenever work starts on the auth-gated self-editor phase.

---

## 7. Technical architecture

### Frontend
React (Vite) + Tailwind + React Router. Local project scaffold exists (package.json, vite.config.js, tailwind.config.js, postcss.config.js, index.html, src/main.jsx with three routes, src/pages/Profile.jsx, Explorer.jsx, Interview.jsx). vercel.json with a SPA rewrite is required for /explorer and /interview to resolve on Vercel.

CLAUDE.md exists at the project root, auto-loaded by Claude Code every session, importing this file plus a short list of non-negotiable constraints (company/client modeling, AND-of-words search, RLS/service-key seeding). Keep both docs updated as decisions are made.

`src/lib/supabase.js` exports one shared client (`createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)`), anon-key/RLS-scoped for reads. **Explorer.jsx and Profile.jsx now query Supabase live** instead of reading hardcoded consts — see CLAUDE.md's Current State for the transform-layer approach (Explorer.jsx's `fetchExplorerData()` reassembles Supabase's relational rows into the same flat shape the filtering/grouping/search UI already expected, so none of that logic had to change) and for what replaced the old `CAREER_HIGHLIGHTS`/`TESTIMONIALS`/timeline local-copy patterns. Only Interview.jsx still has no backend and still doesn't need one (intentional placeholder). Cross-page nav still uses plain anchor tags rather than React Router's Link component — still a separate, deferred item.

### Backend — Supabase, provisioned, live, seeded, and now queried by the frontend
The "Hire Ned" Supabase project had old, unrelated tables (a booking-app prototype) confirmed unused and dropped. The schema was applied via migration, then **simplified after seeding** (see §2's "as actually live today" schema block) — 5 tables now, not 7; `responsibilities` and `audiences` dropped entirely, along with several `evidence` columns. RLS enabled, zero security advisories. Seeded with real data (1 profile, 3 companies, 5 roles, 17 projects, 29 evidence rows) via `scripts/seed.js` — **historical now, not re-runnable as-is**, since it extracted `COMPANIES`/`ROLES`/`PROJECTS`/`ROLE_EVIDENCE` directly out of Explorer.jsx's source text, and Explorer.jsx no longer contains that hardcoded data at all following the live-query wiring. `projects.year` (added post-seeding to replace per-evidence `year`) was backfilled once via `scripts/backfill-project-years.mjs`, same now-historical caveat — and `projects.year` itself has since been replaced by `start_date`/`end_date` and dropped entirely (see §2), so that script's backfill target no longer exists in the schema at all. Both scripts' own header comments explain why and what to do if a from-scratch reseed is ever needed. Seeding required the service_role key, read from `.env.local` (gitignored, never committed, never `VITE_`-prefixed) — the frontend itself only ever uses the anon key. **A 6th role was added post-seeding** (Accenture "Consulting Manager — Internal / Business Development" — see §8) via a one-off script following the same service_role-key pattern as the original seed, not through `scripts/seed.js` itself.

### Deployment
Static Vite build to Vercel, with the SPA rewrite noted above.

### SaaS phasing (not started)
1. Static personal site (current, mostly)
2. Auth-gated self-editor
3. Public signup, per-user slugs/subdomains

---

## 8. Real content inventory (from Notion, not fabricated)

Companies/Roles: UBS — Operations Analyst (2012-16), Sales Associate (2016-17). Accenture — Consulting Manager (2017-21), **now three job-stint entries in a parent/child structure** rather than one combined stint: "Consulting Manager" (2017-09 – 2021-08, the general/parent role) with "Morgan Stanley secondment" (2017-19) and "Goldman Sachs secondment" (2019-21) nested underneath it as children (both children's `job_title` were later shortened directly in Supabase from an originally longer "Consulting Manager — X secondment" form — see §9 item 16 for why that no longer matters to the nesting logic). JP Morgan — Transformation Vice President (2021-present), three phases.

**The Accenture secondments' date boundary is inferred, not confirmed** — Ned should verify. It's derived from real evidence dates: the Morgan Stanley project (Control Framework) is dated 2018; the three Goldman Sachs projects (Corporate Actions, Matching/Shaping/Allocation, Booking and Control) are all dated 2019.

**Third Accenture role: "Consulting Manager", the real parent of both secondments — not a synthesized/computed row.** Ned did internal initiatives and business-development work throughout the whole Accenture tenure, alongside the client secondments, and the general "Consulting Manager" title itself (2017-09 – 2021-08, the actual full UK tenure) had no role of its own to live under — the two secondments alone couldn't represent the ~2 months before the Morgan Stanley secondment started, or work that wasn't attributable to either client. This role fixes that: it's the genuine top-level Accenture role, with the two secondments correctly modeled as children under it. Three role-level evidence items not tied to a specific client ("Scrum, DevOps & ML analytics adoption", "AI-based PM tool — Innovation Challenge winner", "Leadership DNA (Innovate) Award") live directly on this parent role. An earlier iteration modeled this as a role named "Consulting Manager — Internal / Business Development", rendered as a flat, visually-muted "Concurrent" entry alongside (not above) the two secondments — that approach is retired; the current structure is genuine parent/child, not a computed overlap flagged after the fact.

**Nesting is inferred from date-range containment, not `job_title` text — deliberately, after the text-based version broke.** The first parent/child implementation matched on `job_title` prefix (a child's title had to literally start with `"Consulting Manager — "`). The first time Ned shortened the secondment titles directly in Supabase (to just "Goldman Sachs secondment" / "Morgan Stanley secondment"), that prefix stopped matching and the timeline silently reverted to a flat list — no error, just quietly wrong. Fixed by re-deriving the parent/child relationship from each role's `start_date`/`end_date` instead: a role nests under whichever same-company role's date range strictly contains it. This is the actually-true relationship (a secondment is a sub-period of the general tenure) and survives any future rewording of `job_title` or `description` in Supabase — see CLAUDE.md for the implementation.

**`resolveRole()`'s client-vs-year mislabeling bug is fixed, and the function is now deleted entirely.** It previously disambiguated Accenture-era items by year alone, since it had no access to an evidence item's own client field once translated to employer "Accenture" — this mislabeled "Star of the Month & Client Hero" (`company: "Goldman Sachs"`, year 2018) under the Morgan Stanley stint. Fixed at seed time (each Accenture stint carried a `client` field, matched exactly before any year-range fallback) and verified: "Star of the Month & Client Hero" correctly got the Goldman Sachs secondment's `role_id`. Now that every `evidence` row has that `role_id` set correctly as a real foreign key, `resolveRole()` has no job left to do against live data — it's been removed from Explorer.jsx (a version of it still exists, now-historical, inside `scripts/seed.js`, which is no longer re-runnable — see §7).

Projects (17 real): 3 under Goldman Sachs, 1 under Morgan Stanley, 13 under JP Morgan. Only 3 had real verified achievement write-ups (Corporate Actions, Control Framework, Data Science Solutions — all three flagged highlighted). The remaining 14 are placeholder/sample content — the single largest remaining task.

Reviews: currently 2, both still sample/placeholder content, surfaced in the Profile's Testimonials section as scaffolding pending real quotes.

---

## 9. Known gaps / next steps

1. Content backlog — ~14 placeholder achievement write-ups, 2 placeholder reviews, need real content.
2. Interview Mode has no backend.
3. ~~Supabase tables are seeded but no page queries Supabase yet~~ — Explorer.jsx and Profile.jsx now query it live (see §7); only Interview Mode still has no backend (item 2).
4. Anchor-tag navigation should become React Router's Link component.
5. Footer stat strip on Profile is still hardcoded (`◆ 4` / `6` / `2`) — should compute live off evidence data now that Profile queries Supabase for other content; not done as part of the live-wiring pass since the task scope was read-only wiring, not new derived-count logic.
6. A couple of target-role presets return zero results against real data — now confirmed why for at least one case: `"Transformation Lead"` (Business Transformation, AI Transformation Lead presets) doesn't match any `functional_role` actually in the live data (see §4.6).
7. ~~Responsibility is schema'd but not yet rendered anywhere in the UI~~ — the `responsibilities` table (and `evidence.related_responsibility_ids`) were dropped from the schema entirely in the post-seeding simplification (see §7); this is no longer a "not yet built" gap, it's off the roadmap unless reintroduced.
8. CAREER_HIGHLIGHTS/TESTIMONIALS reference by title/name string matching, not stable IDs — still true now that both resolve live from Supabase (queries are `.eq("title", ref)`/`.in("title", refs)`, same fragility as the old local-copy lookups, just against the database instead of a hardcoded object).
9. Reason-to-hire linking — deferred by design, see section 6.
10. Accenture Morgan Stanley/Goldman Sachs secondment date boundary is inferred — Ned should confirm/correct the real dates (see section 8).
11. ~~`resolveRole()`'s year-only matching mislabels "Star of the Month & Client Hero"~~ — fixed at seed time, and the function is now deleted entirely (see section 8/section 7) — not just fixed, no longer needed.
12. Contact Me button is a placeholder `mailto:` link — intended future behavior is a purpose-selector modal (Request CV / Discuss an opportunity / Just want to connect), not built yet.
13. ~~LinkedIn footer link is a placeholder URL~~ — fixed, now points to `https://www.linkedin.com/in/nedyuen/`.
14. ~~Digital & Platform Services Excellence Award's `detail` text read inconsistently with its `level: 'project'` schema assignment~~ — fixed with a one-row `detail` update directly in Supabase (see §2), removing the stale "logged at role-level, not this project alone" framing without just restating `bullet`.
15. `scripts/seed.js` and `scripts/backfill-project-years.mjs` are no longer re-runnable as-is: both extract data by parsing hardcoded consts out of Explorer.jsx's source text, which no longer contains that data following the live-query wiring (see §7). Kept as historical/audit-trail records. A from-scratch reseed would need either a temporarily-restored hardcoded-data version of Explorer.jsx, or reworking the scripts to read from a static snapshot instead. `scripts/backfill-project-years.mjs` has a second reason it can't be rerun now too: its backfill target, `projects.year`, no longer exists in the schema (replaced by `start_date`/`end_date`, see §2 and item 19 below).
16. ~~Third Accenture role nesting inferred from `job_title` naming convention~~ — that approach broke the first time secondment titles were reworded in Supabase (silently reverted to a flat list, no error). Fixed by re-deriving parent/child from date-range containment instead (see §8) — no `parent_id` column exists on `roles`, so this is still inferred client-side, but from dates now, not text. Still worth knowing: if a future role is added whose date range happens to fully contain another same-company role's range, it will auto-nest under it, intentionally or not.
17. **New** — `roles.team` is currently null for all 6 roles. Added as a schema-only change (see §2); Ned still needs to populate it directly in Supabase for each role. Until then the Career Journey timeline correctly omits the line rather than showing blank space, so this isn't visibly broken, just incomplete content — same category as the ~14 placeholder projects in item 1.
18. ~~`projects.origin`/`projects.significance` do not exist yet~~ — a two-facet narrative split for `projects` has since been built, but named `description`/`detail` (matching `evidence.bullet`/`evidence.detail`) rather than `origin`/`significance`. If `origin`/`significance` was meant as something further/different from `detail`, that's still not built — worth clarifying with Ned if it resurfaces.
19. **New** — `projects.start_date` is currently a placeholder for all 17 projects (Jan 1 of the old `year` value; `end_date` is null for all of them) — not researched data. Ned should go through and correct actual start/end dates directly in Supabase, same as the still-unconfirmed Accenture secondment date boundary (item 10). Until corrected, any future UI that displays or sorts by project dates will be showing placeholder precision, not verified fact.
20. **New** — `projects.detail` is currently null for all 17 projects. Added as a schema-only change; Ned will write this content directly in Supabase over time. Until then, the Explorer's group-by-project header and "Project context" box correctly show no expand affordance (same "don't show an expand control pointing at nothing" rule already applied to evidence cards) — same incomplete-but-not-broken category as `roles.team` (item 17) and the ~14 placeholder projects (item 1).
21. ~~Delivery role filter chips hardcoded to a stale `FUNC_ROLES` constant~~ — fixed, see §2. Options are now derived live from `projects.functional_role`. Revealed 5 real values that had no way to be filtered on before (Management Consultant, Salesperson, Operations Specialist, AI Lead, Data Lead, People Manager) and confirmed `"Transformation Lead"` (the one hardcoded value some `TARGET_ROLES` presets reference) doesn't correspond to anything in the live data — see item 6.