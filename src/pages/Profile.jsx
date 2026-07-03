import { useState } from "react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`;
const INK = "#1C2230";
const ACCENT = "#1F5C56";
const ACCENTS = { "JP Morgan": "#1F5C56", "Goldman Sachs": "#A9803F", "Morgan Stanley": "#7A4B8C", "UBS": "#B0473C", "Accenture": "#3B5B7A" };

const CONTEXT = {
  Industries: ["Investment Banking", "Technology Consulting"],
  Companies: ["UBS", "Morgan Stanley", "Goldman Sachs", "JP Morgan", "Accenture"],
  Divisions: ["Operations", "Sales & Trading", "Strategy & Consulting", "Transformation"],
  Functions: ["Securities Operations", "Trade Execution", "Technical Program Delivery", "Product Management", "People Management"],
};

const SUMMARY = [
  "Senior Strategy and Transformation Lead",
  "13 years of experience in investment banking and technology consulting",
  "Led and oversaw 18 large-scale, cross-functional strategic initiatives",
  "Track record of delivering impact through data-driven advisory, process optimisation and technical product delivery",
  "Strong Capital Markets domain knowledge covering front-to-back processes, products, and industry practices",
  "Adept at combining interdisciplinary skills to deliver high quality outcomes",
  "PRINCE2 and Agile Scrum certified",
];

const REASONS = [
  { t: "High performing", d: "Obsessed about crafting work to perfection — delivers outcomes with a wow factor, impressing everyone he works with." },
  { t: "Multi-disciplinary", d: "Wears multiple hats, operating at the intersection of Strategy, Data, Operations, Product and Project." },
  { t: "Highly analytical", d: "Digests complex information, building clarity to drive analysis and help people make sense of it." },
  { t: "Highly methodical", d: "Creates structure to manage chaotic and ambiguous environments." },
  { t: "Strong process improvement mindset", d: "Ideates and critically designs solutions to solve for inefficiencies." },
  { t: "Tech savvy", d: "Picks up any new concepts quickly, and injects theory into practice." },
  { t: "Capital Markets fluent", d: "Deep subject matter expertise having worked in most segments of the trade lifecycle." },
];

const ROLES = [
  "Strategy & Operations", "Business Transformation", "Product Manager", "Product Operations", "Program Manager",
  "AI Transformation Lead", "AI Product Manager", "Technical Program Manager",
];

const PERSONALITY = [
  "Genuinely himself — acts and speaks his mind without hiding emotions or managing perception",
  "Kind-hearted, non-confrontational, always willing to help — generally likeable",
  "Perfectionist with an eye for craft — treats assignments as pieces of work worth getting right, not just tasks",
  "Triggered by inefficiency and randomness — feels obliged to do something about it",
  "Inquisitive and competitive — obsessive about learning and broadening his skill set",
  "Over-thinker and over-preparer — tracks and reflects on everything, highly self-aware",
  "Motivated by winning people over and earning recognition through visible, high-quality output",
];

const STRENGTHS = [
  { t: "High performer, not just a doer", d: "Delivers high-quality, polished work that consistently impresses stakeholders. Takes pride in excellence, never settles for the minimum." },
  { t: "Multi-disciplinary and highly adaptable", d: "A rare blend of finance, operations, data, technical tooling, design, and automation skills. Moves across functions and connects concepts." },
  { t: "Structured, analytical thinker", d: "Brings clarity to complexity — breaking down messy processes, consolidating information thoroughly, presenting ideas clearly." },
  { t: "Hands-on and execution-focused", d: "Prioritises action over talk. Moves quickly, produces tangible outcomes, maintains strong attention to detail." },
  { t: "Systems and quality obsessed", d: "Creates order from chaos, tracks meticulously, maintains high consistency and standards." },
  { t: "Creative and improvement-driven", d: "Energised by ideas, constantly thinking of better ways to do things, brave enough to challenge default approaches." },
  { t: "Relentless learner", d: "Actively upgrades knowledge across finance, tools and technology; reflects deeply and pushes to improve every cycle." },
  { t: "Achievement-oriented with strong ownership", d: "Cares about outcomes, reputation and mastery — that drive translates into real results." },
];

const WORK_PREFS = [
  "Provide inputs that contribute directly towards the end outcome or product",
  "Infuse his own creative ideas into the design of a process or system, ideally from scratch",
  "Work on a variety of initiatives that require bringing together skills from across disciplines",
  "Be kept busy and in on-fire mode — fast-approaching deadlines excite rather than stress him",
  "Fully own a deliverable, be the central decision maker, and do things his own way",
  "Gain deep knowledge on a topic and act as the subject matter expert",
];

const FUNCTIONAL = [
  { cat: "Strategy", icon: "compass", items: ["Strategic Planning", "Business Roadmap", "Fintech Integration", "Thought Leadership"] },
  { cat: "Operations", icon: "gear", items: ["Op Model Design", "Problem Analysis", "Process Modelling", "Workflow Optimisation"] },
  { cat: "Product", icon: "cube", items: ["Product Ideation", "Requirements Gathering", "Solution Design", "System Delivery"] },
  { cat: "Data", icon: "chart", items: ["Data Automation", "Data Analytics", "Business Intelligence", "AI & ML Implementation"] },
  { cat: "Programming", icon: "code", items: ["Rapid Prototyping", "Software Development", "Low Code Tooling", "Process Automation"] },
  { cat: "Change", icon: "refresh", items: ["Program Governance", "Project Execution", "Executive Communication", "Issue Resolution"] },
  { cat: "Finance", icon: "coin", items: ["Lifecycle Processes", "Products & Strategies", "Industry Systems", "Financial Regulations"] },
  { cat: "Management", icon: "people", items: ["Team Ownership", "People Management", "Coaching & Mentoring", "Skills Training"] },
];

const TECHNICAL = ["Python", "SQL", "JavaScript", "HTML", "Excel / VBA", "Alteryx", "Power Automate", "Power Apps", "Tableau", "Claude Code", "Google AI Studio", "NLTK", "Scikit-Learn", "API Integration", "IBM Cloud", "Figma", "JIRA"];

const TIMELINE = [
  { org: "UBS", role: "Operations Analyst", years: "2012–2016", d: "Rates MO Risk & Trade Control, Desk Services, OTC Confirmations, ETD Regulatory Reporting." },
  { org: "UBS", role: "Sales Associate, Front Office", years: "2016–2017", d: "Flow Rates hedge fund desk and LDI desk — pricing, execution and client rebalancing." },
  { org: "Accenture", role: "Consulting Manager", years: "2017–2021", d: "Seconded as PM at Goldman Sachs (Global Markets Equities) and BA at Morgan Stanley (Trade Reporting Controls)." },
  { org: "JP Morgan", role: "Transformation Vice President", years: "2021–Present", d: "Securities Ops Transformation → Markets Ops Platform Transformation → Markets Regulatory Control Transformation." },
];

// Compact Company → Role diagram for the Career Journey section — two levels only, not exploded to projects (that's the Explorer's job).
const COMPANIES_ROLES = [
  { company: "UBS", roles: [
    { title: "Operations Analyst", years: "2012–2016" },
    { title: "Sales Associate", years: "2016–2017" },
  ]},
  { company: "Accenture", roles: [
    { title: "Consulting Manager", years: "2017–2021" },
  ]},
  { company: "JP Morgan", roles: [
    { title: "Transformation Vice President", years: "2021–Present" },
  ]},
];

const EDUCATION = [
  { i: "MBA, Strategic Leadership & Management", s: "University of Exeter — via JP Morgan Senior Leader Apprenticeship (in progress)" },
  { i: "BSc, Economics & Management", s: "University of Bristol" },
  { i: "Oxford Fintech Programme", s: "Saïd Business School, Oxford University" },
  { i: "Leading with Advanced Analytics & AI", s: "Kellogg School of Management, Northwestern" },
];

const QUALIFICATIONS = [
  { area: "Waterfall PM", cert: "PRINCE2 Foundation & Practitioner" },
  { area: "Agile PM", cert: "Professional Scrum Master I" },
  { area: "Business Analysis", cert: "BCS Practitioner Certificate, Systems Development Essentials" },
  { area: "Data Analytics", cert: "Tableau Desktop Specialist" },
  { area: "Data Science", cert: "IBM Data Science Professional Certificate" },
  { area: "Finance", cert: "CISI Level 3 Capital Markets Programme" },
];

const ICONS = {
  target: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12zm0 4a2 2 0 100 4 2 2 0 000-4z",
  spark: "M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z",
  compass: "M12 2a10 10 0 100 20 10 10 0 000-20zM9 15l2-6 6-2-2 6-6 2z",
  gear: "M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  cube: "M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2zM4.5 6.5L12 11l7.5-4.5M12 11v11",
  chart: "M4 20V10M11 20V4M18 20v-7",
  code: "M8 6L2 12l6 6M16 6l6 6-6 6",
  refresh: "M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3M18 4v4h-4M6 20v-4h4",
  coin: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v12M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1.1-3 2.5S10.3 12 12 12s3 1.1 3 2.5-1.3 2.5-3 2.5-3-1.1-3-2.5",
  people: "M8 11a3 3 0 100-6 3 3 0 000 6zM16 11a3 3 0 100-6 3 3 0 000 6zM2 20c0-3 2.7-5 6-5s6 2 6 5M12 20c0-2.5 2-4.5 5-4.5s5 2 5 4.5",
  path: "M4 20c4-8 8 8 12 0M4 4c4 8 8-8 12 0",
  cap: "M12 3L2 8l10 5 10-5-10-5zM6 10.5V17s2.5 3 6 3 6-3 6-3v-6.5",
  medal: "M12 8a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM8.5 13 7 21l5-2.5L17 21l-1.5-8",
};
function Icon({ name, size = 18, color = INK, strokeWidth = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}

const EXPLORER_URL = "/explorer";
const INTERVIEW_URL = "/interview";
const PROFILE_URL = "/";
function explorerLink(params) {
  const qs = new URLSearchParams(params).toString();
  return `${EXPLORER_URL}?${qs}`;
}

function SectionHeader({ eyebrow, title, icon }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ACCENT}15` }}>
        <Icon name={icon} color={ACCENT} />
      </div>
      <div>
        <div className="font-mono text-xs tracking-widest text-black/40">{eyebrow}</div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-ink">{title}</h2>
      </div>
    </div>
  );
}

export default function Profile() {
  const [openStrength, setOpenStrength] = useState(null);

  return (
    <div className="min-h-screen bg-[#F2F3EF] text-ink font-body">
      <style>{`
        ${FONT_IMPORT}
        .text-ink { color:${INK}; }
        .font-display { font-family:'Space Grotesk', sans-serif; }
        .font-body { font-family:'Inter', sans-serif; }
        .font-mono { font-family:'IBM Plex Mono', monospace; }
      `}</style>

      {/* NAV */}
      <div className="sticky top-0 z-20 backdrop-blur bg-[#F2F3EF]/90 border-b border-black/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href={PROFILE_URL} className="font-display font-semibold tracking-tight">Ned Yuen</a>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-3 py-1.5 rounded-full text-white" style={{ background: ACCENT }}>Career Profile</span>
            <a href={EXPLORER_URL} className="font-mono text-xs px-3 py-1.5 rounded-full border border-black/15 text-black/60 hover:border-black/30">Achievement Explorer</a>
            <a href={INTERVIEW_URL} className="font-mono text-xs px-3 py-1.5 rounded-full border border-black/15 text-black/60 hover:border-black/30">Interview Mode</a>
          </div>
        </div>
      </div>

      {/* HERO / CAREER PROFILE */}
      <header className="max-w-4xl mx-auto px-6 pt-14 pb-10">
        <div className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: ACCENT }}>Career Profile</div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-[1.05] tracking-tight max-w-2xl">
          Senior Strategy &amp; Transformation Lead, 13 years inside Capital Markets.
        </h1>
        <ul className="mt-6 space-y-1.5 max-w-xl">
          {SUMMARY.map((s) => (
            <li key={s} className="text-sm text-black/70 flex gap-2 leading-relaxed">
              <span style={{ color: ACCENT }}>—</span>{s}
            </li>
          ))}
        </ul>

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {Object.entries(CONTEXT).map(([k, vals]) => (
            <div key={k}>
              <div className="font-mono text-[10px] tracking-widest text-black/40 uppercase mb-1.5">{k}</div>
              <div className="flex flex-wrap gap-1.5">
                {vals.map((v) => <span key={v} className="text-[11px] font-mono bg-black/5 px-2 py-1 rounded">{v}</span>)}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* REASONS TO HIRE */}
      <section className="max-w-4xl mx-auto px-6 py-14 border-t border-black/10">
        <SectionHeader eyebrow="01 — Why hire me" title="Reasons to hire" icon="target" />
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
          {REASONS.map((r) => (
            <div key={r.t} className="flex gap-3">
              <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: `${ACCENT}12` }}>
                <Icon name="target" size={15} color={ACCENT} />
              </div>
              <div>
                <div className="font-display font-semibold text-sm">{r.t}</div>
                <div className="text-black/60 text-sm mt-1 leading-relaxed">{r.d}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <div className="font-mono text-[10px] tracking-widest text-black/40 uppercase mb-2">Roles I'm looking for</div>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <span key={r} className="font-mono text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: ACCENT, color: ACCENT }}>{r}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT ME */}
      <section className="max-w-4xl mx-auto px-6 py-14 border-t border-black/10">
        <SectionHeader eyebrow="02 — About me" title="Personality & strengths" icon="spark" />
        <div className="mb-8">
          <div className="font-mono text-[10px] tracking-widest text-black/40 uppercase mb-3">Personality</div>
          <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2">
            {PERSONALITY.map((p) => (
              <li key={p} className="text-sm text-black/70 leading-relaxed flex gap-2">
                <span style={{ color: ACCENT }} className="shrink-0">—</span>{p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-mono text-[10px] tracking-widest text-black/40 uppercase mb-3">Strengths</div>
          <div className="grid md:grid-cols-2 gap-3">
            {STRENGTHS.map((s, i) => {
              const open = openStrength === i;
              return (
                <button key={s.t} onClick={() => setOpenStrength(open ? null : i)}
                  className="text-left bg-white rounded-lg border border-black/10 p-3.5 hover:border-black/25 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="spark" size={14} color={ACCENT} />
                    <div className="font-display font-semibold text-sm">{s.t}</div>
                  </div>
                  {open && <div className="text-xs text-black/60 mt-2 leading-relaxed">{s.d}</div>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* WORK PREFERENCES */}
      <section className="max-w-4xl mx-auto px-6 py-14 border-t border-black/10">
        <SectionHeader eyebrow="03 — Work style" title="What kind of work motivates me" icon="path" />
        <p className="text-sm text-black/50 mb-5">Ned enjoys doing pieces of work that allow him to:</p>
        <div className="grid md:grid-cols-2 gap-3">
          {WORK_PREFS.map((w) => (
            <div key={w} className="bg-white rounded-lg border border-black/10 p-3.5 text-sm text-black/70 leading-relaxed">{w}</div>
          ))}
        </div>
      </section>

      {/* EXPERTISE */}
      <section className="max-w-4xl mx-auto px-6 py-14 border-t border-black/10">
        <SectionHeader eyebrow="04 — Range" title="Functional & technical expertise" icon="cube" />
        <p className="text-sm text-black/50 mb-6 max-w-xl">
          On paper, a Transformation Lead. In practice, working at the intersection of Strategy, Operations, Product, Data, Programming, Change, Finance and Management.
        </p>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {FUNCTIONAL.map((f) => (
            <a key={f.cat} href={explorerLink({ cat: f.cat })} className="bg-white rounded-lg border border-black/10 p-3.5 flex gap-3 hover:border-black/25 transition-colors">
              <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ background: `${ACCENT}12` }}>
                <Icon name={f.icon} size={16} color={ACCENT} />
              </div>
              <div>
                <div className="font-display font-semibold text-sm mb-1">{f.cat}</div>
                <div className="text-xs text-black/60 leading-relaxed">{f.items.join(" · ")}</div>
              </div>
            </a>
          ))}
        </div>

        <div className="font-mono text-[10px] tracking-widest text-black/40 uppercase mb-3">Technical toolkit</div>
        <div className="flex flex-wrap gap-1.5">
          {TECHNICAL.map((t) => (
            <a key={t} href={explorerLink({ q: t })} className="text-xs font-mono px-2.5 py-1 rounded-md border hover:text-white transition-colors" style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => e.currentTarget.style.background = ACCENT} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>{t}</a>
          ))}
        </div>
        <p className="text-[11px] text-black/40 mt-2">Click a skill to see the achievements that used it →</p>
      </section>

      {/* CAREER JOURNEY */}
      <section className="max-w-4xl mx-auto px-6 py-14 border-t border-black/10">
        <SectionHeader eyebrow="05 — Track record" title="Career journey" icon="chart" />

        <div className="mb-8">
          <div className="font-mono text-[10px] tracking-widest text-black/40 uppercase mb-3">Company → Role <span className="normal-case text-black/30">(click to explore evidence)</span></div>
          <div className="space-y-2">
            {COMPANIES_ROLES.map((c) => (
              <div key={c.company} className="flex flex-col sm:flex-row sm:items-stretch gap-2">
                <a href={explorerLink({ company: c.company })}
                  className="sm:w-44 shrink-0 rounded-lg border p-3 flex items-center transition-colors hover:shadow-sm"
                  style={{ borderColor: `${ACCENTS[c.company]}40`, background: `${ACCENTS[c.company]}0d` }}>
                  <span className="font-display font-semibold text-sm" style={{ color: ACCENTS[c.company] }}>{c.company}</span>
                </a>
                <div className="flex-1 flex flex-wrap gap-2 relative">
                  <div className="hidden sm:block absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-px" style={{ background: `${ACCENTS[c.company]}40` }} />
                  {c.roles.map((r) => (
                    <a key={r.title} href={explorerLink({ company: c.company, jobRole: r.title })}
                      className="rounded-lg border border-black/10 bg-white px-3 py-2 hover:border-black/25 transition-colors">
                      <div className="text-xs font-medium">{r.title}</div>
                      <div className="font-mono text-[10px] text-black/40">{r.years}</div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {[...TIMELINE].reverse().map((t, i) => (
            <div key={i} className="flex gap-6 py-5 border-b border-black/10 last:border-0">
              <div className="font-mono text-xs text-black/40 w-24 shrink-0 pt-1">{t.years}</div>
              <div>
                <div className="font-display font-semibold text-sm">{t.role} · <span style={{ color: ACCENTS[t.org] }}>{t.org}</span></div>
                <div className="text-sm text-black/60 mt-1 leading-relaxed">{t.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EDUCATION & QUALIFICATIONS */}
      <section className="max-w-4xl mx-auto px-6 py-14 border-t border-black/10">
        <SectionHeader eyebrow="06 — Education & qualifications" title="Formal education & certifications" icon="cap" />
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <div className="font-mono text-[10px] tracking-widest text-black/40 uppercase mb-3">Education</div>
            <ul className="space-y-3">
              {EDUCATION.map((e) => (
                <li key={e.i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${ACCENT}12` }}>
                    <Icon name="cap" size={15} color={ACCENT} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{e.i}</div>
                    <div className="text-xs text-black/50">{e.s}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-widest text-black/40 uppercase mb-3">Certifications</div>
            <div className="grid grid-cols-2 gap-3">
              {QUALIFICATIONS.map((q) => (
                <div key={q.cert} className="bg-white rounded-lg border border-black/10 p-3 flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${ACCENT}15` }}>
                    <Icon name="medal" size={20} color={ACCENT} />
                  </div>
                  <div className="font-mono text-[9px] tracking-widest text-black/40 uppercase">{q.area}</div>
                  <div className="text-xs font-medium leading-tight">{q.cert}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <footer className="max-w-4xl mx-auto px-6 py-16 border-t border-black/10">
        <div className="grid grid-cols-3 gap-3 mb-10">
          <a href={explorerLink({ tier: "signature" })} className="bg-white rounded-lg border border-black/10 p-4 text-center hover:border-black/25 transition-colors">
            <div className="font-display text-2xl font-semibold" style={{ color: ACCENT }}>◆ 4</div>
            <div className="text-[11px] font-mono text-black/40 mt-1">Signature achievements</div>
          </a>
          <a href={explorerLink({ type: "award" })} className="bg-white rounded-lg border border-black/10 p-4 text-center hover:border-black/25 transition-colors">
            <div className="font-display text-2xl font-semibold" style={{ color: ACCENT }}>6</div>
            <div className="text-[11px] font-mono text-black/40 mt-1">Awards</div>
          </a>
          <a href={explorerLink({ type: "review" })} className="bg-white rounded-lg border border-black/10 p-4 text-center hover:border-black/25 transition-colors">
            <div className="font-display text-2xl font-semibold" style={{ color: ACCENT }}>2</div>
            <div className="text-[11px] font-mono text-black/40 mt-1">Reviews</div>
          </a>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="font-display text-2xl font-semibold">Want the receipts?</div>
            <p className="text-black/60 text-sm mt-2 max-w-md">
              Every claim above is backed by tagged, filterable evidence — 17 programs, achievements, awards and reviews, organised by company, role and project.
            </p>
          </div>
          <a href={EXPLORER_URL} className="font-mono text-sm px-5 py-3 rounded-full text-white text-center shrink-0" style={{ background: ACCENT }}>
            Browse the Achievement Explorer →
          </a>
        </div>
      </footer>
    </div>
  );
}
