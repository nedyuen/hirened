import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`;
const INK = "#1C2230";
const ACCENTS = { "JP Morgan": "#1F5C56", "Goldman Sachs": "#A9803F", "Morgan Stanley": "#7A4B8C", "UBS": "#B0473C", "Accenture": "#3B5B7A" };
const TYPE_COLORS = { achievement: "#1F5C56", award: "#B8860B", review: "#6B4C8A" };
const HIGHLIGHT_COLOR = "#1E3A5F";
const CATEGORIES = ["Strategy", "Operations", "Product", "Data", "Programming", "Change", "Finance", "Management"];
const TYPES = ["achievement", "award", "review"];
const LEVELS = { company: "Company-level", role: "Role-level", project: "Project-level" };

// Saved filter presets — same names as "Roles I'm looking for" on the Profile page.
// Maintain this mapping yourself; it composes existing filters rather than adding new tags per bullet.
// Hardcoded on purpose, not migrated to Supabase — see docs/requirements.md section 6.
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

// Fetches companies/roles/projects/evidence from Supabase and assembles the same flat row shape the
// UI already expects (company, employer, jobTitle, functionalRole, project, description, bullet, detail,
// metric, title, quote, source, type, level, tags, highlighted, sort_order, placeholder). Role
// assignment now comes straight from each row's own FK (role_id, or via its project's role_id) —
// no more year/client-based resolveRole() guessing, since seeding already set these correctly once.
async function fetchExplorerData() {
  const [{ data: companiesRaw, error: companiesErr }, { data: rolesRaw, error: rolesErr },
    { data: projectsRaw, error: projectsErr }, { data: evidenceRaw, error: evidenceErr }] = await Promise.all([
    supabase.from("companies").select("*").order("sort_order"),
    supabase.from("roles").select("*").order("start_date"),
    supabase.from("projects").select("*").order("sort_order"),
    supabase.from("evidence").select("*").order("sort_order"),
  ]);
  if (companiesErr) throw companiesErr;
  if (rolesErr) throw rolesErr;
  if (projectsErr) throw projectsErr;
  if (evidenceErr) throw evidenceErr;

  const companyNameById = new Map(companiesRaw.map((c) => [c.id, c.name]));
  const roleById = new Map(rolesRaw.map((r) => [r.id, r]));

  const companies = companiesRaw.map((c) => ({ name: c.name, blurb: c.blurb }));
  const roles = rolesRaw.map((r) => ({ company: companyNameById.get(r.company_id), title: r.job_title, description: r.description }));

  const projects = projectsRaw.map((p) => {
    const role = roleById.get(p.role_id);
    const employer = companyNameById.get(role.company_id);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      detail: p.detail,
      employer,
      company: p.client_name || employer,
      functionalRole: p.functional_role,
      jobTitle: role.job_title,
      sort_order: p.sort_order,
    };
  });
  const evidenceByProjectId = new Map();
  evidenceRaw.filter((e) => e.level === "project").forEach((e) => {
    if (!evidenceByProjectId.has(e.project_id)) evidenceByProjectId.set(e.project_id, []);
    evidenceByProjectId.get(e.project_id).push(e);
  });

  const fromProjects = projects.flatMap((p) => {
    const items = evidenceByProjectId.get(p.id) || [];
    if (!items.length) {
      // No project currently has zero evidence, but preserved for when one eventually does — placeholders
      // sort last (see the `sort_order` used below) same as the old year-based sort did implicitly.
      return [{ placeholder: true, company: p.company, employer: p.employer, functionalRole: p.functionalRole,
        jobTitle: p.jobTitle, project: p.name, description: p.description, tags: [], level: "project", sort_order: Number.MAX_SAFE_INTEGER }];
    }
    return items.map((e) => ({
      type: e.type, level: e.level, title: e.title, bullet: e.bullet, metric: e.metric, quote: e.quote,
      source: e.source, detail: e.detail, highlighted: !!e.highlighted, tags: e.category_tags || [], sort_order: e.sort_order,
      company: p.company, employer: p.employer, functionalRole: p.functionalRole, jobTitle: p.jobTitle, project: p.name, description: p.description,
    }));
  });

  const fromRoles = evidenceRaw.filter((e) => e.level === "role").map((e) => {
    const role = roleById.get(e.role_id);
    const employer = companyNameById.get(role.company_id);
    return {
      type: e.type, level: e.level, title: e.title, bullet: e.bullet, metric: e.metric, quote: e.quote,
      source: e.source, detail: e.detail, highlighted: !!e.highlighted, tags: e.category_tags || [], sort_order: e.sort_order,
      company: e.client_name || employer, employer, functionalRole: null, jobTitle: role.job_title, project: null, description: null,
    };
  });

  return { companies, roles, projects, rows: [...fromProjects, ...fromRoles] };
}

function highlightMatch(text, q) {
  if (!text || !q) return text;
  const terms = q.split(/\s+/).filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!terms.length) return text;
  const parts = text.split(new RegExp(`(${terms.join("|")})`, "gi"));
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    terms.some((t) => new RegExp(`^${t}$`, "i").test(part)) ? <mark key={i} className="bg-yellow-200 rounded-sm px-0.5">{part}</mark> : part
  );
}

function TypeIcon({ type, color }) {
  const common = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "award") return (
    <svg {...common}><circle cx="12" cy="8" r="5.5" /><path d="M8.5 13 7 21l5-2.5L17 21l-1.5-8" /></svg>
  );
  if (type === "review") return (
    <svg {...common}><path d="M7 8h3v4H7c0 2.2-1 3.5-2 4" /><path d="M15 8h3v4h-3c0 2.2-1 3.5-2 4" /></svg>
  );
  return ( // achievement — target/checkmark
    <svg {...common}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.2" /></svg>
  );
}

function KpiBadge({ level }) {
  const styles = { company: "bg-black/10 text-black/60", role: "bg-black/5 text-black/50", project: "bg-black/5 text-black/40" };
  return <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${styles[level]}`}>{LEVELS[level]}</span>;
}

export default function Explorer() {
  const initial = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  // A "?preset=" link (e.g. from Profile's Roles-I'm-looking-for chips) should apply that preset's actual
  // filters on load, not just show its label — otherwise landing via that link filters nothing.
  const initialPresetName = initial.get("preset") && TARGET_ROLES[initial.get("preset")] ? initial.get("preset") : null;
  const initialPreset = initialPresetName ? TARGET_ROLES[initialPresetName] : null;
  const [selCompanies, setSelCompanies] = useState(() => initial.get("company") ? new Set([initial.get("company")]) : new Set());
  // "role" is already taken by the delivery-role filter below — job-title role uses "jobRole" + "company" to build its key.
  const [selRoles, setSelRoles] = useState(() => {
    const jobRole = initial.get("jobRole"), company = initial.get("company");
    return jobRole && company ? new Set([`${company} · ${jobRole}`]) : new Set();
  });
  const [selProjects, setSelProjects] = useState(() => initial.get("project") ? new Set([initial.get("project")]) : new Set());
  const toggleInSet = (setter) => (val) => setter((prev) => { const n = new Set(prev); n.has(val) ? n.delete(val) : n.add(val); return n; });
  const toggleCompany = toggleInSet(setSelCompanies);
  const toggleRole = toggleInSet(setSelRoles);
  const toggleProject = toggleInSet(setSelProjects);
  const [selectedDeliveryRoles, setSelectedDeliveryRoles] = useState(() => {
    if (initial.get("role")) return [initial.get("role")];
    if (initialPreset && initialPreset.deliveryRole !== "All") return [initialPreset.deliveryRole];
    return [];
  });
  const [selectedCats, setSelectedCats] = useState(initial.get("cat") ? [initial.get("cat")] : (initialPreset ? initialPreset.categories : []));
  const [selectedTypes, setSelectedTypes] = useState(initial.get("type") ? [initial.get("type")] : []);
  const [query, setQuery] = useState(initial.get("q") || "");
  const [groupBy, setGroupBy] = useState(initial.get("groupBy") || "company");
  const [expanded, setExpanded] = useState(null);
  // Tracks which projects' `detail` is expanded — shared by the group-by-project header and the
  // "Project context" box inside evidence cards, both keyed the same way as descByKey/detailByKey below.
  const [expandedProjectDetail, setExpandedProjectDetail] = useState(new Set());
  const toggleProjectDetail = (key) => setExpandedProjectDetail((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const [showPlaceholders, setShowPlaceholders] = useState(true);
  const [minTier, setMinTier] = useState(initial.get("tier") || "all"); // 'all' | 'highlighted'
  const hasIncomingFilters = ["type", "cat", "role", "tier", "preset", "company", "q", "groupBy"].some((p) => initial.get(p));
  const [filtersOpen, setFiltersOpen] = useState(!hasIncomingFilters);
  const [activePreset, setActivePreset] = useState(initialPresetName);
  const applyPreset = (name) => {
    if (activePreset === name) { setActivePreset(null); setSelectedCats([]); setSelectedDeliveryRoles([]); return; }
    const p = TARGET_ROLES[name];
    setSelectedCats(p.categories); setSelectedDeliveryRoles(p.deliveryRole === "All" ? [] : [p.deliveryRole]);
    setSelCompanies(new Set()); setSelRoles(new Set()); setSelProjects(new Set()); setSelectedTypes([]);
    setActivePreset(name);
  };

  const accent = selCompanies.size === 1 ? ACCENTS[[...selCompanies][0]] : INK;
  const toggle = (setter) => (val) => setter((s) => (s.includes(val) ? s.filter((x) => x !== val) : [...s, val]));
  const toggleCat = toggle(setSelectedCats);
  const toggleType = toggle(setSelectedTypes);
  const toggleDeliveryRole = toggle(setSelectedDeliveryRoles);

  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetchExplorerData().then((data) => {
      if (cancelled) return;
      setCompanies(data.companies); setRoles(data.roles); setProjects(data.projects); setRows(data.rows);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (r.placeholder && !showPlaceholders) return false;
      if (selCompanies.size && !selCompanies.has(r.employer)) return false;
      if (selRoles.size && !selRoles.has(`${r.employer} · ${r.jobTitle}`)) return false;
      if (selProjects.size && !(r.project && selProjects.has(r.project))) return false;
      if (selectedDeliveryRoles.length && !selectedDeliveryRoles.includes(r.functionalRole)) return false;
      if (selectedCats.length && !r.placeholder && !r.tags.some((t) => selectedCats.includes(t))) return false;
      if (selectedTypes.length && !r.placeholder && !selectedTypes.includes(r.type)) return false;
      if (minTier === "highlighted" && !r.highlighted) return false;
      if (query) {
        const hay = ((r.title || "") + (r.bullet || "") + (r.project || "") + (r.description || "") + (r.detail || "") + (r.quote || "") + r.tags.join(" ")).toLowerCase();
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    }).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [rows, selCompanies, selRoles, selProjects, selectedDeliveryRoles, selectedCats, selectedTypes, query, showPlaceholders, minTier]);

  // Delivery role is inherently open-ended (unlike Expertise's fixed 8-category taxonomy or Type's fixed
  // enum) — expected to keep growing as more of Ned's career gets logged. Derived live from whatever
  // functional_role values are actually present, not a hardcoded list that would drift behind real data.
  const deliveryRoles = useMemo(() => [...new Set(projects.map((p) => p.functionalRole).filter(Boolean))].sort(), [projects]);

  const descByKey = useMemo(() => {
    const m = new Map();
    projects.forEach((p) => m.set(`${p.company} · ${p.name}`, p.description));
    return m;
  }, [projects]);
  const detailByKey = useMemo(() => {
    const m = new Map();
    projects.forEach((p) => m.set(`${p.company} · ${p.name}`, p.detail));
    return m;
  }, [projects]);
  const roleDescByKey = useMemo(() => {
    const m = new Map();
    roles.forEach((r) => m.set(`${r.company} · ${r.title}`, r.description));
    return m;
  }, [roles]);
  const groups = useMemo(() => {
    if (groupBy === "none") return [{ key: null, items: filtered }];
    if (groupBy === "expertise") {
      const map = new Map();
      filtered.forEach((r) => {
        const tags = !r.placeholder && r.tags?.length ? r.tags : ["Unassigned"];
        tags.forEach((t, idx) => {
          if (!map.has(t)) map.set(t, []);
          map.get(t).push(idx === 0 ? r : { ...r, stub: true, primaryTag: tags[0] });
        });
      });
      return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([key, items]) => ({ key, items }));
    }
    const keyFn = groupBy === "company" ? (r) => r.employer : groupBy === "role" ? (r) => `${r.employer} · ${r.jobTitle}` : groupBy === "delivery" ? (r) => r.functionalRole || "Role-level (no project)" : groupBy === "project" ? (r) => `${r.company} · ${r.project || "General"}` : (r) => r.placeholder ? "placeholder" : r.type;
    const map = new Map();
    filtered.forEach((r) => { const k = keyFn(r); if (!map.has(k)) map.set(k, []); map.get(k).push(r); });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([key, items]) => ({ key, items }));
  }, [filtered, groupBy]);

  const activeFilters = useMemo(() => {
    const f = [];
    selCompanies.forEach((c) => f.push({ label: `Company: ${c}`, clear: () => toggleCompany(c), color: accent }));
    selRoles.forEach((r) => f.push({ label: `Role: ${r.split(" · ")[1]}`, clear: () => toggleRole(r), color: accent }));
    selProjects.forEach((p) => f.push({ label: `Project: ${p}`, clear: () => toggleProject(p), color: accent }));
    selectedDeliveryRoles.forEach((r) => f.push({ label: `Delivery: ${r}`, clear: () => toggleDeliveryRole(r), color: accent }));
    selectedCats.forEach((c) => f.push({ label: `Expertise: ${c}`, clear: () => toggleCat(c), color: accent }));
    selectedTypes.forEach((t) => f.push({ label: `Type: ${t}`, clear: () => toggleType(t), color: TYPE_COLORS[t] }));
    if (minTier === "highlighted") f.push({ label: "◆ Highlighted only", clear: () => setMinTier("all"), color: HIGHLIGHT_COLOR });
    if (activePreset) f.push({ label: `Preset: ${activePreset}`, clear: () => applyPreset(activePreset), color: accent });
    if (query) f.push({ label: `Search: "${query}"`, clear: () => setQuery(""), color: accent });
    return f;
  }, [selCompanies, selRoles, selProjects, selectedDeliveryRoles, selectedCats, selectedTypes, minTier, activePreset, query, accent]);
  const clearAllFilters = () => {
    setSelCompanies(new Set()); setSelRoles(new Set()); setSelProjects(new Set()); setSelectedDeliveryRoles([]);
    setSelectedCats([]); setSelectedTypes([]); setMinTier("all"); setActivePreset(null); setQuery("");
  };

  return (
    <div className="min-h-screen bg-[#F2F3EF] text-ink font-body">
      <style>{`
        ${FONT_IMPORT}
        .text-ink { color:${INK}; }
        .font-display { font-family:'Space Grotesk', sans-serif; }
        .font-body { font-family:'Inter', sans-serif; }
        .font-mono { font-family:'IBM Plex Mono', monospace; }
      `}</style>

      <div className="sticky top-0 z-20 backdrop-blur bg-[#F2F3EF]/90 border-b border-black/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-display font-semibold tracking-tight">Ned Yuen</a>
          <div className="flex items-center gap-2">
            <a href="/" className="font-mono text-xs px-3 py-1.5 rounded-full border border-black/15 text-black/60 hover:border-black/30">Career Profile</a>
            <span className="font-mono text-xs px-3 py-1.5 rounded-full text-white" style={{ background: "#1F5C56" }}>Achievement Explorer</span>
            <a href="/interview" className="font-mono text-xs px-3 py-1.5 rounded-full border border-black/15 text-black/60 hover:border-black/30">Interview Mode</a>
          </div>
        </div>
      </div>

      <header className="max-w-6xl mx-auto px-6 pt-10 pb-4">
        <div className="font-mono text-xs uppercase tracking-widest text-black/40 mb-2">Achievement Explorer</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold">Evidence, tagged and levelled</h1>
        <p className="text-sm text-black/50 mt-2 max-w-2xl">
          Every card is an <b>achievement</b>, <b>award</b> or <b>review</b>, tagged to a level — company, role, or a specific project —
          so a firm-wide award never looks like it was earned for one deliverable.
        </p>
      </header>

      {loading ? (
        <div className="max-w-6xl mx-auto px-6 py-16 text-center text-sm text-black/40 font-mono">Loading evidence…</div>
      ) : (
      <>
      <div className="max-w-6xl mx-auto px-6 my-6">
        <div className="bg-white rounded-xl border border-black/10 p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setFiltersOpen((v) => !v)} className="flex items-center gap-1.5 font-mono text-[10px] text-black/40 uppercase hover:text-black/70">
              {filtersOpen ? "▾" : "▸"} Filters {!filtersOpen && activeFilters.length > 0 && <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.5 rounded-full normal-case">{activeFilters.length} active</span>}
            </button>
            {activeFilters.length > 0 && (
              <button onClick={clearAllFilters} className="text-[11px] font-mono text-black/40 hover:text-black/70">Clear all ×</button>
            )}
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4 pb-4 border-b border-black/10">
              {activeFilters.map((f) => (
                <button key={f.label} onClick={f.clear}
                  className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full text-white" style={{ background: f.color }}>
                  {f.label} <span className="opacity-70">×</span>
                </button>
              ))}
            </div>
          )}

          {filtersOpen && (
          <>
          <div className="space-y-4">
            <div>
              <span className="font-mono text-[10px] text-black/40 uppercase block mb-2">Company — employer</span>
              <div className="flex gap-2 flex-wrap">
                {companies.map((c) => {
                  const on = selCompanies.has(c.name);
                  return (
                    <button key={c.name} onClick={() => toggleCompany(c.name)} title={c.blurb}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono border ${on ? "text-white border-transparent" : "border-black/15 text-black/50"}`}
                      style={on ? { background: ACCENTS[c.name] } : {}}>{c.name}</button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="font-mono text-[10px] text-black/40 uppercase block mb-2">Role — job title held at that company</span>
              <div className="flex gap-2 flex-wrap">
                {roles.map((r) => {
                  const key = `${r.company} · ${r.title}`;
                  const on = selRoles.has(key);
                  return (
                    <button key={key} onClick={() => toggleRole(key)} title={r.description}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono border ${on ? "text-white border-transparent" : "border-black/15 text-black/50"}`}
                      style={on ? { background: ACCENTS[r.company] } : {}}>{r.title}</button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="font-mono text-[10px] text-black/40 uppercase block mb-2">Project — specific piece of delivery work</span>
              <div className="flex gap-2 flex-wrap">
                {projects.map((p) => {
                  const on = selProjects.has(p.name);
                  const clientTag = p.company !== p.employer ? ` (${p.company.split(" ")[0]})` : "";
                  return (
                    <button key={p.name} onClick={() => toggleProject(p.name)} title={p.description}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono border ${on ? "text-white border-transparent" : "border-black/15 text-black/50"}`}
                      style={on ? { background: ACCENTS[p.employer] } : {}}>{p.name}{clientTag}</button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-black/10 pt-4">
              <span className="font-mono text-[10px] text-black/40 uppercase block mb-2">Delivery role — what hat, on that project (distinct from job title)</span>
              <div className="flex gap-2 flex-wrap">
                {deliveryRoles.map((r) => {
                  const on = selectedDeliveryRoles.includes(r);
                  return (
                    <button key={r} onClick={() => toggleDeliveryRole(r)}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono border ${on ? "text-white border-transparent" : "border-black/15 text-black/50"}`}
                      style={on ? { background: accent } : {}}>{r}</button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="font-mono text-[10px] text-black/40 uppercase block mb-2">Expertise — what discipline</span>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((c) => {
                  const on = selectedCats.includes(c);
                  return <button key={c} onClick={() => toggleCat(c)}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono border ${on ? "text-white border-transparent" : "border-black/15 text-black/50"}`}
                    style={on ? { background: accent } : {}}>{c}</button>;
                })}
              </div>
            </div>

            <div>
              <span className="font-mono text-[10px] text-black/40 uppercase block mb-2">Type — what kind of claim</span>
              <div className="flex gap-2 flex-wrap items-center">
                {TYPES.map((t) => {
                  const on = selectedTypes.includes(t);
                  return (
                    <button key={t} onClick={() => toggleType(t)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border capitalize ${on ? "text-white border-transparent" : "border-black/15 text-black/50"}`}
                      style={on ? { background: TYPE_COLORS[t] } : { borderColor: TYPE_COLORS[t], color: TYPE_COLORS[t] }}>
                      <TypeIcon type={t} color={on ? "#fff" : TYPE_COLORS[t]} />{t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="font-mono text-[10px] text-black/40 uppercase block mb-2">Impact</span>
              <button onClick={() => setMinTier(minTier === "highlighted" ? "all" : "highlighted")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border ${minTier === "highlighted" ? "text-white border-transparent" : "border-black/15 text-black/50"}`}
                style={minTier === "highlighted" ? { background: HIGHLIGHT_COLOR } : {}}>
                ◆ Highlighted only
              </button>
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mb-6">
        <div className="bg-white rounded-xl border border-black/10 p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-black/40 uppercase">Applying to a specific role? Jump straight to relevant evidence</span>
            {activePreset && <button onClick={() => applyPreset(activePreset)} className="text-[11px] font-mono text-black/40 hover:text-black/70">Clear preset ×</button>}
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(TARGET_ROLES).map((name) => {
              const on = activePreset === name;
              return (
                <button key={name} onClick={() => applyPreset(name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono border ${on ? "text-white border-transparent" : "border-black/15 text-black/50 hover:border-black/30"}`}
                  style={on ? { background: INK } : {}}>
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 pb-16">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search everything — bullets, quotes, full write-ups…"
          className="border border-black/15 rounded-lg px-3 py-2 text-sm w-full bg-white mb-3" />

        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-black/40 uppercase">Group by</span>
            {["company", "role", "project", "delivery", "expertise", "type", "none"].map((g) => (
              <button key={g} onClick={() => setGroupBy(g)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono ${groupBy === g ? "bg-black/10 font-medium" : "text-black/40 hover:text-black/70"}`}>
                {g === "none" ? "Flat" : g === "delivery" ? "delivery role" : g}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-black/50 font-mono md:ml-auto cursor-pointer">
            <input type="checkbox" checked={showPlaceholders} onChange={(e) => setShowPlaceholders(e.target.checked)} />
            Show empty projects ({rows.filter((r) => r.placeholder).length})
          </label>
        </div>

        {groups.map((grp) => (
          <div key={grp.key ?? "flat"} className="mb-8">
            {grp.key && (
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <div className="font-mono text-xs uppercase tracking-widest text-black/50">{grp.key}</div>
                  <div className="h-px flex-1 bg-black/10" />
                  <div className="font-mono text-[10px] text-black/30">{grp.items.length}</div>
                </div>
                {groupBy === "company" && companies.find((c) => c.name === grp.key) && (
                  <p className="text-xs text-black/40 mt-1 max-w-2xl">{companies.find((c) => c.name === grp.key).blurb}</p>
                )}
                {groupBy === "project" && descByKey.get(grp.key) && (
                  <div className="mt-1 max-w-2xl">
                    <p className="text-xs text-black/40">{descByKey.get(grp.key)}</p>
                    {detailByKey.get(grp.key) && (
                      <button onClick={() => toggleProjectDetail(grp.key)} className="font-mono text-[10px] text-black/40 hover:text-black/70 mt-1">
                        {expandedProjectDetail.has(grp.key) ? "collapse ↑" : "expand ↓"}
                      </button>
                    )}
                    {expandedProjectDetail.has(grp.key) && detailByKey.get(grp.key) && (
                      <p className="text-xs text-black/50 mt-1 leading-relaxed">{detailByKey.get(grp.key)}</p>
                    )}
                  </div>
                )}
                {groupBy === "role" && roleDescByKey.get(grp.key) && (
                  <p className="text-xs text-black/40 mt-1 max-w-2xl">{roleDescByKey.get(grp.key)}</p>
                )}
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {grp.items.map((r, i) => {
                if (r.stub) {
                  const sAccent = ACCENTS[r.company];
                  return (
                    <button key={i} onClick={() => { setGroupBy("expertise"); setExpanded(`${r.company}-${r.project}-${r.title}`); }}
                      className="text-left flex items-center gap-2 bg-white/50 border border-dashed border-black/15 rounded-lg px-3 py-2 text-xs text-black/50 hover:text-black/80 hover:border-black/30">
                      <TypeIcon type={r.type} color={sAccent} />
                      <span className="truncate">{r.title}</span>
                      <span className="ml-auto font-mono text-[10px] shrink-0">→ see under {r.primaryTag}</span>
                    </button>
                  );
                }
                const id = `${r.company}-${r.project}-${r.title || "placeholder"}`;
                const isOpen = expanded === id;
                const cAccent = ACCENTS[r.company];
                return (
                  <div key={i} onClick={() => !r.placeholder && setExpanded(isOpen ? null : id)}
                    className={`bg-white rounded-xl border-l-4 border p-4 transition-colors relative ${r.placeholder ? "border-dashed border-black/20 opacity-70" : "border-black/10 cursor-pointer hover:border-black/25"}`}
                    style={!r.placeholder ? { borderLeftColor: TYPE_COLORS[r.type] } : {}}>
                    {r.highlighted && !r.placeholder && (
                      <span className="absolute -top-2 right-3 text-[9px] font-mono px-1.5 py-0.5 rounded text-white flex items-center gap-1" style={{ background: HIGHLIGHT_COLOR }}>
                        ◆ Highlighted
                      </span>
                    )}
                    <div className="flex items-start gap-2">
                      {!r.placeholder && <span className="shrink-0 mt-0.5"><TypeIcon type={r.type} color={TYPE_COLORS[r.type]} /></span>}
                      <div className="font-display font-semibold text-sm leading-snug">{r.placeholder ? r.project : highlightMatch(r.title, query)}</div>
                      {!r.placeholder && <span className="font-mono text-[9px] uppercase tracking-wide shrink-0 px-1.5 py-0.5 rounded" style={{ color: TYPE_COLORS[r.type], background: `${TYPE_COLORS[r.type]}18` }}>{r.type}</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="font-mono text-[10px] text-black/40">{r.company} · {r.jobTitle}{r.project ? ` · ${r.project}` : ""}</span>
                      {!r.placeholder && <KpiBadge level={r.level} />}
                    </div>
                    {r.placeholder && <p className="text-xs text-black/60 mt-2 leading-relaxed">{r.description}</p>}
                    {r.type === "review" && !r.placeholder && (
                      <div className="mt-2 pl-3 border-l-2 rounded-r-md py-1.5" style={{ borderColor: TYPE_COLORS.review, background: `${TYPE_COLORS.review}0d` }}>
                        <p className="text-xs italic text-black/70 leading-relaxed">"{highlightMatch(r.quote, query)}"</p>
                        <span className="block text-[10px] text-black/40 mt-1 font-mono not-italic">— {r.source}</span>
                      </div>
                    )}
                    {r.type !== "review" && !r.placeholder && <p className="text-xs text-black/60 mt-2 leading-relaxed">{highlightMatch(r.bullet, query)}</p>}
                    {r.placeholder && <div className="text-[10px] font-mono text-black/30 mt-2">— no evidence logged yet —</div>}
                    {!r.placeholder && (
                      <div className="flex gap-1.5 mt-3 flex-wrap items-center">
                        {r.tags.map((t) => <span key={t} className="text-[10px] font-mono bg-black/5 px-2 py-0.5 rounded">{t}</span>)}
                      </div>
                    )}
                    {isOpen && r.detail && (
                      <div className="mt-3 pt-3 border-t border-black/10 text-xs text-black/70 leading-relaxed space-y-2">
                        <div>{highlightMatch(r.detail, query)}</div>
                        {r.description && groupBy !== "project" && (() => {
                          const pKey = `${r.company} · ${r.project}`;
                          const pDetail = detailByKey.get(pKey);
                          const pDetailOpen = expandedProjectDetail.has(pKey);
                          return (
                            <div className="bg-black/5 rounded-lg p-2.5 text-black/50">
                              <span className="font-mono text-[9px] uppercase tracking-wide block mb-1">Project context — {r.project}</span>
                              {r.description}
                              {pDetail && (
                                <button onClick={(e) => { e.stopPropagation(); toggleProjectDetail(pKey); }}
                                  className="block font-mono text-[9px] text-black/40 hover:text-black/70 mt-1.5">
                                  {pDetailOpen ? "collapse ↑" : "expand ↓"}
                                </button>
                              )}
                              {pDetailOpen && pDetail && <div className="mt-1.5 leading-relaxed">{pDetail}</div>}
                            </div>
                          );
                        })()}
                        <div className="font-mono text-[10px]" style={{ color: cAccent }}>collapse ↑</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-sm text-black/40 py-8 text-center">No results match these filters.</div>}
      </main>
      </>
      )}
    </div>
  );
}
