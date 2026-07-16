/* ============================================================
   MAREA OS — Kit UI di base
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState, memo } from "react";
import { motion } from "framer-motion";
import { CATS, EVENT_TYPES, fmtTime } from "../data/events.js";
import { AGENT_BY_ID } from "../data/agents.js";

export const Panel = ({ className = "", children, ...rest }) => (
  <div className={`panel ${className}`} {...rest}>{children}</div>
);

export const SysLabel = ({ children, className = "" }) => (
  <span className={`label-sys ${className}`}>{children}</span>
);

/* ---------- Numeri con rolling verticale ---------- */
const DIGIT_H = 1.05;
const Digit = memo(function Digit({ ch }) {
  if (!/\d/.test(ch)) return <span>{ch}</span>;
  const d = Number(ch);
  return (
    <span className="relative inline-block overflow-hidden align-baseline" style={{ height: `${DIGIT_H}em`, width: "0.62em" }}>
      <motion.span
        className="absolute left-0 top-0 flex flex-col items-center"
        animate={{ y: `-${d * DIGIT_H}em` }}
        transition={{ type: "spring", stiffness: 250, damping: 30, mass: 0.6 }}
        style={{ willChange: "transform" }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} style={{ height: `${DIGIT_H}em`, lineHeight: `${DIGIT_H}em` }}>{i}</span>
        ))}
      </motion.span>
    </span>
  );
});

export const Rolling = memo(function Rolling({ value, prefix = "", suffix = "", className = "" }) {
  const str = useMemo(() => {
    const n = typeof value === "number" ? value : 0;
    return Math.round(n) === n
      ? n.toLocaleString("it-IT")
      : n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [value]);
  const [glow, setGlow] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setGlow(true);
    const t = setTimeout(() => setGlow(false), 600);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <span
      className={`num inline-flex items-baseline leading-none transition-[text-shadow] duration-500 ${className}`}
      style={{ textShadow: glow ? "0 0 16px rgba(103,232,249,.7)" : "none" }}
    >
      {prefix && <span className="mr-1 text-zinc-500">{prefix}</span>}
      {str.split("").map((c, i) => <Digit key={i} ch={c} />)}
      {suffix && <span className="ml-0.5 text-zinc-500">{suffix}</span>}
    </span>
  );
});

/* ---------- Chip sorgente evento ---------- */
export function SourceChip({ source }) {
  const agent = AGENT_BY_ID[source];
  const label = agent ? agent.name.toUpperCase() : source === "manual" ? "MANUAL" : source === "api" ? "API" : "DEMO";
  const color = agent ? agent.color : source === "manual" ? "#a1a1aa" : source === "api" ? "#67e8f9" : "#f0abfc";
  return (
    <span className="num inline-flex shrink-0 items-center whitespace-nowrap rounded px-1.5 py-px text-[8.5px] tracking-wider"
      style={{ color, background: color + "14", border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

/* ---------- Riga feed evento ---------- */
export const FeedItem = memo(function FeedItem({ evt, dense = false }) {
  const meta = EVENT_TYPES[evt.type] || { cat: "info", label: evt.type };
  const cat = CATS[meta.cat];
  const d = evt.data || {};
  const detail = d.leadName || d.name || d.note || d.subject ||
    (d.amount != null ? "€ " + Number(d.amount).toLocaleString("it-IT") : "") || d.title || "";
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border border-white/[0.045] bg-white/[0.015] px-3 ${dense ? "py-1.5" : "py-2"}`}>
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: cat.dot, boxShadow: `0 0 8px ${cat.dot}55` }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[12px] font-medium text-zinc-200">{meta.label}</p>
          <time className="num shrink-0 text-[9.5px] text-zinc-600">{fmtTime(evt.ts)}</time>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[10.5px] text-zinc-500">{detail || "—"}</p>
          <SourceChip source={evt.source} />
        </div>
      </div>
    </div>
  );
});

/* ---------- Mini stat ---------- */
export function Stat({ label, value, accent = "#67e8f9", sub }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-3.5 py-3">
      <p className="label-sys">{label}</p>
      <p className="num mt-1.5 text-xl font-medium" style={{ color: accent }}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-zinc-600">{sub}</p>}
    </div>
  );
}

/* ---------- Bottoni ---------- */
export function Btn({ children, onClick, tone = "ghost", className = "", ...rest }) {
  const tones = {
    ghost: "border border-white/10 text-zinc-300 hover:bg-white/[0.05] hover:border-white/20",
    cyan: "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20",
    danger: "border border-red-400/25 bg-red-400/5 text-red-300 hover:bg-red-400/15",
  };
  return (
    <button onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${tones[tone]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/* ---------- Barra progresso segmentata ---------- */
export function Segmented({ pct, color = "#22d3ee", segments = 28 }) {
  const on = Math.round((Math.max(0, Math.min(100, pct)) / 100) * segments);
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className="h-3 w-[3px] rounded-full"
          style={{ background: i < on ? color : "rgba(255,255,255,0.08)" }} />
      ))}
    </div>
  );
}

/* ---------- Empty state ---------- */
export function Empty({ title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/[0.07] py-10 text-center">
      <p className="text-[13px] text-zinc-400">{title}</p>
      {hint && <p className="max-w-[340px] text-[11px] text-zinc-600">{hint}</p>}
    </div>
  );
}
