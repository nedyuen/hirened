import { useState, useMemo } from "react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`;
const INK = "#1C2230";
const ACCENTS = { "JP Morgan": "#1F5C56", "Goldman Sachs": "#A9803F", "Morgan Stanley": "#7A4B8C", "UBS": "#B0473C", "Accenture": "#3B5B7A" };
const TYPE_COLORS = { achievement: "#1F5C56", award: "#B8860B", review: "#6B4C8A" };
const HIGHLIGHT_COLOR = "#1E3A5F";
const CATEGORIES = ["Strategy", "Operations", "Product", "Data", "Programming", "Change", "Finance", "Management"];
const FUNC_ROLES = ["Transformation Lead", "Product Manager", "Project Manager", "Program Manager", "Business Analyst"];
const TYPES = ["achievement", "award", "review"];
const LEVELS = { company: "Company-level", role: "Role-level", project: "Project-level" };

// Job stints — the actual "Role" level in Company → Role → Project → Evidence.
// Distinct from a project's functional/delivery role (Product Manager, Business Analyst, etc).
const ROLES = [
  { company: "UBS", title: "Operations Analyst", start: 2012.42, end: 2016.33,
    description: "Rotated across Rates MO Risk Control, Trade Control, Desk Services, OTC Confirmations, and ETD Regulatory Reporting." },
  { company: "UBS", title: "Sales Associate", start: 2016.33, end: 2017.83,
    description: "Moved to Front Office on the Flow Rates hedge fund desk and LDI desk, pricing and executing OTC trades for clients." },
  { company: "Accenture", title: "Consulting Manager", start: 2017.83, end: 2021.58,
    description: "Seconded into Morgan Stanley and Goldman Sachs as Business Analyst and Project Manager on trade reporting and platform delivery programs." },
  { company: "JP Morgan", title: "Transformation Vice President", start: 2021.67, end: 2026.5,
    description: "Led Securities Ops Transformation, then Markets Ops Platform Transformation, then Markets Regulatory Control Transformation." },
];
// Client-facing projects (Goldman Sachs, Morgan Stanley) were delivered under the Accenture stint.
const STINT_EMPLOYER = { "UBS": "UBS", "Accenture": "Accenture", "Goldman Sachs": "Accenture", "Morgan Stanley": "Accenture", "JP Morgan": "JP Morgan" };
function resolveRole(company, year) {
  const employer = STINT_EMPLOYER[company] || company;
  const stints = ROLES.filter((r) => r.company === employer);
  return stints.find((r) => year >= Math.floor(r.start) && year <= Math.ceil(r.end)) || stints[stints.length - 1];
}

const COMPANIES = [
  { name: "UBS", years: "2012–2017", blurb: "Investment bank — Operations Analyst then Sales Associate, across Rates, Confirmations and Regulatory Reporting." },
  { name: "Accenture", years: "2017–2021", blurb: "Global consultancy — seconded into Morgan Stanley and Goldman Sachs as Business Analyst and Project Manager." },
  { name: "JP Morgan", years: "2021–Present", blurb: "Transformation VP — Securities Ops, Markets Ops Platform, and Regulatory Control transformation." },
];

// Real projects from the Business Projects Notion database.
// achievement/award/review items marked sample:true are placeholders for Ned to replace.
const PROJECTS = [
  { company: "Goldman Sachs", employer: "Accenture", role: "Project Manager", name: "Corporate Actions", goal: "Building a one-stop-shop platform and UI for corporate actions processing.",
    evidence: [
      { type: "achievement", level: "project", title: "One-stop-shop trade processing platform", bullet: "Delivered a one-stop-shop trade processing platform, displacing 37 legacy systems across desks.", metric: "37 systems retired", tags: ["Product", "Strategy", "Operations"], audience: ["tech", "both"], year: 2019, sample: false, highlighted: true,
        detail: "Coordinated Operations, Technology and the client across a multi-quarter migration, sequencing the cutover desk by desk so live corporate actions processing was never disrupted. The resulting platform became the standard entry point for the function." },
    ]},
  { company: "Goldman Sachs", employer: "Accenture", role: "Project Manager", name: "Matching, Shaping and Allocation", goal: "Building a low-latency platform for matching, shaping, and allocation.",
    evidence: [
      { type: "achievement", level: "project", title: "Cut allocation processing latency", bullet: "Re-architected the matching and allocation pipeline, cutting end-to-end latency by 60%.", metric: "-60% latency", tags: ["Product", "Programming", "Operations"], audience: ["tech"], year: 2019, sample: true,
        detail: "[SAMPLE] Redesigned the underlying data flow to remove sequential batch steps, enabling same-day matching for high-volume equity flow that had previously required next-day processing." },
    ]},
  { company: "Goldman Sachs", employer: "Accenture", role: "Project Manager", name: "Booking and Control", goal: "Building workflow tools and a UI for trade expiries processing and booking controls.",
    evidence: [
      { type: "achievement", level: "project", title: "Automated trade expiry tracking", bullet: "Automated trade expiry and booking control checks, freeing up roughly 15 hours per week.", metric: "-15 hrs/week", tags: ["Operations", "Programming"], audience: ["tech", "banking"], year: 2019, sample: true,
        detail: "[SAMPLE] Replaced a manual end-of-day expiry review with a rules-based workflow tool, reallocating the desk's time from checking to exception handling only." },
    ]},
  { company: "Morgan Stanley", employer: "Accenture", role: "Business Analyst", name: "Control Framework", goal: "Implementing a front-to-back reconciliation and control framework for trade reporting.",
    evidence: [
      { type: "achievement", level: "project", title: "Trade reporting control framework", bullet: "Designed and implemented a front-to-back reconciliation and control framework for trade reporting.", metric: "Data integrity", tags: ["Operations", "Finance"], audience: ["banking", "both"], year: 2018, sample: false,
        detail: "Closed a gap where breaks were only caught after regulatory submission, by introducing pre-submission control checkpoints across the reporting pipeline." },
      { type: "review", level: "project", title: "Client feedback", quote: "The control framework Ned designed is still how we catch breaks before they become reportable issues.", source: "VP, Morgan Stanley Operations", tags: ["Operations"], audience: ["banking"], year: 2018, sample: true, detail: null },
    ]},
  { company: "JP Morgan", employer: "JP Morgan", role: "Transformation Lead", name: "PMO Governance", goal: "Streamlining the centralised program governance framework through data and tooling uplift.",
    evidence: [{ type: "achievement", level: "project", title: "Consolidated governance reporting", bullet: "Consolidated 6 disparate governance trackers into a single reporting layer, halving steering-committee prep time.", metric: "-50% prep time", tags: ["Strategy", "Data", "Management"], audience: ["both"], year: 2023, sample: true,
      detail: "[SAMPLE] Replaced 6 spreadsheet-based trackers maintained by different teams with one live reporting layer, removing the weekly manual reconciliation that previously preceded every steering committee." }] },
  { company: "JP Morgan", employer: "JP Morgan", role: "Transformation Lead", name: "Prime Transformation", goal: "Driving the business transformation agenda for the Prime business.",
    evidence: [{ type: "achievement", level: "project", title: "3-year transformation roadmap", bullet: "Defined and sequenced a 3-year transformation roadmap, aligning 5 stakeholder groups on priority order.", metric: "5 stakeholder groups aligned", tags: ["Strategy", "Change"], audience: ["both"], year: 2023, sample: true,
      detail: "[SAMPLE] Ran a structured prioritisation process across 5 competing stakeholder groups to sequence the roadmap, resolving conflicting priorities before funding was committed." }] },
  { company: "JP Morgan", employer: "JP Morgan", role: "Transformation Lead", name: "Regulatory Transformation", goal: "Transforming the regulatory reporting operating model through business re-engineering and product, data and AI uplift.",
    evidence: [{ type: "achievement", level: "project", title: "Re-engineered regulatory reporting model", bullet: "Re-engineered the regulatory reporting operating model, reducing manual touchpoints by roughly 30%.", metric: "-30% manual touchpoints", tags: ["Operations", "Data", "Change"], audience: ["both"], year: 2026, sample: true,
      detail: "[SAMPLE] Re-mapped the operating model ahead of a planned AI uplift phase, removing handoffs that existed only because of legacy system boundaries rather than genuine process need." }] },
  { company: "JP Morgan", employer: "JP Morgan", role: "Transformation Lead", name: "Settlements Transformation", goal: "Driving the business transformation agenda for the Settlements division.",
    evidence: [{ type: "achievement", level: "project", title: "Redesigned settlements way-of-working", bullet: "Redesigned the Settlements team's way of working, improving on-time settlement rate by 12 percentage points.", metric: "+12pp on-time rate", tags: ["Operations", "Change"], audience: ["both"], year: 2022, sample: true,
      detail: "[SAMPLE] Restructured team workflows around settlement-date risk rather than trade-date order, front-loading the highest-risk items earlier in the day." }] },
  { company: "JP Morgan", employer: "JP Morgan", role: "Transformation Lead", name: "International Settlements Op Model", goal: "Streamlining post-settlement trade amendments through process standardisation and system uplift.",
    evidence: [{ type: "achievement", level: "project", title: "Standardised amendment process across markets", bullet: "Standardised post-settlement amendment processes across 4 international markets.", metric: "4 markets standardised", tags: ["Operations", "Strategy"], audience: ["both"], year: 2023, sample: true,
      detail: "[SAMPLE] Replaced market-specific workarounds that had accumulated over years with one shared process, reducing onboarding time for staff moving between markets." }] },
  { company: "JP Morgan", employer: "JP Morgan", role: "Product Manager", name: "Prime Rejects Workflow Product", goal: "Building an exception workflow platform for trade rejects.",
    evidence: [{ type: "achievement", level: "project", title: "Shipped trade-rejects workflow platform", bullet: "Shipped an exception workflow platform for trade rejects, cutting resolution time from 3 days to roughly 4 hours.", metric: "3d → 4h resolution", tags: ["Product", "Data", "Programming"], audience: ["tech", "both"], year: 2023, sample: true,
      detail: "[SAMPLE] Owned the product from requirements through launch, prioritising auto-routing of rejects to the right desk over building a broader feature set first." }] },
  { company: "JP Morgan", employer: "JP Morgan", role: "Product Manager", name: "Equities Settlements Workflow Product", goal: "Building an exception workflow platform for settlement fails.",
    evidence: [{ type: "achievement", level: "project", title: "Launched settlement-fails workflow tool", bullet: "Launched a settlement-fails workflow tool now used daily by 40+ people across Equities Operations.", metric: "40+ daily users", tags: ["Product", "Operations"], audience: ["tech", "both"], year: 2023, sample: true,
      detail: "[SAMPLE] Ran weekly user feedback sessions during the build, which is why daily adoption held after launch instead of the tool quietly falling out of use." }] },
  { company: "JP Morgan", employer: "JP Morgan", role: "Product Manager", name: "Asset Servicing Workflow Product", goal: "Building an exception workflow platform for asset-servicing income mismatches.",
    evidence: [{ type: "achievement", level: "project", title: "Built income-mismatch workflow platform", bullet: "Built a workflow platform for asset-servicing income mismatches, reducing aged breaks by roughly 25%.", metric: "-25% aged breaks", tags: ["Product", "Data"], audience: ["tech", "both"], year: 2024, sample: true,
      detail: "[SAMPLE] Targeted the oldest, highest-value breaks first rather than clearing volume, which is what moved the aged-break metric rather than just the total count." }] },
  { company: "JP Morgan", employer: "JP Morgan", role: "Product Manager", name: "Data Science Solutions", goal: "Partnering with the ML team to implement models for driving workflow and issue resolution.",
    evidence: [
      { type: "award", level: "role", title: "Digital & Platform Services Excellence Award", bullet: "Partnered with the ML team to deploy models supporting automated trade resolution, earning JPM's quarterly Digital & Platform Services Excellence Award.", metric: "Team award", tags: ["Data", "Operations", "Programming"], audience: ["both"], year: 2025, sample: false, highlighted: true, relatedProject: "Data Science Solutions",
        detail: "Logged at role-level rather than project-level, since the award recognised the broader initiative across multiple workflow areas, not this project alone." },
    ]},
  { company: "JP Morgan", employer: "JP Morgan", role: "Program Manager", name: "Payment Controls", goal: "Improving payment controls through system uplift and governance and control frameworks.",
    evidence: [{ type: "achievement", level: "project", title: "Closed payment-control audit findings", bullet: "Uplifted payment control governance, closing 18 audit findings within two quarters.", metric: "18 findings closed", tags: ["Operations", "Finance", "Management"], audience: ["banking", "both"], year: 2024, sample: true,
      detail: "[SAMPLE] Triaged findings by regulatory risk rather than age, clearing the highest-risk items first even though they weren't always the oldest on the list." }] },
  { company: "JP Morgan", employer: "JP Morgan", role: "Program Manager", name: "South Africa Equities Remediation", goal: "Migrating siloed post-trade applications in the South Africa market to a centralised technology stack.",
    evidence: [{ type: "achievement", level: "project", title: "Migrated South Africa post-trade stack", bullet: "Migrated siloed South Africa post-trade applications onto a centralised stack, decommissioning 5 legacy systems.", metric: "5 systems decommissioned", tags: ["Strategy", "Operations"], audience: ["both"], year: 2024, sample: true,
      detail: "[SAMPLE] Ran the migration alongside BAU processing with zero missed settlement cycles, which required a parallel-running period before full cutover." }] },
  { company: "JP Morgan", employer: "JP Morgan", role: "Project Manager", name: "T+1 Data Remediation", goal: "Remediating historical data issues to meet the mandatory T+1 settlement timeline.",
    evidence: [{ type: "achievement", level: "project", title: "Remediated historical trade data for T+1", bullet: "Remediated historical trade data ahead of the T+1 deadline, achieving 99.8% data completeness.", metric: "99.8% completeness", tags: ["Data", "Operations"], audience: ["both"], year: 2025, sample: true,
      detail: "[SAMPLE] Worked against a fixed regulatory deadline, prioritising the highest-volume data gaps first to hit completeness targets ahead of the mandatory cutover date." }] },
  { company: "JP Morgan", employer: "JP Morgan", role: "Project Manager", name: "Low Code Tooling Migration", goal: "Migrating automation workflows from one low-code tooling to another.",
    evidence: [{ type: "achievement", level: "project", title: "Migrated low-code automation workflows", bullet: "Migrated 20+ automation workflows to the new low-code platform with zero downtime.", metric: "20+ workflows migrated", tags: ["Programming", "Operations"], audience: ["tech"], year: 2024, sample: true,
      detail: "[SAMPLE] Migrated and re-tested each workflow individually rather than in bulk, which is what kept the transition to zero downtime instead of a single risky cutover." }] },
];

// Role/company-level evidence — not owned by any single project.
const ROLE_EVIDENCE = [
  { company: "UBS", employer: "UBS", level: "role", type: "achievement", title: "Reactivated $1M in dormant client revenue", bullet: "Reactivated $1M in dormant client revenue by rebuilding relationships with high-value hedge fund clients.", metric: "$1M", tags: ["Finance", "Strategy"], audience: ["banking"], year: 2017, sample: false, relatedProject: null,
    detail: "Took over a set of accounts flagged as dormant for over a year and re-engaged them directly rather than waiting for inbound demand, on the Flow Rates hedge fund desk." },
  { company: "UBS", employer: "UBS", level: "role", type: "achievement", title: "Award-winning CRM platform requirements", bullet: "Defined front-office requirements for a CRM platform that went on to win an industry award.", metric: "Award-winning", tags: ["Product", "Finance"], audience: ["banking"], year: 2017, sample: false, relatedProject: null,
    detail: "Represented the desk's requirements directly to the build team, which is why the shipped tool matched real sales workflow rather than a generic CRM template." },
  { company: "UBS", employer: "UBS", level: "role", type: "achievement", title: "Automated Bloomberg data feeds", bullet: "Automated vendor data feeds, removing a $50k/yr subscription cost.", metric: "$50k saved", tags: ["Programming", "Operations"], audience: ["tech", "banking"], year: 2015, sample: false, relatedProject: null,
    detail: "Built the scraping and calculation logic in-house after identifying that the paid feed duplicated data already available through an existing internal source." },
  { company: "Accenture", employer: "Accenture", level: "role", type: "achievement", title: "Scrum, DevOps & ML analytics adoption", bullet: "Championed agile and ML-assisted QA tooling adoption, lifting pass rates by 35%.", metric: "+35% QA pass rate", tags: ["Change", "Programming", "Data"], audience: ["tech"], year: 2020, sample: false, relatedProject: null,
    detail: "Introduced ML-assisted test triage ahead of most peer teams on the account, which is what drove adoption once the QA pass-rate improvement became visible." },
  { company: "Accenture", employer: "Accenture", level: "role", type: "award", title: "AI-based PM tool — Innovation Challenge winner", bullet: "Built an AI-assisted PM tool that won Accenture's Innovation Challenge.", metric: "Award winner", tags: ["Programming", "Product"], audience: ["tech"], year: 2019, sample: false, highlighted: true, relatedProject: null,
    detail: "Built and pitched the tool independently outside of client-billable time — an internal initiative, not tied to a client program." },
  { company: "Accenture", employer: "Accenture", level: "role", type: "award", title: "Leadership DNA (Innovate) Award", bullet: "Selected by Managing Directors as the sole annual Leadership DNA award winner from 130+ consultants.", metric: "1 of 130+", tags: ["Change", "Management"], audience: ["both"], year: 2020, sample: false, highlighted: true, relatedProject: null,
    detail: "Recognised a pattern of behaviour across multiple engagements rather than one deliverable, based on nominations from several account teams." },
  { company: "Goldman Sachs", employer: "Accenture", level: "role", type: "award", title: "Star of the Month & Client Hero", bullet: "Voted Star of the Month by peers and separately named Client Hero by Goldman Sachs stakeholders.", metric: "Peer + client voted", tags: ["Management", "Finance"], audience: ["banking"], year: 2018, sample: false, relatedProject: null,
    detail: "Two independent recognitions in the same secondment — one from Accenture peers, one from the client directly — spanning the whole engagement rather than one program." },
  { company: "JP Morgan", employer: "JP Morgan", level: "role", type: "achievement", title: "Top 15% performance rating", bullet: "Received top-tier (top 15%) performance ratings every year since joining JP Morgan.", metric: "Top 15%", tags: ["Management"], audience: ["both"], year: 2024, sample: false, relatedProject: null,
    detail: "Held the rating consistently across three different transformation programs and two different reporting lines, not just in one good year." },
  { company: "JP Morgan", employer: "JP Morgan", level: "role", type: "award", title: "80+ peer-to-peer recognitions", bullet: "Earned 80+ peer-to-peer recognitions via JPM's internal thank-you scheme.", metric: "80+", tags: ["Management"], audience: ["both"], year: 2023, sample: false, relatedProject: null,
    detail: "Recognitions came from across multiple teams and functions rather than one close working group, based on the scheme's cross-team visibility." },
  { company: "JP Morgan", employer: "JP Morgan", level: "role", type: "achievement", title: "MBA sponsorship, Senior Leader Apprenticeship", bullet: "Selected for full MBA sponsorship on JPM's Senior Leader Apprenticeship program.", metric: "Fully sponsored", tags: ["Management", "Strategy"], audience: ["both"], year: 2023, sample: false, relatedProject: null,
    detail: "Selection is competitive and reserved for a small cohort identified as future senior leaders, not an open-enrolment program." },
  { company: "JP Morgan", employer: "JP Morgan", level: "role", type: "review", title: "Manager feedback", quote: "Ned brings structure to the messiest problems on the desk — he's the person I want in the room when we don't yet know the answer.", source: "Managing Director, JPM Markets Operations", tags: ["Management", "Strategy"], audience: ["both"], year: 2024, sample: true, relatedProject: null, detail: null },
];

// Saved filter presets — same names as "Roles I'm looking for" on the Profile page.
// Maintain this mapping yourself; it composes existing filters rather than adding new tags per bullet.
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

function flatten() {
  const fromProjects = PROJECTS.flatMap((p) =>
    p.evidence.length
      ? p.evidence.map((e) => ({ ...e, company: p.company, employer: p.employer, functionalRole: p.role, jobTitle: resolveRole(p.company, e.year || 2023).title, project: p.name, goal: p.goal }))
      : [{ placeholder: true, company: p.company, employer: p.employer, functionalRole: p.role, jobTitle: resolveRole(p.company, 2023).title, project: p.name, goal: p.goal, tags: [], audience: ["both"], level: "project" }]
  );
  const fromRole = ROLE_EVIDENCE.map((e) => ({ ...e, functionalRole: null, jobTitle: resolveRole(e.company, e.year || 2020).title, project: null, goal: null }));
  return [...fromProjects, ...fromRole];
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
  const [lens, setLens] = useState(initial.get("audience") || "both");
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
  const [selectedDeliveryRoles, setSelectedDeliveryRoles] = useState(initial.get("role") ? [initial.get("role")] : []);
  const [selectedCats, setSelectedCats] = useState(initial.get("cat") ? [initial.get("cat")] : []);
  const [selectedTypes, setSelectedTypes] = useState(initial.get("type") ? [initial.get("type")] : []);
  const [query, setQuery] = useState(initial.get("q") || "");
  const [groupBy, setGroupBy] = useState("company");
  const [expanded, setExpanded] = useState(null);
  const [showPlaceholders, setShowPlaceholders] = useState(true);
  const [minTier, setMinTier] = useState(initial.get("tier") || "all"); // 'all' | 'notable' | 'signature'
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [activePreset, setActivePreset] = useState(initial.get("preset") && TARGET_ROLES[initial.get("preset")] ? initial.get("preset") : null);
  const applyPreset = (name) => {
    if (activePreset === name) { setActivePreset(null); setSelectedCats([]); setSelectedDeliveryRoles([]); setLens("both"); return; }
    const p = TARGET_ROLES[name];
    setSelectedCats(p.categories); setSelectedDeliveryRoles(p.deliveryRole === "All" ? [] : [p.deliveryRole]); setLens(p.audience);
    setSelCompanies(new Set()); setSelRoles(new Set()); setSelProjects(new Set()); setSelectedTypes([]);
    setActivePreset(name);
  };

  const accent = selCompanies.size === 1 ? ACCENTS[[...selCompanies][0]] : INK;
  const toggle = (setter) => (val) => setter((s) => (s.includes(val) ? s.filter((x) => x !== val) : [...s, val]));
  const toggleCat = toggle(setSelectedCats);
  const toggleType = toggle(setSelectedTypes);
  const toggleDeliveryRole = toggle(setSelectedDeliveryRoles);

  const rows = useMemo(() => flatten(), []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (r.placeholder && !showPlaceholders) return false;
      if (selCompanies.size && !selCompanies.has(r.employer)) return false;
      if (selRoles.size && !selRoles.has(`${r.employer} · ${r.jobTitle}`)) return false;
      if (selProjects.size && !(r.project && selProjects.has(r.project))) return false;
      if (selectedDeliveryRoles.length && !selectedDeliveryRoles.includes(r.functionalRole)) return false;
      if (!r.placeholder && lens !== "both" && !(r.audience.includes(lens) || r.audience.includes("both"))) return false;
      if (selectedCats.length && !r.placeholder && !r.tags.some((t) => selectedCats.includes(t))) return false;
      if (selectedTypes.length && !r.placeholder && !selectedTypes.includes(r.type)) return false;
      if (minTier === "highlighted" && !r.highlighted) return false;
      if (query) {
        const hay = ((r.title || "") + (r.bullet || "") + (r.project || "") + (r.goal || "") + (r.detail || "") + (r.quote || "") + r.tags.join(" ")).toLowerCase();
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    }).sort((a, b) => (b.year || 0) - (a.year || 0));
  }, [rows, selCompanies, selRoles, selProjects, selectedDeliveryRoles, lens, selectedCats, selectedTypes, query, showPlaceholders, minTier]);

  const goalByKey = useMemo(() => {
    const m = new Map();
    PROJECTS.forEach((p) => m.set(`${p.company} · ${p.name}`, p.goal));
    return m;
  }, []);
  const roleDescByKey = useMemo(() => {
    const m = new Map();
    ROLES.forEach((r) => m.set(`${r.company} · ${r.title}`, r.description));
    return m;
  }, []);
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
    if (lens !== "both") f.push({ label: `Audience: ${lens}`, clear: () => setLens("both"), color: accent });
    if (minTier === "highlighted") f.push({ label: "◆ Highlighted only", clear: () => setMinTier("all"), color: HIGHLIGHT_COLOR });
    if (activePreset) f.push({ label: `Preset: ${activePreset}`, clear: () => applyPreset(activePreset), color: accent });
    if (query) f.push({ label: `Search: "${query}"`, clear: () => setQuery(""), color: accent });
    return f;
  }, [selCompanies, selRoles, selProjects, selectedDeliveryRoles, selectedCats, selectedTypes, lens, minTier, activePreset, query, accent]);
  const clearAllFilters = () => {
    setSelCompanies(new Set()); setSelRoles(new Set()); setSelProjects(new Set()); setSelectedDeliveryRoles([]);
    setSelectedCats([]); setSelectedTypes([]); setLens("both"); setMinTier("all"); setActivePreset(null); setQuery("");
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
                {COMPANIES.map((c) => {
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
                {ROLES.map((r) => {
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
                {PROJECTS.map((p) => {
                  const on = selProjects.has(p.name);
                  const clientTag = p.company !== p.employer ? ` (${p.company.split(" ")[0]})` : "";
                  return (
                    <button key={p.name} onClick={() => toggleProject(p.name)} title={p.goal}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono border ${on ? "text-white border-transparent" : "border-black/15 text-black/50"}`}
                      style={on ? { background: ACCENTS[p.employer] } : {}}>{p.name}{clientTag}</button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-black/10 pt-4">
              <span className="font-mono text-[10px] text-black/40 uppercase block mb-2">Delivery role — what hat, on that project (distinct from job title)</span>
              <div className="flex gap-2 flex-wrap">
                {FUNC_ROLES.map((r) => {
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
                {groupBy === "company" && COMPANIES.find((c) => c.name === grp.key) && (
                  <p className="text-xs text-black/40 mt-1 max-w-2xl">{COMPANIES.find((c) => c.name === grp.key).blurb}</p>
                )}
                {groupBy === "project" && goalByKey.get(grp.key) && (
                  <p className="text-xs text-black/40 mt-1 max-w-2xl">{goalByKey.get(grp.key)}</p>
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
                    {r.placeholder && <p className="text-xs text-black/60 mt-2 leading-relaxed">{r.goal}</p>}
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
                        {r.relatedProject && <span className="text-[10px] font-mono text-black/40">↳ relates to {r.relatedProject}</span>}
                      </div>
                    )}
                    {isOpen && r.detail && (
                      <div className="mt-3 pt-3 border-t border-black/10 text-xs text-black/70 leading-relaxed space-y-2">
                        <div>{highlightMatch(r.detail, query)}</div>
                        {r.goal && groupBy !== "project" && (
                          <div className="bg-black/5 rounded-lg p-2.5 text-black/50">
                            <span className="font-mono text-[9px] uppercase tracking-wide block mb-1">Project context — {r.project}</span>
                            {r.goal}
                          </div>
                        )}
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
    </div>
  );
}
