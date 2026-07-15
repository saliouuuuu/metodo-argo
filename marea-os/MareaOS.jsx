import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  Activity,
  Cpu,
  Radio,
  Waves,
  Gauge,
  Signal,
  Shield,
  Database,
  Globe,
  Layers,
  Command,
  Sparkles,
  TrendingUp,
  Users,
  Mail,
  Zap,
  CircleDot,
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

/**
 * MAREA OS — Personal Operating System Dashboard
 * -------------------------------------------------------------
 * A single-file, self-contained React experience. Drop it into any
 * React environment (Vite, Next.js client component, Claude Artifacts).
 *
 * Dependencies: react, framer-motion, lucide-react, tailwindcss.
 *
 * Design language: architectural precision, invisible glass, hairline
 * borders, calm ambient motion. No neon, no gamer HUD, no fake Jarvis.
 */

/* ------------------------------------------------------------------ */
/*  DESIGN TOKENS                                                      */
/* ------------------------------------------------------------------ */

const EVENT_TYPES = {
  info: {
    label: "Info",
    dot: "bg-sky-400",
    ring: "ring-sky-400/30",
    text: "text-sky-300",
    glow: "rgba(56,189,248,0.55)",
    Icon: Info,
  },
  success: {
    label: "Success",
    dot: "bg-emerald-400",
    ring: "ring-emerald-400/30",
    text: "text-emerald-300",
    glow: "rgba(52,211,153,0.55)",
    Icon: CheckCircle2,
  },
  warning: {
    label: "Warning",
    dot: "bg-amber-400",
    ring: "ring-amber-400/30",
    text: "text-amber-300",
    glow: "rgba(251,191,36,0.55)",
    Icon: AlertTriangle,
  },
  ai: {
    label: "AI Decision",
    dot: "bg-violet-400",
    ring: "ring-violet-400/30",
    text: "text-violet-300",
    glow: "rgba(167,139,250,0.55)",
    Icon: BrainCircuit,
  },
};

// Realistic agency events. Each carries the metric deltas it applies.
const EVENT_TEMPLATES = [
  { type: "info", verb: "Lead discovered", ctx: () => pickOne(SOURCES), metric: { leads: 1 } },
  { type: "ai", verb: "Email drafted", ctx: () => pickOne(CLIENTS), metric: { emails: 1 } },
  { type: "success", verb: "Revenue booked", ctx: () => `+$${rand(180, 2400).toLocaleString()}`, metric: { revenue: () => rand(180, 2400), emails: 0 } },
  { type: "info", verb: "Proposal sent", ctx: () => pickOne(CLIENTS), metric: { proposals: 1 } },
  { type: "success", verb: "Invoice settled", ctx: () => `+$${rand(400, 3800).toLocaleString()}`, metric: { revenue: () => rand(400, 3800) } },
  { type: "ai", verb: "Campaign re-optimized", ctx: () => pickOne(CHANNELS), metric: { conversion: () => randFloat(-0.2, 0.6) } },
  { type: "ai", verb: "Follow-up sequenced", ctx: () => pickOne(CLIENTS), metric: { emails: 1 } },
  { type: "info", verb: "Meeting scheduled", ctx: () => pickOne(CLIENTS), metric: {} },
  { type: "success", verb: "Contract signed", ctx: () => pickOne(CLIENTS), metric: { revenue: () => rand(2500, 9000), leads: 0 } },
  { type: "warning", verb: "Anomaly flagged", ctx: () => pickOne(SYSTEMS), metric: {} },
  { type: "ai", verb: "Segment reclustered", ctx: () => `${rand(3, 12)} cohorts`, metric: {} },
  { type: "warning", verb: "Rate limit approaching", ctx: () => pickOne(SYSTEMS), metric: {} },
  { type: "info", verb: "Lead qualified", ctx: () => pickOne(SOURCES), metric: { leads: 1 } },
  { type: "success", verb: "Client onboarded", ctx: () => pickOne(CLIENTS), metric: { revenue: () => rand(1500, 6000) } },
];

const SOURCES = ["LinkedIn", "Referral", "Inbound", "Cold outreach", "Webinar", "Newsletter"];
const CLIENTS = ["Northwind", "Atlas Group", "Meridian", "Lumen Co", "Vantage", "Halcyon", "Orbit Labs", "Bluepeak"];
const CHANNELS = ["Paid social", "Email", "Search", "Retargeting", "Partnerships"];
const SYSTEMS = ["Enrichment API", "Mail gateway", "CRM sync", "Billing", "Scraper pool"];

const NAV_ITEMS = [
  { label: "Overview", Icon: Command, active: true },
  { label: "Pipeline", Icon: Layers },
  { label: "Automations", Icon: Zap },
  { label: "Intelligence", Icon: BrainCircuit },
  { label: "Clients", Icon: Users },
  { label: "Comms", Icon: Mail },
];

const SYSTEM_STATUS = [
  { label: "Core", Icon: Cpu, value: "Nominal", tone: "text-emerald-300", dot: "bg-emerald-400" },
  { label: "Data mesh", Icon: Database, value: "Synced", tone: "text-emerald-300", dot: "bg-emerald-400" },
  { label: "Network", Icon: Globe, value: "42ms", tone: "text-sky-300", dot: "bg-sky-400" },
  { label: "Agents", Icon: Radio, value: "7 online", tone: "text-sky-300", dot: "bg-sky-400" },
  { label: "Security", Icon: Shield, value: "Sealed", tone: "text-emerald-300", dot: "bg-emerald-400" },
];

/* ------------------------------------------------------------------ */
/*  UTILITIES                                                          */
/* ------------------------------------------------------------------ */

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => Math.random() * (max - min) + min;
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

let _seq = 0;
const nextId = () => `evt-${Date.now()}-${_seq++}`;

/* ------------------------------------------------------------------ */
/*  SIMULATION ENGINE                                                  */
/* ------------------------------------------------------------------ */

/**
 * The heartbeat of Marea OS. Every 3–8s it dispatches a realistic event
 * that updates the feed, nudges the metrics, and pulses the Core.
 */
function useSimulationEngine() {
  const [events, setEvents] = useState(() =>
    Array.from({ length: 6 }, () => buildEvent()).map((e, i) => ({
      ...e,
      time: new Date(Date.now() - i * 9000),
    }))
  );
  const [metrics, setMetrics] = useState({
    revenue: 1284500,
    leads: 3182,
    emails: 41207,
    proposals: 214,
    conversion: 4.7,
  });
  const [pulse, setPulse] = useState({ key: 0, type: "info" });

  const dispatch = useCallback(() => {
    const evt = buildEvent();

    setEvents((prev) => [evt, ...prev].slice(0, 14));
    setPulse((p) => ({ key: p.key + 1, type: evt.type }));

    setMetrics((prev) => {
      const next = { ...prev };
      const m = evt.template.metric || {};
      if (m.revenue) next.revenue += typeof m.revenue === "function" ? m.revenue() : m.revenue;
      if (m.leads) next.leads += m.leads;
      if (m.emails) next.emails += m.emails;
      if (m.proposals) next.proposals += m.proposals;
      if (m.conversion) {
        const d = typeof m.conversion === "function" ? m.conversion() : m.conversion;
        next.conversion = Math.max(2, Math.min(9, +(prev.conversion + d).toFixed(1)));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let timer;
    const loop = () => {
      timer = setTimeout(() => {
        dispatch();
        loop();
      }, rand(3000, 8000));
    };
    loop();
    return () => clearTimeout(timer);
  }, [dispatch]);

  return { events, metrics, pulse };
}

function buildEvent() {
  const template = pickOne(EVENT_TEMPLATES);
  return {
    id: nextId(),
    type: template.type,
    verb: template.verb,
    ctx: template.ctx ? template.ctx() : "",
    template,
    time: new Date(),
  };
}

/* ------------------------------------------------------------------ */
/*  AMBIENT BACKGROUND                                                 */
/* ------------------------------------------------------------------ */

const GridBackground = memo(function GridBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* base wash */}
      <div className="absolute inset-0 bg-[#09090B]" />
      {/* technical grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 85%)",
        }}
      />
      {/* sparse coordinate dots */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: "radial-gradient(rgba(148,163,184,0.18) 1px, transparent 1px)",
          backgroundSize: "128px 128px",
          backgroundPosition: "32px 32px",
          maskImage: "radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)",
        }}
      />
      {/* restrained radial tint */}
      <div className="absolute left-1/2 top-[38%] h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.06),transparent_62%)]" />
      {/* digital noise */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  MAREA CORE — the aesthetic heart                                   */
/* ------------------------------------------------------------------ */

const ORBIT_MARKERS = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);
const RADIAL_SPOKES = Array.from({ length: 24 }, (_, i) => (i / 24) * 360);

const MareaCore = memo(function MareaCore({ pulse }) {
  const rippleControls = useAnimation();
  const [ripple, setRipple] = useState({ key: 0, color: EVENT_TYPES.info.glow });

  // React to engine pulses with a brief, calm ripple.
  useEffect(() => {
    if (pulse.key === 0) return;
    const color = (EVENT_TYPES[pulse.type] || EVENT_TYPES.info).glow;
    setRipple({ key: pulse.key, color });
  }, [pulse]);

  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[440px] items-center justify-center">
      {/* deep breathing halo (idle state) */}
      <motion.div
        className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.10),transparent_65%)]"
        animate={{ opacity: [0.35, 0.6, 0.35], scale: [0.96, 1.02, 0.96] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform, opacity" }}
      />

      {/* event ripple */}
      <AnimatePresence>
        <motion.span
          key={ripple.key}
          className="absolute rounded-full"
          style={{ boxShadow: `0 0 0 1px ${ripple.color}`, willChange: "transform, opacity" }}
          initial={{ width: 120, height: 120, opacity: 0.55 }}
          animate={{ width: 420, height: 420, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.2, ease: "easeOut" }}
        />
      </AnimatePresence>

      <svg viewBox="0 0 400 400" className="relative h-full w-full">
        <defs>
          <radialGradient id="coreFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(56,189,248,0.22)" />
            <stop offset="55%" stopColor="rgba(56,189,248,0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="ringStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(125,211,252,0.7)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0.15)" />
          </linearGradient>
        </defs>

        {/* radial grid */}
        <g stroke="rgba(148,163,184,0.10)" strokeWidth="0.5">
          {[60, 110, 155, 185].map((r) => (
            <circle key={r} cx="200" cy="200" r={r} fill="none" />
          ))}
          {RADIAL_SPOKES.map((deg) => {
            const a = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={200 + Math.cos(a) * 62}
                y1={200 + Math.sin(a) * 62}
                x2={200 + Math.cos(a) * 184}
                y2={200 + Math.sin(a) * 184}
              />
            );
          })}
        </g>

        {/* outer ring — slow clockwise */}
        <motion.g
          style={{ originX: "200px", originY: "200px", willChange: "transform" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        >
          <circle
            cx="200"
            cy="200"
            r="185"
            fill="none"
            stroke="url(#ringStroke)"
            strokeWidth="1"
            strokeDasharray="2 10"
          />
          {ORBIT_MARKERS.map((a, i) => (
            <g key={i}>
              <circle cx={200 + Math.cos(a) * 185} cy={200 + Math.sin(a) * 185} r="2.4" fill="rgba(125,211,252,0.9)" />
              <text
                x={200 + Math.cos(a) * 185}
                y={200 + Math.sin(a) * 185 - 7}
                fill="rgba(148,163,184,0.5)"
                fontSize="6"
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
              >
                {String(Math.round((a * 180) / Math.PI)).padStart(3, "0")}
              </text>
            </g>
          ))}
        </motion.g>

        {/* mid ring — slow counter-clockwise, segmented */}
        <motion.g
          style={{ originX: "200px", originY: "200px", willChange: "transform" }}
          animate={{ rotate: -360 }}
          transition={{ duration: 62, repeat: Infinity, ease: "linear" }}
        >
          <circle
            cx="200"
            cy="200"
            r="150"
            fill="none"
            stroke="rgba(56,189,248,0.28)"
            strokeWidth="1"
            strokeDasharray="46 26"
          />
          {ORBIT_MARKERS.filter((_, i) => i % 2 === 0).map((a, i) => (
            <circle key={i} cx={200 + Math.cos(a) * 150} cy={200 + Math.sin(a) * 150} r="1.8" fill="rgba(56,189,248,0.7)" />
          ))}
        </motion.g>

        {/* inner ring — clockwise, hairline */}
        <motion.g
          style={{ originX: "200px", originY: "200px", willChange: "transform" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="200" cy="200" r="112" fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="0.5" strokeDasharray="1 6" />
        </motion.g>

        {/* breathing core disc */}
        <motion.circle
          cx="200"
          cy="200"
          r="58"
          fill="url(#coreFill)"
          stroke="rgba(125,211,252,0.35)"
          strokeWidth="0.75"
          style={{ willChange: "transform, opacity" }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* scan line sweeping across the disc */}
        <motion.g
          style={{ originX: "200px", originY: "200px", willChange: "transform" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <line x1="200" y1="200" x2="200" y2="88" stroke="rgba(125,211,252,0.5)" strokeWidth="1" />
        </motion.g>

        {/* center mark */}
        <circle cx="200" cy="200" r="3" fill="rgba(224,242,254,0.9)" />
      </svg>

      {/* center label */}
      <div className="pointer-events-none absolute flex flex-col items-center">
        <Waves className="mb-1 h-5 w-5 text-sky-300/80" strokeWidth={1.25} />
        <span className="text-[10px] font-medium tracking-[0.35em] text-slate-300/90">MAREA</span>
        <span className="text-[8px] tracking-[0.3em] text-slate-500">CORE · ONLINE</span>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  ROLLING NUMBERS                                                    */
/* ------------------------------------------------------------------ */

const DIGIT_H = 1.05; // em

const AnimatedDigit = memo(function AnimatedDigit({ char }) {
  if (!/\d/.test(char)) {
    return <span className="tabular-nums">{char}</span>;
  }
  const d = Number(char);
  return (
    <span className="relative inline-block overflow-hidden tabular-nums" style={{ height: `${DIGIT_H}em`, width: "0.62em" }}>
      <motion.span
        className="absolute left-0 top-0 flex flex-col items-center"
        animate={{ y: `-${d * DIGIT_H}em` }}
        transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.6 }}
        style={{ willChange: "transform" }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} style={{ height: `${DIGIT_H}em`, lineHeight: `${DIGIT_H}em` }}>
            {i}
          </span>
        ))}
      </motion.span>
    </span>
  );
});

const RollingNumber = memo(function RollingNumber({ value, prefix = "", suffix = "", className = "" }) {
  const str = useMemo(() => value.toLocaleString("en-US"), [value]);
  const [glow, setGlow] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setGlow(true);
    const t = setTimeout(() => setGlow(false), 650);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span
      className={`inline-flex items-baseline leading-none transition-[text-shadow] duration-500 ${className}`}
      style={{ textShadow: glow ? "0 0 14px rgba(125,211,252,0.65)" : "0 0 0 transparent" }}
    >
      {prefix && <span className="mr-0.5 text-slate-400">{prefix}</span>}
      {str.split("").map((c, i) => (
        <AnimatedDigit key={`${i}-${c === "," ? "," : "d"}`} char={c} />
      ))}
      {suffix && <span className="ml-0.5 text-slate-400">{suffix}</span>}
    </span>
  );
});

/* ------------------------------------------------------------------ */
/*  PREMIUM CIRCULAR METRIC                                            */
/* ------------------------------------------------------------------ */

const CircularMetric = memo(function CircularMetric({ label, value, unit, accent = "sky", detail }) {
  const pct = Math.max(0, Math.min(100, value));
  const R = 52;
  const C = 2 * Math.PI * R;
  const SEGMENTS = 40;
  const filled = Math.round((pct / 100) * SEGMENTS);

  const accents = {
    sky: { stroke: "rgb(56,189,248)", soft: "rgba(56,189,248,0.14)", text: "text-sky-300" },
    emerald: { stroke: "rgb(52,211,153)", soft: "rgba(52,211,153,0.14)", text: "text-emerald-300" },
    amber: { stroke: "rgb(251,191,36)", soft: "rgba(251,191,36,0.14)", text: "text-amber-300" },
    violet: { stroke: "rgb(167,139,250)", soft: "rgba(167,139,250,0.14)", text: "text-violet-300" },
  }[accent];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[128px] w-[128px]">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          {/* tick marks */}
          {Array.from({ length: SEGMENTS }, (_, i) => {
            const a = (i / SEGMENTS) * Math.PI * 2;
            const on = i < filled;
            return (
              <line
                key={i}
                x1={64 + Math.cos(a) * 44}
                y1={64 + Math.sin(a) * 44}
                x2={64 + Math.cos(a) * 50}
                y2={64 + Math.sin(a) * 50}
                stroke={on ? accents.stroke : "rgba(148,163,184,0.16)"}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}
          {/* base track */}
          <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(148,163,184,0.10)" strokeWidth="3" />
          {/* progress arc */}
          <motion.circle
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke={accents.stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={false}
            animate={{ strokeDashoffset: C - (pct / 100) * C }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
            style={{ filter: `drop-shadow(0 0 4px ${accents.soft})` }}
          />
          {/* orbit indicator */}
          <motion.g
            style={{ originX: "64px", originY: "64px", willChange: "transform" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          >
            <circle cx="64" cy={64 - 58} r="1.6" fill="rgba(148,163,184,0.5)" />
          </motion.g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-light tabular-nums ${accents.text}`}>
            {value}
            <span className="text-sm text-slate-500">{unit}</span>
          </span>
          {detail && <span className="mt-0.5 text-[9px] tracking-[0.2em] text-slate-500">{detail}</span>}
        </div>
      </div>
      <span className="mt-3 text-[10px] font-medium tracking-[0.28em] text-slate-400">{label}</span>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  LIVE ACTIVITY FEED                                                 */
/* ------------------------------------------------------------------ */

const ActivityItem = memo(function ActivityItem({ evt }) {
  const t = EVENT_TYPES[evt.type] || EVENT_TYPES.info;
  const { Icon } = t;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -14, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="group relative"
      style={{ willChange: "transform, opacity" }}
    >
      <div className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2.5 transition-colors hover:bg-white/[0.03]">
        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${t.dot} ring-4 ${t.ring}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon className={`h-3 w-3 ${t.text}`} strokeWidth={1.75} />
            <p className="truncate text-[12.5px] font-medium text-slate-200">{evt.verb}</p>
          </div>
          {evt.ctx && <p className="mt-0.5 truncate text-[11px] text-slate-500">{evt.ctx}</p>}
        </div>
        <time className="mt-0.5 shrink-0 text-[10px] tabular-nums tracking-tight text-slate-600">
          {evt.time.toLocaleTimeString("en-GB", { hour12: false })}
        </time>
      </div>
    </motion.li>
  );
});

const ActivityFeed = memo(function ActivityFeed({ events }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-sky-300" strokeWidth={1.75} />
          <h2 className="text-[11px] font-semibold tracking-[0.28em] text-slate-300">LIVE ACTIVITY</h2>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          streaming
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <ul className="flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {events.map((evt) => (
              <ActivityItem key={evt.id} evt={evt} />
            ))}
          </AnimatePresence>
        </ul>
        {/* fade at the bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#09090B] to-transparent" />
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  PANELS / CHROME                                                    */
/* ------------------------------------------------------------------ */

const Panel = ({ className = "", children }) => (
  <div
    className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl ${className}`}
    style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.03)" }}
  >
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <span className="text-[10px] font-semibold tracking-[0.28em] text-slate-500">{children}</span>
);

function LeftColumn({ clock }) {
  return (
    <div className="flex h-full flex-col gap-5">
      {/* brand */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
          <Waves className="h-[18px] w-[18px] text-sky-300" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[13px] font-semibold tracking-wide text-slate-100">Marea OS</p>
          <p className="text-[10px] tracking-[0.2em] text-slate-500">FOUNDER · v4.2</p>
        </div>
      </div>

      {/* navigation */}
      <Panel className="p-2">
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ label, Icon, active }) => (
            <button
              key={label}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors ${
                active ? "bg-white/[0.06] text-slate-100" : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-sky-300" : "text-slate-500 group-hover:text-slate-300"}`} strokeWidth={1.75} />
              <span className="flex-1">{label}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />}
            </button>
          ))}
        </nav>
      </Panel>

      {/* system status */}
      <Panel className="flex-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>SYSTEM STATUS</SectionLabel>
          <Signal className="h-3.5 w-3.5 text-emerald-300/80" strokeWidth={1.75} />
        </div>
        <ul className="flex flex-col gap-3">
          {SYSTEM_STATUS.map(({ label, Icon, value, tone, dot }) => (
            <li key={label} className="flex items-center gap-3">
              <Icon className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
              <span className="flex-1 text-[12px] text-slate-400">{label}</span>
              <span className={`text-[11px] tabular-nums ${tone}`}>{value}</span>
              <motion.span
                className={`h-1.5 w-1.5 rounded-full ${dot}`}
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
              />
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between">
            <SectionLabel>LOCAL TIME</SectionLabel>
            <span className="text-[11px] tabular-nums text-slate-300">{clock}</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 28 }, (_, i) => (
              <motion.span
                key={i}
                className="h-4 flex-1 rounded-sm bg-sky-400/30"
                animate={{ scaleY: [0.3, Math.random() * 0.8 + 0.3, 0.3] }}
                transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
                style={{ transformOrigin: "bottom", willChange: "transform" }}
              />
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function CenterColumn({ pulse }) {
  return (
    <div className="flex h-full flex-col gap-5">
      <Panel className="relative flex-1 overflow-hidden p-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-sky-300" strokeWidth={1.75} />
            <SectionLabel>MAREA CORE</SectionLabel>
          </div>
          <span className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            OPERATIONAL
          </span>
        </div>

        <MareaCore pulse={pulse} />

        {/* core sub-metrics */}
        <div className="mt-2 grid grid-cols-3 gap-3">
          {[
            { k: "Autonomy", v: "98.2%", tone: "text-emerald-300" },
            { k: "Signal", v: "Strong", tone: "text-sky-300" },
            { k: "Queue", v: "0 stuck", tone: "text-slate-300" },
          ].map((m) => (
            <div key={m.k} className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-3 py-2.5 text-center">
              <p className="text-[9px] tracking-[0.22em] text-slate-500">{m.k.toUpperCase()}</p>
              <p className={`mt-1 text-[13px] font-medium ${m.tone}`}>{m.v}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* premium circular metrics */}
      <Panel className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <CircleDot className="h-3.5 w-3.5 text-sky-300" strokeWidth={1.75} />
          <SectionLabel>OPERATIONAL LOAD</SectionLabel>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <CircularMetric label="PIPELINE" value={82} unit="%" accent="sky" detail="HEALTHY" />
          <CircularMetric label="AUTOMATION" value={96} unit="%" accent="emerald" detail="UPTIME" />
          <CircularMetric label="CAPACITY" value={64} unit="%" accent="amber" detail="LOAD" />
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BOTTOM BAR — high-level business metrics                           */
/* ------------------------------------------------------------------ */

const BottomBar = memo(function BottomBar({ metrics }) {
  const items = [
    { label: "MONTHLY REVENUE", Icon: TrendingUp, value: metrics.revenue, prefix: "$", accent: "text-emerald-300" },
    { label: "ACTIVE LEADS", Icon: Users, value: metrics.leads, accent: "text-sky-300" },
    { label: "EMAILS SENT", Icon: Mail, value: metrics.emails, accent: "text-violet-300" },
    { label: "PROPOSALS", Icon: Layers, value: metrics.proposals, accent: "text-slate-200" },
    { label: "CONVERSION", Icon: Sparkles, value: metrics.conversion, suffix: "%", accent: "text-amber-300" },
  ];
  return (
    <Panel className="grid grid-cols-2 gap-px overflow-hidden bg-white/[0.04] md:grid-cols-5">
      {items.map(({ label, Icon, value, prefix, suffix, accent }) => (
        <div key={label} className="flex items-center gap-3 bg-[#0a0a0d]/60 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
            <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-[9.5px] tracking-[0.2em] text-slate-500">{label}</p>
            <p className={`mt-0.5 text-lg font-light ${accent}`}>
              <RollingNumber value={value} prefix={prefix} suffix={suffix} />
            </p>
          </div>
        </div>
      ))}
    </Panel>
  );
});

/* ------------------------------------------------------------------ */
/*  STARTUP SEQUENCE                                                   */
/* ------------------------------------------------------------------ */

const BOOT_LINES = [
  "Establishing secure channel",
  "Authenticating founder identity",
  "Mounting data mesh",
  "Spinning up autonomous agents",
  "Calibrating Marea Core",
];

function StartupSequence({ onDone }) {
  const [phase, setPhase] = useState(0); // 0 title, 1 boot, 2 assemble, 3 welcome
  const [line, setLine] = useState(0);

  useEffect(() => {
    const timers = [];
    timers.push(setTimeout(() => setPhase(1), 1100));
    // boot lines
    BOOT_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setLine(i + 1), 1400 + i * 420));
    });
    timers.push(setTimeout(() => setPhase(2), 1400 + BOOT_LINES.length * 420 + 200));
    timers.push(setTimeout(() => setPhase(3), 1400 + BOOT_LINES.length * 420 + 1500));
    timers.push(setTimeout(() => onDone(), 1400 + BOOT_LINES.length * 420 + 3100));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
    >
      {/* thin top line + title */}
      <div className="relative flex flex-col items-center">
        <motion.div
          className="mb-6 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent"
          initial={{ width: 0 }}
          animate={{ width: 220 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        />
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.1em" }}
          animate={{ opacity: 1, letterSpacing: "0.55em" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="pl-[0.55em] text-[13px] font-light text-slate-200"
        >
          MAREA SYSTEM
        </motion.p>

        {/* assembling core */}
        <div className="my-10 h-[180px] w-[180px]">
          <AnimatePresence>
            {phase >= 2 && (
              <motion.svg
                viewBox="0 0 180 180"
                className="h-full w-full"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
                {[80, 60, 40].map((r, i) => (
                  <motion.circle
                    key={r}
                    cx="90"
                    cy="90"
                    r={r}
                    fill="none"
                    stroke="rgba(125,211,252,0.4)"
                    strokeWidth="0.75"
                    strokeDasharray="2 8"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: i * 0.25 }}
                    style={{ originX: "90px", originY: "90px" }}
                  />
                ))}
                {ORBIT_MARKERS.map((a, i) => (
                  <motion.circle
                    key={i}
                    cx={90 + Math.cos(a) * 80}
                    cy={90 + Math.sin(a) * 80}
                    r="1.8"
                    fill="rgba(125,211,252,0.9)"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                  />
                ))}
                <motion.circle
                  cx="90"
                  cy="90"
                  r="2.5"
                  fill="rgba(224,242,254,0.9)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </div>

        {/* boot log */}
        <div className="h-24 w-[300px]">
          <AnimatePresence mode="wait">
            {phase === 1 && (
              <motion.ul
                key="boot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-1.5 font-mono text-[11px] text-slate-500"
              >
                {BOOT_LINES.slice(0, line).map((l, i) => (
                  <motion.li
                    key={l}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-400/80" strokeWidth={2} />
                    <span>{l}</span>
                  </motion.li>
                ))}
              </motion.ul>
            )}

            {phase >= 2 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: phase === 3 ? 1 : 0, y: 0 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
              >
                <p className="text-[15px] font-light tracking-[0.4em] text-slate-100">WELCOME BACK</p>
                <p className="mt-2 text-[10px] tracking-[0.25em] text-slate-500">MAREA OS · READY</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  ROOT                                                               */
/* ------------------------------------------------------------------ */

export default function MareaOS() {
  const [booted, setBooted] = useState(false);
  const { events, metrics, pulse } = useSimulationEngine();
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleDone = useCallback(() => setBooted(true), []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#09090B] font-sans text-slate-200 antialiased">
      <GridBackground />

      <AnimatePresence>{!booted && <StartupSequence onDone={handleDone} />}</AnimatePresence>

      <AnimatePresence>
        {booted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-10 mx-auto flex min-h-screen max-w-[1440px] flex-col gap-5 px-5 py-5 lg:px-8 lg:py-7"
          >
            {/* top bar */}
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium tracking-wide text-slate-300">Command Center</span>
                <span className="hidden items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[10px] text-slate-500 sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  All systems operational
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Cpu className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="tabular-nums">{clock}</span>
              </div>
            </header>

            {/* main 3-column grid */}
            <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)_340px]">
              <aside className="order-2 lg:order-1">
                <LeftColumn clock={clock} />
              </aside>

              <main className="order-1 lg:order-2">
                <CenterColumn pulse={pulse} />
              </main>

              <aside className="order-3">
                <Panel className="h-full p-4">
                  <ActivityFeed events={events} />
                </Panel>
              </aside>
            </div>

            {/* bottom metrics bar */}
            <BottomBar metrics={metrics} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
