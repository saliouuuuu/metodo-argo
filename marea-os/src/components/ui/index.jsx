/* ============================================================
   MAREA OS — Primitive UI condivise
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState, memo } from "react";
import { motion } from "framer-motion";
import { CATS, EVENT_TYPES, fmtTime } from "../../data/events.js";
import { AGENT_BY_ID } from "../../data/agents.js";

/* ---------- Card ---------- */
export const Card = ({ className = "", hover = false, ambient, children, ...rest }) => (
  <div className={`${ambient === "cyan" ? "ambient-cyan" : ambient === "green" ? "ambient-green" : "card"} ${hover ? "card-hover" : ""} ${className}`} {...rest}>
    {children}
  </div>
);

export const Eyebrow = ({ children, className = "" }) => (
  <span className={`eyebrow ${className}`}>{children}</span>
);

/* ---------- Numeri con rolling ---------- */
const DIGIT_H = 1.06;
const Digit = memo(function Digit({ ch }) {
  if (!/\d/.test(ch)) return <span>{ch}</span>;
  const d = Number(ch);
  return (
    <span className="relative inline-block overflow-hidden align-baseline" style={{ height: `${DIGIT_H}em`, width: "0.6em" }}>
      <motion.span className="absolute left-0 top-0 flex flex-col items-center"
        animate={{ y: `-${d * DIGIT_H}em` }}
        transition={{ type: "spring", stiffness: 240, damping: 30, mass: 0.7 }}
        style={{ willChange: "transform" }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} style={{ height: `${DIGIT_H}em`, lineHeight: `${DIGIT_H}em` }}>{i}</span>
        ))}
      </motion.span>
    </span>
  );
});

export const Rolling = memo(function Rolling({ value, prefix = "", suffix = "", glowColor = "rgba(38,230,255,.55)", className = "" }) {
  const str = useMemo(() => {
    const n = typeof value === "number" && isFinite(value) ? value : 0;
    return Math.round(n) === n ? n.toLocaleString("it-IT")
      : n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [value]);
  const [glow, setGlow] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setGlow(true); const t = setTimeout(() => setGlow(false), 600); return () => clearTimeout(t);
  }, [value]);
  return (
    <span className={`num inline-flex items-baseline leading-none transition-[text-shadow] duration-500 ${className}`}
      style={{ textShadow: glow ? `0 0 18px ${glowColor}` : "none" }}>
      {prefix && <span className="mr-1 opacity-60">{prefix}</span>}
      {str.split("").map((c, i) => <Digit key={i} ch={c} />)}
      {suffix && <span className="ml-0.5 opacity-60">{suffix}</span>}
    </span>
  );
});

/* ---------- Delta +/- ---------- */
export function Delta({ pct, className = "" }) {
  if (pct == null) return null;
  const up = pct >= 0;
  return (
    <span className={`num inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${className}`}
      style={{ color: up ? "#41F5A2" : "#FF5E6C", background: up ? "rgba(65,245,162,.1)" : "rgba(255,94,108,.1)" }}>
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

/* ---------- Pill ---------- */
const TONES = {
  cyan: "#26E6FF", blue: "#3388FF", green: "#41F5A2", violet: "#9D6CFF",
  red: "#FF5E6C", yellow: "#FFC857", muted: "#8B97A8",
};
export function Pill({ tone = "muted", children, className = "", dot = false }) {
  const c = TONES[tone] || tone;
  return (
    <span className={`num inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide ${className}`}
      style={{ color: c, background: c + "14", border: `1px solid ${c}2e` }}>
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />}
      {children}
    </span>
  );
}

/* ---------- Bottoni ---------- */
export function Btn({ children, tone = "ghost", size = "md", className = "", ...rest }) {
  const tones = {
    ghost: "border border-hair text-muted hover:text-fg hover:border-[rgba(120,190,255,.28)] hover:bg-white/[0.03]",
    cyan: "border border-[rgba(38,230,255,.35)] bg-[rgba(38,230,255,.1)] text-cyan hover:bg-[rgba(38,230,255,.18)]",
    solid: "bg-cyan text-[#04121a] font-semibold hover:brightness-110",
    danger: "border border-[rgba(255,94,108,.3)] bg-[rgba(255,94,108,.06)] text-red hover:bg-[rgba(255,94,108,.14)]",
  };
  const sizes = { sm: "px-2.5 py-1 text-[11px]", md: "px-3 py-1.5 text-[12px]", lg: "px-4 py-2 text-[13px]" };
  return (
    <button className={`rounded-lg font-medium transition-colors ${tones[tone]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/* ---------- Progress segmentata ---------- */
export function Segmented({ pct, color = "#26E6FF", segments = 32, className = "" }) {
  const on = Math.round((Math.max(0, Math.min(100, pct)) / 100) * segments);
  return (
    <div className={`flex items-center gap-[3px] ${className}`}>
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className="h-2.5 flex-1 rounded-full transition-colors"
          style={{ background: i < on ? color : "rgba(255,255,255,0.07)", boxShadow: i < on && i === on - 1 ? `0 0 8px ${color}` : "none" }} />
      ))}
    </div>
  );
}

/* ---------- Progress bar liscia ---------- */
export function Bar({ pct, color = "#26E6FF", className = "", h = 7 }) {
  return (
    <div className={`overflow-hidden rounded-full bg-white/[0.06] ${className}`} style={{ height: h }}>
      <motion.div className="h-full rounded-full" style={{ background: color }}
        initial={false} animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        transition={{ type: "spring", stiffness: 90, damping: 22 }} />
    </div>
  );
}

/* ---------- Sparkline ---------- */
export function Sparkline({ data, color = "#26E6FF", w = 120, h = 34, fill = true }) {
  if (!data || data.length < 2) return <svg width={w} height={h} />;
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => [ (i / (data.length - 1)) * w, h - 3 - ((v - min) / rng) * (h - 6) ]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${d} L${w},${h} L0,${h} Z`;
  const id = "sg" + Math.round(w + h + data.length + max);
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity="0.28" /><stop offset="1" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill={color} />
    </svg>
  );
}

/* ---------- Chip sorgente evento ---------- */
export function SourceChip({ source }) {
  const agent = AGENT_BY_ID[source];
  const label = agent ? agent.name : source === "manual" ? "Manuale" : source === "api" ? "API" : "Demo";
  const color = agent ? agent.color : source === "manual" ? "#8B97A8" : source === "api" ? "#26E6FF" : "#9D6CFF";
  return (
    <span className="num inline-flex shrink-0 items-center whitespace-nowrap rounded px-1.5 py-px text-[8.5px] font-medium tracking-wide"
      style={{ color, background: color + "12", border: `1px solid ${color}26` }}>
      {label}
    </span>
  );
}

/* ---------- Riga feed (senza layout-shift/sovrapposizioni) ---------- */
export const FeedRow = memo(function FeedRow({ evt }) {
  const meta = EVENT_TYPES[evt.type] || { cat: "info", label: evt.type };
  const cat = CATS[meta.cat] || CATS.info;
  const d = evt.data || {};
  const detail = d.leadName || d.name || d.note || d.subject ||
    (d.amount != null ? "€ " + Number(d.amount).toLocaleString("it-IT") : "") || d.title || "";
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-hair2 bg-white/[0.012] px-3 py-2">
      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: cat.dot, boxShadow: `0 0 7px ${cat.dot}66` }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[12px] font-medium text-fg">{meta.label}</p>
          <time className="num shrink-0 text-[9.5px] text-faint">{fmtTime(evt.ts)}</time>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[10.5px] text-muted">{detail || "—"}</p>
          <SourceChip source={evt.source} />
        </div>
      </div>
    </div>
  );
});

/* ---------- Empty state ---------- */
export function Empty({ title, hint, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-hair py-12 text-center ${className}`}>
      <p className="text-[13px] text-muted">{title}</p>
      {hint && <p className="max-w-[360px] text-[11px] leading-relaxed text-faint">{hint}</p>}
    </div>
  );
}

/* ---------- Tabs ---------- */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-hair2 bg-card2 p-1">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`num rounded-lg px-3 py-1.5 text-[11px] font-medium tracking-wide transition-colors ${
            active === t.id ? "bg-[rgba(38,230,255,.12)] text-cyan" : "text-muted hover:text-fg"}`}>
          {t.label}{t.count != null && <span className="ml-1.5 opacity-60">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
