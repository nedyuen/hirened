import { useState } from "react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`;
const INK = "#1C2230";
const ACCENT = "#1F5C56";
const PROFILE_URL = "/";
const EXPLORER_URL = "/explorer";

const SAMPLE_QUESTIONS = [
  "What's your biggest achievement at JP Morgan?",
  "Why did you move from Operations into Transformation?",
  "What's your experience with AI and ML implementation?",
  "Tell me about a time you led without formal authority.",
];

export default function Interview() {
  const [draft, setDraft] = useState("");

  return (
    <div className="min-h-screen bg-[#F2F3EF] text-ink font-body flex flex-col">
      <style>{`
        ${FONT_IMPORT}
        .text-ink { color:${INK}; }
        .font-display { font-family:'Space Grotesk', sans-serif; }
        .font-body { font-family:'Inter', sans-serif; }
        .font-mono { font-family:'IBM Plex Mono', monospace; }
        @keyframes pulse-dot { 0%,100% { opacity:.3 } 50% { opacity:1 } }
        .dot { animation: pulse-dot 1.4s ease-in-out infinite; }
      `}</style>

      {/* NAV */}
      <div className="sticky top-0 z-20 backdrop-blur bg-[#F2F3EF]/90 border-b border-black/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href={PROFILE_URL} className="font-display font-semibold tracking-tight">Ned Yuen</a>
          <div className="flex items-center gap-2">
            <a href={PROFILE_URL} className="font-mono text-xs px-3 py-1.5 rounded-full border border-black/15 text-black/60 hover:border-black/30">Career Profile</a>
            <a href={EXPLORER_URL} className="font-mono text-xs px-3 py-1.5 rounded-full border border-black/15 text-black/60 hover:border-black/30">Achievement Explorer</a>
            <span className="font-mono text-xs px-3 py-1.5 rounded-full text-white" style={{ background: ACCENT }}>Interview Mode</span>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center py-16">
          <div className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: ACCENT }}>InterviewNed.Now</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight">
            Ask me anything about my career.
          </h1>
          <p className="text-black/60 text-sm mt-4 leading-relaxed max-w-md mx-auto">
            A chatbot trained on this entire site — Profile, Achievement Explorer, everything —
            so you can interview me before you interview me.
          </p>

          <div className="mt-3 inline-flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-black/5 text-black/50">
            <span className="flex gap-0.5">
              <span className="dot" style={{ animationDelay: "0s" }}>●</span>
              <span className="dot" style={{ animationDelay: "0.2s" }}>●</span>
              <span className="dot" style={{ animationDelay: "0.4s" }}>●</span>
            </span>
            Coming soon
          </div>

          {/* mock disabled chat input */}
          <div className="mt-10 text-left">
            <div className="bg-white rounded-xl border border-black/10 p-4 opacity-60">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {SAMPLE_QUESTIONS.map((q) => (
                  <span key={q} className="text-[10px] font-mono px-2 py-1 rounded-md bg-black/5 text-black/40">{q}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-black/10 pt-3">
                <input
                  disabled
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ask a question about Ned's experience…"
                  className="flex-1 text-sm bg-transparent outline-none cursor-not-allowed text-black/40 placeholder:text-black/30"
                />
                <span className="font-mono text-xs px-3 py-1.5 rounded-full text-white/70" style={{ background: `${ACCENT}80` }}>Send</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <a href={PROFILE_URL} className="font-mono text-xs px-4 py-2 rounded-full border border-black/15 text-black/60 hover:border-black/30">← Back to Profile</a>
            <a href={EXPLORER_URL} className="font-mono text-xs px-4 py-2 rounded-full text-white" style={{ background: ACCENT }}>Browse Achievements →</a>
          </div>
        </div>
      </main>
    </div>
  );
}
