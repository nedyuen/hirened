// One-off seeding script for the live "Hire Ned" Supabase project. Already run successfully once —
// Supabase now holds the real data (see CLAUDE.md's Current State).
//
// ⚠ NO LONGER RE-RUNNABLE AS-IS: this script reads COMPANIES/ROLES/PROJECTS/ROLE_EVIDENCE directly out
// of src/pages/Explorer.jsx's source text via extractConst(). Explorer.jsx was later wired to query
// Supabase live (see CLAUDE.md) and no longer contains those hardcoded consts at all — extractConst()
// will now throw `Could not find "const ROLES = "` (etc.) if this script is run again. If you ever need
// to reseed from scratch, either restore a hardcoded-data version of Explorer.jsx temporarily, or rework
// this script to read from a static JSON/JS snapshot of the seed data instead of parsing a page component.
//
// Requires SUPABASE_URL (or VITE_SUPABASE_URL, non-secret) and SUPABASE_SERVICE_ROLE_KEY in the
// environment. Never commit the service_role key; keep it in .env.local (gitignored), never
// VITE_-prefixed (that would ship it to the browser bundle).
//
// Run with:
//   node --env-file=.env.local scripts/seed.js

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPLORER_PATH = path.join(__dirname, "..", "src", "pages", "Explorer.jsx");
const PROFILE_PATH = path.join(__dirname, "..", "src", "pages", "Profile.jsx");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n" +
    "Add them to .env.local (gitignored) and run with:\n  node --env-file=.env.local scripts/seed.js"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Extract a top-level `const NAME = [...]` / `const NAME = {...}` literal directly out of a
// source file's text, without executing the rest of the file (which contains JSX Node can't parse).
// Bracket-depth counting is string-aware so brackets inside string literals don't throw off matching.
function extractConst(source, name) {
  const marker = `const ${name} = `;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Could not find "${marker}"`);
  let i = start + marker.length;
  const open = source[i];
  const close = open === "[" ? "]" : "}";
  let depth = 0, inStr = null;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (inStr) {
      if (ch === "\\") { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
    if (ch === open) depth++;
    else if (ch === close) { depth--; if (depth === 0) { i++; break; } }
  }
  return new Function(`return (${source.slice(start + marker.length, i)});`)();
}

const explorerSource = readFileSync(EXPLORER_PATH, "utf8");
const profileSource = readFileSync(PROFILE_PATH, "utf8");
const COMPANIES = extractConst(explorerSource, "COMPANIES");
const ROLES = extractConst(explorerSource, "ROLES");
const PROJECTS = extractConst(explorerSource, "PROJECTS");
const ROLE_EVIDENCE = extractConst(explorerSource, "ROLE_EVIDENCE");
const SUMMARY = extractConst(profileSource, "SUMMARY");
console.log(
  `Extracted from Explorer.jsx: ${COMPANIES.length} companies, ${ROLES.length} roles, ` +
  `${PROJECTS.length} projects, ${ROLE_EVIDENCE.length} role-level evidence.`
);

// --- fractional-year -> date, matching ROLES' start/end convention (e.g. 2017.83 ≈ Nov 2017) ---
function fractionalYearToDate(fy) {
  const year = Math.floor(fy);
  const month = Math.round((fy - year) * 12); // 0-11
  return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
}

// --- resolveRole, mirroring Explorer.jsx's (now-fixed) logic: client match first, year-range fallback ---
const STINT_EMPLOYER = { UBS: "UBS", Accenture: "Accenture", "Goldman Sachs": "Accenture", "Morgan Stanley": "Accenture", "JP Morgan": "JP Morgan" };
function resolveRole(company, year) {
  const employer = STINT_EMPLOYER[company] || company;
  const stints = ROLES.filter((r) => r.company === employer);
  const byClient = stints.find((r) => r.client === company);
  if (byClient) return byClient;
  return stints.find((r) => year >= Math.floor(r.start) && year <= Math.ceil(r.end)) || stints[stints.length - 1];
}

async function ensureAuthUser(email) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  const found = data.users.find((u) => u.email === email);
  if (found) return found;
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email, email_confirm: true, password: randomUUID(),
  });
  if (createErr) throw createErr;
  return created.user;
}

async function main() {
  console.log("\nEnsuring auth user + profile for Ned...");
  const user = await ensureAuthUser("nedyuen@gmail.com");
  const ownerId = user.id;

  const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", ownerId).maybeSingle();
  if (!existingProfile) {
    const { error } = await supabase.from("profiles").insert({
      id: ownerId,
      slug: "ned-yuen",
      full_name: "Ned Yuen",
      tagline: "Senior Strategy & Transformation Lead, 13 years inside Capital Markets.",
      summary: SUMMARY.join("\n\n"),
    });
    if (error) throw error;
    console.log("Created profiles row.");
  } else {
    console.log("profiles row already exists, reusing it.");
  }

  const { count: existingCompanies } = await supabase
    .from("companies").select("id", { count: "exact", head: true }).eq("owner_id", ownerId);
  if (existingCompanies > 0) {
    console.error(
      `companies already has ${existingCompanies} row(s) for this owner — aborting to avoid duplicate ` +
      `seeding. Truncate companies/roles/projects/evidence for this owner first if you want to reseed.`
    );
    process.exit(1);
  }

  // --- companies ---
  const companiesRows = COMPANIES.map((c, i) => ({ owner_id: ownerId, name: c.name, blurb: c.blurb, sort_order: i }));
  const { data: insertedCompanies, error: companiesErr } = await supabase.from("companies").insert(companiesRows).select();
  if (companiesErr) throw companiesErr;
  // Key lookups by sort_order (preserved data), not array position — Postgres doesn't guarantee
  // multi-row INSERT...RETURNING order matches input order.
  const companyIdBySortOrder = new Map(insertedCompanies.map((c) => [c.sort_order, c.id]));
  const companyIdByName = new Map(COMPANIES.map((c, i) => [c.name, companyIdBySortOrder.get(i)]));
  console.log(`Inserted ${insertedCompanies.length} companies.`);

  // --- roles --- (no sort_order column on this table, unlike companies/projects/evidence)
  const maxStart = Math.max(...ROLES.map((r) => r.start));
  const rolesRows = ROLES.map((r) => ({
    owner_id: ownerId,
    company_id: companyIdByName.get(r.company),
    job_title: r.title,
    description: r.description,
    start_date: fractionalYearToDate(r.start),
    // The role with the latest start is the current one ("...–Present" everywhere else in the app) —
    // its `end` value (e.g. 2026.5) is just a far-future placeholder, not a real end date to preserve.
    end_date: r.start === maxStart ? null : fractionalYearToDate(r.end),
  }));
  const { data: insertedRoles, error: rolesErr } = await supabase.from("roles").insert(rolesRows).select();
  if (rolesErr) throw rolesErr;
  // Key by (company_id, job_title) from the returned rows — both are unique together here, and this
  // doesn't depend on insert order being preserved in the RETURNING result set.
  const roleIdByKey = new Map(insertedRoles.map((r) => [`${r.company_id}·${r.job_title}`, r.id]));
  const roleIdForStint = (stint) => roleIdByKey.get(`${companyIdByName.get(stint.company)}·${stint.title}`);
  console.log(`Inserted ${insertedRoles.length} roles.`);

  // --- projects ---
  const projectsRows = PROJECTS.map((p, i) => {
    const stint = resolveRole(p.company, p.evidence[0]?.year || 2023);
    return {
      owner_id: ownerId,
      role_id: roleIdForStint(stint),
      client_name: p.company !== p.employer ? p.company : null,
      functional_role: p.role,
      name: p.name,
      goal: p.goal,
      sort_order: i,
    };
  });
  const { data: insertedProjects, error: projectsErr } = await supabase.from("projects").insert(projectsRows).select();
  if (projectsErr) throw projectsErr;
  const projectIdBySortOrder = new Map(insertedProjects.map((p) => [p.sort_order, p.id]));
  const projectIdByName = new Map(PROJECTS.map((p, i) => [p.name, projectIdBySortOrder.get(i)]));
  console.log(`Inserted ${insertedProjects.length} projects.`);

  // --- evidence: from PROJECTS[].evidence[] (project- or role-level) + ROLE_EVIDENCE (role-level) ---
  const evidenceRows = [];
  let sortOrder = 0;
  const toEvidenceRow = (e, { company, employer, projectName }) => {
    const stint = resolveRole(company, e.year || (projectName ? 2023 : 2020));
    const isProjectLevel = e.level === "project";
    return {
      owner_id: ownerId,
      type: e.type,
      level: e.level,
      role_id: isProjectLevel ? null : roleIdForStint(stint),
      project_id: isProjectLevel ? projectIdByName.get(projectName) : null,
      related_project_id: e.relatedProject ? projectIdByName.get(e.relatedProject) : null,
      client_name: company !== employer ? company : null,
      title: e.title,
      bullet: e.bullet ?? null,
      metric: e.metric ?? null,
      quote: e.quote ?? null,
      source: e.source ?? null,
      detail: e.detail ?? null,
      year: e.year ?? null,
      is_sample: !!e.sample,
      highlighted: !!e.highlighted,
      audience_tags: e.audience,
      category_tags: e.tags,
      sort_order: sortOrder++,
    };
  };
  PROJECTS.forEach((p) => {
    p.evidence.forEach((e) => {
      evidenceRows.push(toEvidenceRow(e, { company: p.company, employer: p.employer, projectName: p.name }));
    });
  });
  ROLE_EVIDENCE.forEach((e) => {
    evidenceRows.push(toEvidenceRow(e, { company: e.company, employer: e.employer, projectName: null }));
  });

  const missingRole = evidenceRows.find((r) => r.level === "role" && !r.role_id);
  const missingProject = evidenceRows.find((r) => r.level === "project" && !r.project_id);
  if (missingRole || missingProject) {
    console.error("Some evidence rows failed to resolve a role_id/project_id:", missingRole || missingProject);
    process.exit(1);
  }

  const { data: insertedEvidence, error: evidenceErr } = await supabase.from("evidence").insert(evidenceRows).select();
  if (evidenceErr) throw evidenceErr;
  console.log(`Inserted ${insertedEvidence.length} evidence rows.`);

  console.log("\nSeed complete. Row counts:");
  console.table({
    profiles: { rows: 1 },
    companies: { rows: insertedCompanies.length },
    roles: { rows: insertedRoles.length },
    projects: { rows: insertedProjects.length },
    evidence: { rows: insertedEvidence.length },
    responsibilities: { rows: 0 },
    audiences: { rows: 0 },
  });
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
