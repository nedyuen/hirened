# HireNed.Now — Product Requirements

## 1. What this is

A personal site to sell yourself to future employers, built as **three pages** sharing one data backend:

1. **Career Profile** (`/`) — narrative, visual, fast to read. The hook.
2. **Achievement Explorer** (`/explorer`) — filterable, groupable, searchable database of evidence. The proof.
3. **Interview Mode** (`/interview`) — placeholder, "Coming soon." A future chatbot ("InterviewNed.Now") trained on the site's content.

Profile and Explorer are deliberately separate because they do different jobs: Profile answers "who is this person, in 30 seconds"; Explorer answers "prove it" for someone who wants to dig. A data table can't carry personality; a narrative page can't hold 50+ tagged bullets without becoming unreadable. Don't merge them.

**Single lens throughout — no tech/banking audience toggle.** An early draft explored this; it was explicitly removed. Content is presented once, not reframed per audience.

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

**Description vs. Evidence — the "delete the subject" test.** Remove "I"/"this" from a candidate bullet:
- Survives as a standalone fact -> Description, a single-valued property (companies.blurb, roles.description, projects.goal). Exactly one per entity, never filterable, never a card.
- Collapses without the person specifically -> Evidence, a child record. Zero-to-many, independently taggable/filterable/countable.

**Evidence has three types — each answers a different question, colored and rendered distinctly, independent of company:**

| Type | Answers | Color | Rendering |
|---|---|---|---|
| achievement | What changed because of you | teal #1F5C56 | standard card |
| award | Someone's formal recognition of you | gold #B8860B | standard card |
| review | Someone's judgement, in their words or reflected through their action/decision | purple #6B4C8A | distinct: indented, tinted, italic quote block |

The Review definition was deliberately broadened during the build: it doesn't require a literal quoted sentence. Being personally sought out by name (e.g. "the head of department specifically asked me to come in to save the project") is still someone else's judgment about you, just expressed through action instead of speech — it belongs in Review, paraphrased with a source, not invented as a new category.

Considered and rejected: a broader "proof of success" category spanning achievement/award/review. Tested against real examples (a contract renewed three times; being personally requested for a rescue) — both fit cleanly into existing achievement/review definitions once those definitions were applied precisely. A fourth type would have blurred a distinction that's doing real visual/structural work.

**Evidence has a level, independent of type:** company / role / project. A firm-wide award must never be forced under one project just because it needs a parent. related_project_id (nullable) lets evidence reference a project without being owned by it.

**Responsibility and Evidence are siblings under Project, not parent-child** — the relationship is many-to-many (one responsibility can produce multiple achievements; one achievement can stem from multiple responsibilities), and a mandatory parent would block the "log now, structure later" workflow used throughout. evidence.related_responsibility_ids is an optional, nullable, multi-valued link. Designed, schema'd, not yet rendered in the UI.

**Tags ("Expertise") are multi-valued, from a fixed 8-value enum** (Strategy, Operations, Product, Data, Programming, Change, Finance, Management) — same taxonomy driving the Profile's Functional Expertise section. Grouping by Expertise must not duplicate full cards across every matching group: each item gets one full card under its first-listed ("primary") tag, and a compact one-line cross-reference stub ("see under X") everywhere else it also applies. Tag order matters — list the most defining discipline first.

**Title vs. Bullet vs. Detail — three fields, three jobs, not three lengths of one sentence:**
- title — short label
- bullet — a real, authored, one-sentence resume-quality claim (action + result), always shown on the card
- detail — genuinely additive content shown only on click (why it mattered, how it was done) — must never restate the bullet

An earlier version showed a short title, then an auto-truncated 100-character slice of detail as a "preview" (sometimes cutting off mid-word), then the same sentence again in full on expand — three layers restating one fact. Fixed to the shape above.

**highlighted — a single boolean, deliberately rare (currently 4 items), not a rating scale.** Went through two rejected iterations first: a literal 5-star system (rejected — self-assessed ratings drift upward, nothing wants to call itself "2 stars," so a star scale stops discriminating), then a 3-tier Signature/Notable split (simplified further — more granularity than the actual decision needed, which is just "is this one of the few things I most want seen"). Rendered as a dark navy (#1E3A5F) badge, top-right of the card — a color distinct from every company accent and every type color.

**is_sample** marks fabricated/placeholder content. Not shown in the UI (an amber "SAMPLE" badge and a page-level warning banner were built, then explicitly removed once real-content review became the plan) — the flag stays in the data for a possible future review pass. ~13 evidence items are still sample content.

### Schema (as actually applied to the live Supabase project — see section 7)

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

### Filter/group-by dimensions and required display order

Company then Role then Project then Delivery role then Expertise then Type, always in this sequence, wherever filters or group-by controls appear — plus two supplementary, non-hierarchical controls: Impact (highlighted-only toggle) and free-text Search.

**All six dimensions are multi-select** (Company, Role, Project, Delivery role, Expertise, Type) — Delivery role was originally single-select and was later brought in line with the others for consistency.

**Search is AND-of-words, never OR/phrase-matching.** Typing "Python data" requires both words to appear somewhere on the card, not adjacent and in that order. Free-text OR search was considered and explicitly deferred — the chip filters already serve "match any of these" for anything structured. Matching search-term highlighting marks every occurrence of every individual word, not just a full-phrase match.

---

## 3. Career Profile page (/)

Nav bar carries a fourth element beyond the three page links: a filled "Contact Me" button, top-right, visually distinct from the outlined page-nav chips (reads as the page's primary action, not another nav destination). Currently a plain `mailto:` link — placeholder for an intended future purpose-selector modal ("Request my CV" / "Discuss an opportunity" / "Just want to connect"), each prefilling a different message template. Not built yet.

Sections, in order, sourced from the real Notion professional site. Each numbered heading below is a **SectionHeader eyebrow / bold-title pair** — the eyebrow is a short plain label, the bold title is a hook phrased as a question (a deliberate style decision: eyebrow=label, title=question, no numbered prefixes). Hero is the exception — no question treatment, just a plain small label ("Professional Summary") above the unchanged headline.

Also new: a small headshot sits beside the hero's eyebrow/headline (circular, ~80px, restrained — not a dominant banner photo). Points at `/headshot-placeholder.jpg`, which doesn't exist yet (Ned needs to supply a real photo there); falls back to a circular "NY" initials avatar if the image fails to load, so the hero doesn't visibly break in the meantime.

1. **Hero** — eyebrow "Professional Summary", headline unchanged, then a 2-paragraph prose professional summary (not a bullet list — rewritten as flowing sentences covering years of experience, programs led, domain expertise, positioning, and certifications). Context tags (Industries, Companies, Functions — **Divisions removed**, judged redundant alongside the other three) come next. **Roles I'm looking for** — chip list (8 roles; 2 originally-listed roles removed on request), each linking to its matching target-role preset in the Explorer — closes out the hero, right after the context tags.
2. **Reasons to Hire** — eyebrow "Why Hire Me", title "Why should you hire me?". 7 traits, icon-badged. Each trait is a clickable chip linking to the Explorer with the matching target-role preset applied (section 4.6). (Roles I'm looking for used to live in this section; moved up into the hero, see above.)
3. **About Me** — eyebrow "Personality & Motivators", title "What am I like to work with?". Merged Personality/Work Style section, one card, toggled via two clearly-labeled tabs ("Personality" / "Work Style"; default view is Personality). Personality: 7 traits. Work Style: 6 "what motivates me" preferences. This replaces what were previously two separate sections (About Me, Work Style). **Strengths (8 items, click-to-expand) was removed entirely** — judged duplicative with Reasons to Hire, both being "why hire me"-framed content.
4. **Expertise** — eyebrow "Functional & Technical Depth", title "What are my areas of expertise?". Functional Expertise (8 category cards, icon-badged) + Technical Toolkit (17 real tools, each linking to the Explorer filtered by that tool name). Each Functional Expertise card also shows 1-2 example proof bullets, pulled — not re-authored — from real evidence/project data via a maintained CAREER_HIGHLIGHTS mapping (category to either a specific achievement's bullet, for a sharp metric-driven example, or a project's goal, for a more general one). The card's existing single click-through to the Explorer is unchanged; the example bullets are always-visible static text, not a second interactive element on the same card.
5. **Career Journey** — eyebrow "Work History", title "What is my professional journey?". Timeline only, latest first. **The compact Company→Role diagram was removed** — the timeline below it already showed the same company/role facts, so the diagram was redundant. Instead, the timeline entries themselves are now the link surface: each entry's role text and company text are independently clickable (role → Explorer filtered to that job-title role + `groupBy=role`; company → filtered to that company + `groupBy=company`), styled with underline-on-hover rather than looking like separate buttons bolted onto the row.
6. **Education & Certifications** — eyebrow "Education & Certifications", title "What are my qualifications?". Certifications rendered as visual badges, not a plain list.
7. **Testimonials** — eyebrow "Testimonials", title "What do people say about me?". 2-3 hand-picked reviews, referenced (not re-typed) from Explorer review evidence via a maintained TESTIMONIALS mapping, placed right before the footer CTA. Reviews were not split into a separate page/system (section 4.1) — this section is a curated front door onto content that still fully lives in the Explorer's Type filter.
8. **Footer CTA** — clickable stat strip (Signature/Awards/Reviews counts) + "Browse the Achievement Explorer" button, plus email (`mailto:`) and LinkedIn (placeholder URL — Ned to fill in the real profile link) contact links.

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
- Delivery role — multi-select chips, labeled distinct from job-title Role
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
- Bullet shown by default; click to expand reveals detail, plus (only when not already grouped by Project) a distinct "Project context" box
- Highlighted badge (dark navy, top-right) if flagged
- Left border stripe in the type's color
- Reviews render as a distinct indented/tinted italic quote block with attribution
- No SAMPLE badges or warning banners
- Search-term highlighting: every matched word highlighted independently

### 4.5 Search, grouping, and URL-driven deep links

- Full-text, AND-of-words, across title, bullet, project name, goal, detail, quote, tags
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

Hand-maintained, not auto-derived. A couple of presets currently return zero results against real data — treat as a signal, not a bug.

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

Current gaps: every page still reads from hardcoded JS consts, not Supabase. Cross-page nav still uses plain anchor tags rather than React Router's Link component.

### Backend — Supabase, provisioned and live
The "Hire Ned" Supabase project had old, unrelated tables (a booking-app prototype) confirmed unused and dropped. The schema above was applied via migration. 7 tables live, RLS enabled, zero security advisories. Tables are currently empty. @supabase/supabase-js is in package.json, unused so far. Seeding requires the service_role key (server-side/script-only, never committed).

### Deployment
Static Vite build to Vercel, with the SPA rewrite noted above.

### SaaS phasing (not started)
1. Static personal site (current, mostly)
2. Auth-gated self-editor
3. Public signup, per-user slugs/subdomains

---

## 8. Real content inventory (from Notion, not fabricated)

Companies/Roles: UBS — Operations Analyst (2012-16), Sales Associate (2016-17). Accenture — Consulting Manager (2017-21), **now split into two job-stint entries** rather than one combined stint: "Consulting Manager — Morgan Stanley secondment" (2017-19) and "Consulting Manager — Goldman Sachs secondment" (2019-21). The job title itself didn't change between secondments (unlike UBS's genuine Operations Analyst → Sales Associate title change) — only the client did — so the two stints share one title, differentiated by a client-secondment suffix rather than a real title change. JP Morgan — Transformation Vice President (2021-present), three phases.

**The Accenture split's date boundary is inferred, not confirmed** — Ned should verify. It's derived from real evidence dates: the Morgan Stanley project (Control Framework) is dated 2018; the three Goldman Sachs projects (Corporate Actions, Matching/Shaping/Allocation, Booking and Control) are all dated 2019. The chosen boundary (~Jan 2019) is the only one, given `resolveRole()`'s year-only (not date-only, and not client-aware) matching logic, that correctly resolves all four of these real, verified, `sample: false` achievement/review items to their correct secondment. One known side effect: `resolveRole()` has no access to an evidence item's own client field once it's translated to employer "Accenture" for stint lookup — it disambiguates by year alone. This mislabels one real item, "Star of the Month & Client Hero" (`company: "Goldman Sachs"`, year 2018), which resolves to the Morgan Stanley stint (its year falls only in that stint's range) despite being Goldman-Sachs-attributed. Flagged in code comments in both `Explorer.jsx` (ROLES array) and `Profile.jsx` (TIMELINE array) — not fixed, since a real fix would mean changing `resolveRole()`'s signature to accept the item's actual client, which was out of scope for the change that surfaced this.

Projects (17 real): 3 under Goldman Sachs, 1 under Morgan Stanley, 13 under JP Morgan. Only 3 had real verified achievement write-ups (Corporate Actions, Control Framework, Data Science Solutions — all three flagged highlighted). The remaining 14 are placeholder/sample content — the single largest remaining task.

Reviews: currently 2, both still sample/placeholder content, surfaced in the Profile's Testimonials section as scaffolding pending real quotes.

---

## 9. Known gaps / next steps

1. Content backlog — ~14 placeholder achievement write-ups, 2 placeholder reviews, need real content.
2. Interview Mode has no backend.
3. Supabase tables are empty; no page queries Supabase yet.
4. Anchor-tag navigation should become React Router's Link component.
5. Footer stat strip on Profile is hardcoded — should compute live off evidence data once wired.
6. A couple of target-role presets return zero results against real data.
7. Responsibility is schema'd but not yet rendered anywhere in the UI.
8. CAREER_HIGHLIGHTS/TESTIMONIALS reference by title/name string matching, not stable IDs.
9. Reason-to-hire linking — deferred by design, see section 6.
10. Accenture Morgan Stanley/Goldman Sachs secondment date boundary is inferred — Ned should confirm/correct the real dates (see section 8).
11. `resolveRole()`'s year-only matching mislabels one real evidence item ("Star of the Month & Client Hero") under the wrong secondment — see section 8. Would need `resolveRole()` to accept the item's actual client to fix properly.
12. Contact Me button is a placeholder `mailto:` link — intended future behavior is a purpose-selector modal (Request CV / Discuss an opportunity / Just want to connect), not built yet.
13. LinkedIn footer link is a placeholder URL (`linkedin.com/in/PLACEHOLDER`) — Ned needs to fill in the real profile URL.