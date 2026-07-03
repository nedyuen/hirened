-- HireNed.Now / future SaaS data model
-- Designed so "single user site" and "multi-tenant SaaS" are the same schema.
-- Every content table carries owner_id from day one; RLS makes it safe to open signups later.
--
-- Company = employer (UBS, Accenture, JP Morgan), never a client. A project's client
-- (e.g. Goldman Sachs during an Accenture secondment) is descriptive text, not a
-- foreign-keyed company row — clients aren't companies you worked FOR.

create table profiles (
  id uuid primary key references auth.users(id) default auth.uid(),
  slug text unique not null,              -- e.g. 'ned-yuen' -> hirened.now or platform.com/ned-yuen
  full_name text not null,
  tagline text,
  summary text,
  headshot_url text,
  created_at timestamptz default now()
);

create table audiences (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  key text not null,                      -- 'tech' | 'banking' | 'both' (extensible per-user)
  label text not null,
  accent_color text
);

create table companies (              -- employers only
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  name text not null,
  blurb text,
  sort_order int default 0
);

create table roles (              -- a job stint: "Transformation VP at JP Morgan, 2021-present"
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  company_id uuid references companies(id) not null,
  job_title text not null,
  description text,
  start_date date,
  end_date date                   -- null = current
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  role_id uuid references roles(id) not null,          -- the job stint it was delivered under (= employer, via roles.company_id)
  client_name text,               -- descriptive only, e.g. 'Goldman Sachs' — not a companies FK
  functional_role text,           -- e.g. 'Product Manager' — this project's specific hat, may differ from job_title
  name text not null,
  goal text,                      -- factual description: what the project is/was. Not an achievement.
  sort_order int default 0
);

create table responsibilities (   -- a task/scope owned within a project. Sibling to evidence, not its parent.
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  project_id uuid references projects(id) not null,
  description text not null,
  sort_order int default 0
);

-- The core table: every achievement, award, and review lives here, typed and levelled.
create table evidence (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) not null,
  type text not null check (type in ('achievement', 'award', 'review')),
  level text not null check (level in ('company', 'role', 'project')),
  role_id uuid references roles(id),                    -- required if level in ('role','project'); gives employer via roles.company_id
  project_id uuid references projects(id),               -- required if level = 'project'
  related_project_id uuid references projects(id),       -- optional: award/review mentions a project without belonging to it
  related_responsibility_ids uuid[] default '{}',        -- optional many-to-many link to responsibilities; not ownership
  client_name text,               -- descriptive only, for role-level evidence naming a client (e.g. a GS-specific award)
  title text not null,
  bullet text,                    -- short, scannable one-sentence claim shown on the card
  metric text,                    -- short headline stat, e.g. '37 systems retired'
  quote text,                     -- for type = 'review'
  source text,                    -- who said it, for type = 'review'
  detail text,                    -- full write-up, additive to bullet (not a repeat of it), searchable
  year int,
  is_sample boolean default false,   -- placeholder content flag
  highlighted boolean default false, -- small curated set surfaced as standout evidence; keep this rare
  audience_tags text[] default '{both}',
  category_tags text[] default '{}',  -- from the fixed 8-category enum (Strategy, Operations, Product, Data, Programming, Change, Finance, Management)
  sort_order int default 0
);

-- Row Level Security
alter table profiles enable row level security;
alter table audiences enable row level security;
alter table companies enable row level security;
alter table roles enable row level security;
alter table projects enable row level security;
alter table responsibilities enable row level security;
alter table evidence enable row level security;

create policy "public read profiles" on profiles for select using (true);
create policy "owner writes profiles" on profiles for all using (auth.uid() = id);
create policy "public read audiences" on audiences for select using (true);
create policy "owner writes audiences" on audiences for all using (auth.uid() = owner_id);
create policy "public read companies" on companies for select using (true);
create policy "owner writes companies" on companies for all using (auth.uid() = owner_id);
create policy "public read roles" on roles for select using (true);
create policy "owner writes roles" on roles for all using (auth.uid() = owner_id);
create policy "public read projects" on projects for select using (true);
create policy "owner writes projects" on projects for all using (auth.uid() = owner_id);
create policy "public read responsibilities" on responsibilities for select using (true);
create policy "owner writes responsibilities" on responsibilities for all using (auth.uid() = owner_id);
create policy "public read evidence" on evidence for select using (true);
create policy "owner writes evidence" on evidence for all using (auth.uid() = owner_id);
