import { useState } from "react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`;
const INK = "#1C2230";
const ACCENT = "#1F5C56";
const ACCENTS = { "JP Morgan": "#1F5C56", "Goldman Sachs": "#A9803F", "Morgan Stanley": "#7A4B8C", "UBS": "#B0473C", "Accenture": "#3B5B7A" };

const CONTEXT = {
  Industries: ["Investment Banking", "Technology Consulting"],
  Companies: ["UBS", "Morgan Stanley", "Goldman Sachs", "JP Morgan", "Accenture"],
  Functions: ["Securities Operations", "Trade Execution", "Technical Program Delivery", "Product Management", "People Management"],
};

const SUMMARY = [
  "Ned is a Senior Strategy and Transformation Lead with 13 years of experience across investment banking and technology consulting. Over that time he has led and overseen 18 large-scale, cross-functional strategic initiatives, drawing on deep Capital Markets domain knowledge that spans front-to-back processes, products, and industry practices.",
  "His track record is built on data-driven advisory, process optimisation, and technical product delivery — combining interdisciplinary skills to produce high-quality outcomes wherever the work sits. He is PRINCE2 and Agile Scrum certified.",
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

// Hand-maintained, same pattern as Explorer.jsx's TARGET_ROLES — Ned edits this directly to control which
// proof example surfaces per category. type: 'achievement' pulls a specific bullet (sharp, metric-driven);
// type: 'project' pulls the project's goal instead (general, when a granular metric isn't the point).
// `ref` must match an evidence `title` or project `name` exactly as it appears in Explorer.jsx.
const CAREER_HIGHLIGHTS = {
  Strategy: [{ type: "project", ref: "Prime Transformation" }],
  Operations: [{ type: "achievement", ref: "Trade reporting control framework" }],
  Product: [{ type: "achievement", ref: "One-stop-shop trade processing platform" }],
  Data: [{ type: "achievement", ref: "Digital & Platform Services Excellence Award" }],
  Programming: [{ type: "achievement", ref: "Automated Bloomberg data feeds" }],
  Change: [{ type: "achievement", ref: "Scrum, DevOps & ML analytics adoption" }],
  Finance: [{ type: "achievement", ref: "Reactivated $1M in dormant client revenue" }],
  Management: [{ type: "achievement", ref: "MBA sponsorship, Senior Leader Apprenticeship" }],
};

// Local copy of only the 8 refs above (bullet/goal text), word-for-word identical to Explorer.jsx's
// PROJECTS/ROLE_EVIDENCE — a minimal local copy, not the full dataset (same pattern used elsewhere on
// this page, e.g. TIMELINE below, rather than importing across page files). If Explorer's wording
// changes, update the source there first, then copy it here.
const HIGHLIGHT_TEXT = {
  "Prime Transformation": "Driving the business transformation agenda for the Prime business.",
  "Trade reporting control framework": "Designed and implemented a front-to-back reconciliation and control framework for trade reporting.",
  "One-stop-shop trade processing platform": "Delivered a one-stop-shop trade processing platform, displacing 37 legacy systems across desks.",
  "Digital & Platform Services Excellence Award": "Partnered with the ML team to deploy models supporting automated trade resolution, earning JPM's quarterly Digital & Platform Services Excellence Award.",
  "Automated Bloomberg data feeds": "Automated vendor data feeds, removing a $50k/yr subscription cost.",
  "Scrum, DevOps & ML analytics adoption": "Championed agile and ML-assisted QA tooling adoption, lifting pass rates by 35%.",
  "Reactivated $1M in dormant client revenue": "Reactivated $1M in dormant client revenue by rebuilding relationships with high-value hedge fund clients.",
  "MBA sponsorship, Senior Leader Apprenticeship": "Selected for full MBA sponsorship on JPM's Senior Leader Apprenticeship program.",
};

// Hand-picked reviews to surface on the homepage. Reference existing review evidence by title/source —
// do not write new quote text here. Edit which reviews appear by changing this list, not by adding new content.
const TESTIMONIALS = [
  { title: "Client feedback", source: "VP, Morgan Stanley Operations" },
  { title: "Manager feedback", source: "Managing Director, JPM Markets Operations" },
];

// Local copy of only the quote text for the testimonials above, word-for-word identical to Explorer.jsx's
// PROJECTS/ROLE_EVIDENCE review items — same minimal-local-copy pattern as HIGHLIGHT_TEXT, not the full dataset.
// Both source reviews are currently sample: true in Explorer — placeholder content like ~13 other evidence
// items already are, not a blocker to showing this section; swap for real reviews during the content pass.
const TESTIMONIAL_TEXT = {
  "Client feedback": "The control framework Ned designed is still how we catch breaks before they become reportable issues.",
  "Manager feedback": "Ned brings structure to the messiest problems on the desk — he's the person I want in the room when we don't yet know the answer.",
};

const TECHNICAL = ["Python", "SQL", "JavaScript", "HTML", "Excel / VBA", "Alteryx", "Power Automate", "Power Apps", "Tableau", "Claude Code", "Google AI Studio", "NLTK", "Scikit-Learn", "API Integration", "IBM Cloud", "Figma", "JIRA"];

// ASSUMPTION — Accenture split: see the matching, more detailed comment in Explorer.jsx's ROLES array.
// Ned's job title didn't change between secondments, only the client — hence the " — <client> secondment"
// suffix rather than a distinct title. Date boundary (2017–2019 / 2019–2021) is inferred from real evidence
// years (Morgan Stanley project dated 2018, Goldman Sachs projects dated 2019); confirm/correct with Ned.
// `role` strings below must match Explorer.jsx's ROLES[].title exactly — they're used as the `jobRole`
// param when linking into the Explorer (see the timeline rendering below). Where the display text carries
// more detail than the stint title (e.g. "Sales Associate, Front Office" vs. Explorer's "Sales Associate"),
// an explicit `jobRole` override is set so the link still matches; entries without one link using `role` as-is.
const TIMELINE = [
  { org: "UBS", role: "Operations Analyst", years: "2012–2016", d: "Rates MO Risk & Trade Control, Desk Services, OTC Confirmations, ETD Regulatory Reporting." },
  { org: "UBS", role: "Sales Associate, Front Office", jobRole: "Sales Associate", years: "2016–2017", d: "Flow Rates hedge fund desk and LDI desk — pricing, execution and client rebalancing." },
  { org: "Accenture", role: "Consulting Manager — Morgan Stanley secondment", years: "2017–2019", d: "Seconded as Business Analyst at Morgan Stanley (Trade Reporting Controls)." },
  { org: "Accenture", role: "Consulting Manager — Goldman Sachs secondment", years: "2019–2021", d: "Seconded as Project Manager at Goldman Sachs (Global Markets Equities)." },
  { org: "JP Morgan", role: "Transformation Vice President", years: "2021–Present", d: "Securities Ops Transformation → Markets Ops Platform Transformation → Markets Regulatory Control Transformation." },
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
  quote: "M7 8h3v4H7c0 2.2-1 3.5-2 4M15 8h3v4h-3c0 2.2-1 3.5-2 4",
  mail: "M4 6h16v12H4zM4 6l8 6 8-6",
  link: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3",
};
function Icon({ name, size = 18, color = INK, strokeWidth = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}

// Placeholder path — Ned needs to supply a real photo at public/headshot-placeholder.jpg (the file doesn't
// exist yet, so this intentionally 404s until then). Falls back to an "NY" initials circle if the image
// fails to load, so the hero layout doesn't visibly break while the real photo is still missing.
function Headshot({ size = 80 }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (imgFailed) {
    return (
      <div className="rounded-full flex items-center justify-center shrink-0 font-display font-semibold text-white"
        style={{ width: size, height: size, background: ACCENT, fontSize: size * 0.34 }}>NY</div>
    );
  }
  return (
    <img src="/headshot-placeholder.jpg" alt="Ned Yuen" onError={() => setImgFailed(true)}
      className="rounded-full object-cover shrink-0 border border-black/10" style={{ width: size, height: size }} />
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
  const [aboutTab, setAboutTab] = useState("personality");

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
            {/* Placeholder implementation: plain mailto link. Intended future behavior is a lightweight
                purpose-selector modal ("Request my CV" / "Discuss an opportunity" / "Just want to connect"),
                each prefilling a different message template — not built yet. */}
            <a href="mailto:nedyuen@gmail.com" className="font-mono text-xs font-semibold px-4 py-2 rounded-full text-white ml-1 hover:opacity-90 transition-opacity" style={{ background: ACCENT }}>Contact Me</a>
          </div>
        </div>
      </div>

      {/* HERO / CAREER PROFILE */}
      <header className="max-w-4xl mx-auto px-6 pt-14 pb-10">
        <div className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: ACCENT }}>Professional Summary</div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-[1.05] tracking-tight max-w-2xl">
          Senior Strategy &amp; Transformation Lead, 13 years inside Capital Markets.
        </h1>
        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-6 sm:gap-8 items-start">
          <Headshot size={160} />
          <div className="space-y-3 max-w-xl flex-1 min-w-0">
            {SUMMARY.map((s) => (
              <p key={s} className="text-sm text-black/70 leading-relaxed">{s}</p>
            ))}
          </div>
        </div>

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

        <div className="mt-8">
          <div className="font-mono text-[10px] tracking-widest text-black/40 uppercase mb-2">Roles I'm looking for</div>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <a key={r} href={explorerLink({ preset: r })} className="font-mono text-xs px-3 py-1.5 rounded-full border hover:text-white transition-colors" style={{ borderColor: ACCENT, color: ACCENT }}
                onMouseEnter={(e) => e.currentTarget.style.background = ACCENT} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>{r}</a>
            ))}
          </div>
        </div>
      </header>

      {/* REASONS TO HIRE */}
      <section className="max-w-4xl mx-auto px-6 py-14 border-t border-black/10">
        <SectionHeader eyebrow="Why Hire Me" title="Why should you hire me?" icon="target" />
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
      </section>

      {/* ABOUT ME */}
      <section className="max-w-4xl mx-auto px-6 py-14 border-t border-black/10">
        <SectionHeader eyebrow="Personality & Motivators" title="What am I like to work with?" icon="spark" />
        <div className="flex gap-2 mb-6">
          <button onClick={() => setAboutTab("personality")}
            className={`px-4 py-2 rounded-md text-sm font-mono border ${aboutTab === "personality" ? "text-white border-transparent" : "border-black/15 text-black/50"}`}
            style={aboutTab === "personality" ? { background: ACCENT } : {}}>Personality</button>
          <button onClick={() => setAboutTab("workstyle")}
            className={`px-4 py-2 rounded-md text-sm font-mono border ${aboutTab === "workstyle" ? "text-white border-transparent" : "border-black/15 text-black/50"}`}
            style={aboutTab === "workstyle" ? { background: ACCENT } : {}}>Work Style</button>
        </div>
        {aboutTab === "personality" ? (
          <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2">
            {PERSONALITY.map((p) => (
              <li key={p} className="text-sm text-black/70 leading-relaxed flex gap-2">
                <span style={{ color: ACCENT }} className="shrink-0">—</span>{p}
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p className="text-sm text-black/50 mb-5">Ned enjoys doing pieces of work that allow him to:</p>
            <div className="grid md:grid-cols-2 gap-3">
              {WORK_PREFS.map((w) => (
                <div key={w} className="bg-white rounded-lg border border-black/10 p-3.5 text-sm text-black/70 leading-relaxed">{w}</div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* EXPERTISE */}
      <section className="max-w-4xl mx-auto px-6 py-14 border-t border-black/10">
        <SectionHeader eyebrow="Functional & Technical Depth" title="What are my areas of expertise?" icon="cube" />
        <p className="text-sm text-black/50 mb-6 max-w-xl">
          On paper, a Transformation Lead. In practice, working at the intersection of Strategy, Operations, Product, Data, Programming, Change, Finance and Management.
        </p>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {FUNCTIONAL.map((f) => {
            const highlights = CAREER_HIGHLIGHTS[f.cat] || [];
            return (
              <a key={f.cat} href={explorerLink({ cat: f.cat })} className="bg-white rounded-lg border border-black/10 p-3.5 flex flex-col hover:border-black/25 transition-colors">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ background: `${ACCENT}12` }}>
                    <Icon name={f.icon} size={16} color={ACCENT} />
                  </div>
                  <div>
                    <div className="font-display font-semibold text-sm mb-1">{f.cat}</div>
                    <div className="text-xs text-black/60 leading-relaxed">{f.items.join(" · ")}</div>
                  </div>
                </div>
                {highlights.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-black/10">
                    {highlights.map((h, i) => (
                      <p key={i} className="text-[11px] text-black/50 leading-relaxed line-clamp-2">
                        <span className="font-mono text-[9px] uppercase tracking-wide text-black/35 mr-1">Example —</span>
                        {HIGHLIGHT_TEXT[h.ref]}
                      </p>
                    ))}
                    <div className="text-[10px] font-mono mt-1.5" style={{ color: ACCENT }}>See all {f.cat} achievements →</div>
                  </div>
                )}
              </a>
            );
          })}
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
        <SectionHeader eyebrow="Work History" title="What is my professional journey?" icon="chart" />
        <p className="text-[11px] text-black/40 mb-2">Click a company or role below to explore its evidence →</p>

        <div>
          {[...TIMELINE].reverse().map((t, i) => (
            <div key={i} className="flex gap-6 py-5 border-b border-black/10 last:border-0">
              <div className="font-mono text-xs text-black/40 w-24 shrink-0 pt-1">{t.years}</div>
              <div>
                <div className="font-display font-semibold text-sm">
                  <a href={explorerLink({ company: t.org, jobRole: t.jobRole || t.role, groupBy: "role" })}
                    className="hover:underline underline-offset-2" style={{ color: INK }}>{t.role}</a>
                  {" · "}
                  <a href={explorerLink({ company: t.org, groupBy: "company" })}
                    className="hover:underline underline-offset-2" style={{ color: ACCENTS[t.org] }}>{t.org}</a>
                </div>
                <div className="text-sm text-black/60 mt-1 leading-relaxed">{t.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EDUCATION & QUALIFICATIONS */}
      <section className="max-w-4xl mx-auto px-6 py-14 border-t border-black/10">
        <SectionHeader eyebrow="Education & Certifications" title="What are my qualifications?" icon="cap" />
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

      {/* TESTIMONIALS */}
      <section className="max-w-4xl mx-auto px-6 py-14 border-t border-black/10">
        <SectionHeader eyebrow="Testimonials" title="What do people say about me?" icon="quote" />
        <div className="grid md:grid-cols-2 gap-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.title} className="bg-white rounded-lg border border-black/10 border-l-4 p-4" style={{ borderLeftColor: ACCENT }}>
              <p className="text-sm text-black/70 italic leading-relaxed">"{TESTIMONIAL_TEXT[t.title]}"</p>
              <div className="font-mono text-[11px] text-black/40 mt-3">— {t.source}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <footer className="max-w-4xl mx-auto px-6 py-16 border-t border-black/10">
        <div className="grid grid-cols-3 gap-3 mb-10">
          <a href={explorerLink({ tier: "highlighted" })} className="bg-white rounded-lg border border-black/10 p-4 text-center hover:border-black/25 transition-colors">
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
        <div className="flex items-center gap-5 mt-8 pt-8 border-t border-black/10">
          <a href="mailto:nedyuen@gmail.com" className="flex items-center gap-1.5 text-xs font-mono text-black/50 hover:text-black transition-colors">
            <Icon name="mail" size={14} color="currentColor" />nedyuen@gmail.com
          </a>
          {/* Placeholder URL — Ned needs to fill in his real LinkedIn profile link. */}
          <a href="https://linkedin.com/in/PLACEHOLDER" className="flex items-center gap-1.5 text-xs font-mono text-black/50 hover:text-black transition-colors">
            <Icon name="link" size={14} color="currentColor" />LinkedIn
          </a>
        </div>
      </footer>
    </div>
  );
}
