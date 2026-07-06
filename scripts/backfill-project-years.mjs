// One-time data fix, already applied — kept for reference/audit trail, not meant to run again.
// `projects.year` was added to the schema after seeding but never backfilled (the migration that moved
// year-tracking from evidence to projects dropped evidence.year without first copying a year onto
// projects). The original year values still existed in Explorer.jsx's hardcoded PROJECTS array (each
// evidence sub-item carried a `year`) — this script extracted them programmatically (same extractConst
// pattern as scripts/seed.js, no hand-retyping) and UPDATEd projects.year by matching on project name.
// For each project, used the earliest year among its evidence items (all 17 projects only had evidence
// from a single year each, so there was no actual ambiguity to resolve).
//
// ⚠ NOT RE-RUNNABLE: Explorer.jsx was later wired to query Supabase live and no longer contains a
// hardcoded PROJECTS const at all — extractConst() would now throw if this were run again. Harmless
// either way since projects.year is already backfilled; this file is kept purely as a record of what
// was done and why, same as scripts/seed.js.
//
// Was run with:
//   node --env-file=.env.local scripts/backfill-project-years.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPLORER_PATH = path.join(__dirname, "..", "src", "pages", "Explorer.jsx");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local.");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

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
const PROJECTS = extractConst(explorerSource, "PROJECTS");

async function main() {
  const yearByProjectName = new Map(
    PROJECTS.map((p) => {
      const years = p.evidence.map((e) => e.year).filter(Boolean);
      const distinctYears = [...new Set(years)];
      if (distinctYears.length > 1) {
        console.warn(`⚠ "${p.name}" has evidence spanning multiple years (${distinctYears.join(", ")}) — using earliest.`);
      }
      return [p.name, Math.min(...years)];
    })
  );

  console.log("Computed years:");
  console.table([...yearByProjectName.entries()].map(([name, year]) => ({ name, year })));

  let updated = 0;
  for (const [name, year] of yearByProjectName) {
    const { data, error } = await supabase.from("projects").update({ year }).eq("name", name).select("name, year");
    if (error) throw error;
    if (data.length === 0) console.warn(`⚠ No project row matched name "${name}" — nothing updated.`);
    else updated++;
  }
  console.log(`\nBackfilled year on ${updated}/${yearByProjectName.size} projects.`);

  const { data: check } = await supabase.from("projects").select("name, year").order("sort_order");
  console.log("\nFinal state:");
  console.table(check);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
