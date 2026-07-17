/* ============================================================
   MAREA OS — Agents: organigramma a nodi + dettaglio agente
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, PhoneCall, Layers, Wallet, Crown, X,
  Play, Pause, Power, RotateCw, Activity, ArrowRight,
} from "lucide-react";
import { useStore, useDerived, useEvents, useAgentsState } from "../data/store.js";
import { AGENTS, AGENT_MODES } from "../data/agents.js";
import { isToday, fmtTime, fmtDate } from "../data/events.js";
import { Card, Eyebrow, Pill, Btn, Bar, FeedRow, Empty, Tabs } from "../components/ui/index.jsx";

const ICONS = { "lead-intel": Search, outreach: Send, sales: PhoneCall, ops: Layers, finance: Wallet };
const STATUS = {
  online:  { label: "Online", color: "#41F5A2" },
  running: { label: "In esecuzione", color: "#26E6FF" },
  waiting: { label: "In attesa", color: "#8B97A8" },
  paused:  { label: "In pausa", color: "#FFC857" },
  approval:{ label: "Richiede approvazione", color: "#9D6CFF" },
  error:   { label: "Errore", color: "#FF5E6C" },
  off:     { label: "Spento", color: "#5A6675" },
};

function agentStats(events) {
  const today = events.filter((e) => isToday(e.ts)).length;
  const errors = events.filter((e) => e.type.includes("error")).length;
  const by = (t) => events.filter((e) => e.type === t).length;
  let success = null;
  const sent = by("email.sent"), rep = by("email.replied");
  const found = by("lead.found"), ver = by("lead.verified");
  const calls = by("call.made"), meet = by("meeting.scheduled");
  if (sent) success = Math.round((rep / sent) * 100);
  else if (found) success = Math.round((ver / found) * 100);
  else if (calls) success = Math.round((meet / calls) * 100);
  return { today, total: events.length, errors, success };
}

/* ---------- Nodo agente ---------- */
function AgentNode({ agent, state, stats, active, selected, onClick }) {
  const Icon = ICONS[agent.id] || Activity;
  const st = STATUS[state?.status] || STATUS.off;
  return (
    <button onClick={onClick}
      className={`card card-hover relative z-10 flex w-full flex-col gap-2 p-3.5 text-left ${selected ? "!border-[rgba(38,230,255,.5)]" : ""}`}>
      <AnimatePresence>
        {active && (
          <motion.span className="pointer-events-none absolute inset-0 rounded-2xl"
            initial={{ opacity: 0.7, boxShadow: `0 0 0 0 ${agent.color}` }}
            animate={{ opacity: 0, boxShadow: `0 0 0 8px ${agent.color}00` }}
            transition={{ duration: 1.1 }} style={{ border: `1px solid ${agent.color}` }} />
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: agent.color + "16", color: agent.color }}>
          <Icon size={17} strokeWidth={1.9} />
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${state?.status === "online" || state?.status === "running" ? "live-dot" : ""}`} style={{ background: st.color }} />
          <span className="num text-[8.5px] font-semibold tracking-wide" style={{ color: st.color }}>{st.label.toUpperCase()}</span>
        </span>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-fg">{agent.name}</p>
        <p className="truncate text-[10px] text-muted">{agent.role}</p>
      </div>
      <p className="line-clamp-1 rounded-lg border border-hair2 bg-white/[0.012] px-2 py-1 text-[10px] text-muted">{state?.currentTask || "In attesa di task"}</p>
      <div className="num flex items-center justify-between text-[9.5px] text-faint">
        <span><span className="text-cyan">{stats.today}</span> oggi</span>
        <span style={{ color: stats.errors ? "#FF5E6C" : "#5A6675" }}>{stats.errors} err</span>
        {stats.success != null && <span className="text-green">{stats.success}%</span>}
      </div>
    </button>
  );
}

/* ---------- Grafo ---------- */
function OrgGraph({ agentsState, statsById, activeId, selectedId, onSelect }) {
  const N = AGENTS.length;
  return (
    <Card className="relative overflow-hidden p-5 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <Eyebrow>ORGANIZZAZIONE · MAREA CREATIVE</Eyebrow>
        <Pill tone="cyan" dot>{AGENTS.filter((a) => ["online", "running"].includes(agentsState[a.id]?.status)).length} attivi</Pill>
      </div>

      {/* Saliou */}
      <div className="mb-1 flex justify-center">
        <div className="card flex items-center gap-3 border-[rgba(38,230,255,.35)] bg-[rgba(38,230,255,.05)] px-5 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan to-blue text-[15px] font-bold text-[#04121a]">S</span>
          <div>
            <p className="text-[14px] font-bold text-fg">Saliou</p>
            <p className="num flex items-center gap-1.5 text-[9.5px] tracking-wide text-cyan"><Crown size={11} /> CEO · HUMAN COMMAND</p>
          </div>
          <div className="ml-2 border-l border-hair pl-3 text-center">
            <p className="num text-[15px] font-bold text-violet">{AGENTS.filter((a) => agentsState[a.id]?.mode === "approval").length}</p>
            <p className="eyebrow">APPROVAZIONI</p>
          </div>
        </div>
      </div>

      {/* Connettori SVG (colonne uguali → anchor a (i+0.5)/N) */}
      <div className="relative">
        <svg viewBox="0 0 1000 90" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-0 h-[70px] w-full">
          <line x1="500" y1="0" x2="500" y2="30" stroke="rgba(120,190,255,0.25)" strokeWidth="1.5" />
          <line x1={1000 * 0.5 / N} y1="30" x2={1000 * (N - 0.5) / N} y2="30" stroke="rgba(120,190,255,0.18)" strokeWidth="1.5" />
          {AGENTS.map((a, i) => {
            const x = 1000 * (i + 0.5) / N;
            const on = activeId === a.id;
            return (
              <g key={a.id}>
                <line x1={x} y1="30" x2={x} y2="70" stroke={on ? a.color : "rgba(120,190,255,0.18)"} strokeWidth={on ? 2.2 : 1.5}
                  style={{ transition: "stroke 0.3s" }} />
                {i < N - 1 && (
                  <line x1={x} y1="30" x2={1000 * (i + 1.5) / N} y2="30"
                    stroke={activeId === AGENTS[i + 1]?.id ? AGENTS[i + 1].color : "transparent"} strokeWidth="2.5" style={{ transition: "stroke 0.3s" }} />
                )}
              </g>
            );
          })}
        </svg>
        <div className="grid gap-3 pt-[74px]" style={{ gridTemplateColumns: `repeat(${N}, minmax(0,1fr))` }}>
          {AGENTS.map((a) => (
            <AgentNode key={a.id} agent={a} state={agentsState[a.id]} stats={statsById[a.id]}
              active={activeId === a.id} selected={selectedId === a.id} onClick={() => onSelect(a.id)} />
          ))}
        </div>
      </div>

      {/* Flusso di collaborazione */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 rounded-xl border border-hair2 bg-white/[0.012] px-4 py-2.5">
        {["Lead Intelligence", "Outreach", "Sales", "Operations", "Finance"].map((n, i) => (
          <React.Fragment key={n}>
            <span className="text-[10.5px] font-medium text-muted">{n}</span>
            {i < 4 && <ArrowRight size={12} className="text-faint" />}
          </React.Fragment>
        ))}
        <span className="ml-2 text-[9.5px] text-faint">· il lead passa di mano lungo la catena, con approvazione di Saliou sulle azioni sensibili</span>
      </div>
    </Card>
  );
}

/* ---------- Pannello dettaglio ---------- */
function DetailPanel({ agentId, onClose }) {
  const agent = AGENTS.find((a) => a.id === agentId);
  const setAgent = useStore((s) => s.setAgent);
  const state = useAgentsState()[agentId];
  const { agentEvents } = useDerived();
  const events = agentEvents[agentId] || [];
  const stats = agentStats(events);
  const [tab, setTab] = useState("overview");
  const Icon = ICONS[agentId] || Activity;
  const st = STATUS[state?.status] || STATUS.off;
  const idx = AGENTS.findIndex((a) => a.id === agentId);
  const prev = AGENTS[idx - 1], next = AGENTS[idx + 1];

  const TABS = [
    { id: "overview", label: "Overview" }, { id: "perf", label: "Perf." },
    { id: "log", label: "Log" }, { id: "comm", label: "Comms" }, { id: "settings", label: "Config" },
  ];

  return (
    <motion.aside className="fixed right-0 top-0 z-30 flex h-full w-[420px] max-w-full flex-col border-l border-hair bg-[#080c12] shadow-2xl"
      initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }} transition={{ type: "spring", stiffness: 360, damping: 34 }}>
      <div className="flex items-center justify-between border-b border-hair p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: agent.color + "18", color: agent.color }}><Icon size={19} strokeWidth={1.9} /></span>
          <div>
            <p className="text-[15px] font-semibold text-fg">{agent.name}</p>
            <p className="num flex items-center gap-1.5 text-[10px]" style={{ color: st.color }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} /> {st.label}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted hover:text-fg"><X size={18} /></button>
      </div>

      <div className="overflow-x-auto border-b border-hair px-4 py-3"><Tabs tabs={TABS} active={tab} onChange={setTab} /></div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "overview" && (
          <div className="grid gap-3">
            <div><Eyebrow>RUOLO</Eyebrow><p className="mt-1 text-[13px] leading-relaxed text-muted">{agent.desc}</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="card-2 p-3"><Eyebrow>MODALITÀ</Eyebrow><p className="mt-1 text-[13px] font-medium text-fg">{AGENT_MODES.find((m) => m.id === state?.mode)?.label || "—"}</p></div>
              <div className="card-2 p-3"><Eyebrow>STATO</Eyebrow><p className="mt-1 text-[13px] font-medium" style={{ color: st.color }}>{st.label}</p></div>
            </div>
            <div className="card-2 p-3"><Eyebrow>TASK CORRENTE</Eyebrow><p className="mt-1 text-[12.5px] text-fg">{state?.currentTask || "Nessun task in corso"}</p></div>
            <div><Eyebrow className="mb-1.5 block">CAPACITÀ</Eyebrow><div className="flex flex-wrap gap-1.5">{agent.capabilities.map((c) => <span key={c} className="rounded-lg border border-hair bg-white/[0.02] px-2 py-1 text-[10px] text-muted">{c}</span>)}</div></div>
          </div>
        )}
        {tab === "perf" && (
          <div className="grid grid-cols-2 gap-3">
            {[
              ["ATTIVITÀ OGGI", stats.today, "#26E6FF"], ["ATTIVITÀ TOTALI", stats.total, "#F5F8FC"],
              ["TASSO SUCCESSO", stats.success != null ? stats.success + "%" : "—", "#41F5A2"], ["ERRORI", stats.errors, stats.errors ? "#FF5E6C" : "#5A6675"],
            ].map(([l, v, c]) => (
              <div key={l} className="card-2 p-3.5"><Eyebrow>{l}</Eyebrow><p className="num mt-1.5 text-[22px] font-bold" style={{ color: c }}>{v}</p></div>
            ))}
            {stats.success != null && (
              <div className="col-span-2 card-2 p-3.5"><Eyebrow>PERFORMANCE</Eyebrow><Bar pct={stats.success} color="#41F5A2" className="mt-2" /></div>
            )}
          </div>
        )}
        {tab === "log" && (
          events.length ? <div className="flex flex-col gap-1.5">{events.slice(-40).reverse().map((e) => <FeedRow key={e.id} evt={e} />)}</div>
            : <Empty title="Nessuna attività" hint="Le operazioni dell'agente appariranno qui." />
        )}
        {tab === "comm" && (
          <div className="grid gap-3">
            <div className="card-2 p-3.5">
              <Eyebrow>AGENTI COLLEGATI</Eyebrow>
              <div className="mt-2 flex items-center gap-2 text-[12px]">
                <span className="text-muted">{prev ? prev.name : "Saliou"}</span>
                <ArrowRight size={13} className="text-cyan" />
                <span className="font-semibold text-fg">{agent.name}</span>
                <ArrowRight size={13} className="text-cyan" />
                <span className="text-muted">{next ? next.name : "Saliou"}</span>
              </div>
            </div>
            <div className="card-2 p-3.5">
              <Eyebrow>SCAMBI RECENTI</Eyebrow>
              <div className="mt-2 grid gap-1.5">
                {prev && <p className="text-[11.5px] text-muted">← Riceve lead da <span className="text-fg">{prev.name}</span></p>}
                {next && <p className="text-[11.5px] text-muted">→ Trasferisce a <span className="text-fg">{next.name}</span> al passo successivo</p>}
                <p className="text-[11.5px] text-muted">⤴ Richiede approvazione a <span className="text-cyan">Saliou</span> per azioni sensibili</p>
              </div>
            </div>
          </div>
        )}
        {tab === "settings" && (
          <div className="grid gap-3">
            <div className="card-2 p-3.5">
              <Eyebrow>MODALITÀ OPERATIVA</Eyebrow>
              <div className="mt-2 grid gap-1.5">
                {AGENT_MODES.map((m) => (
                  <button key={m.id} onClick={() => setAgent(agentId, { mode: m.id })}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-left ${state?.mode === m.id ? "bg-[rgba(38,230,255,.1)]" : "hover:bg-white/[0.03]"}`}>
                    <span><span className={`text-[12px] font-medium ${state?.mode === m.id ? "text-cyan" : "text-fg"}`}>{m.label}</span><span className="ml-2 text-[10px] text-faint">{m.desc}</span></span>
                    {state?.mode === m.id && <span className="text-cyan">✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-2 flex items-center justify-between p-3.5">
              <div><Eyebrow>LIMITE GIORNALIERO</Eyebrow><p className="mt-0.5 text-[11px] text-faint">Azioni max / giorno</p></div>
              <input type="number" defaultValue={50} className="num w-20 rounded-lg border border-hair bg-bg px-2 py-1 text-[12px] text-fg outline-none focus:border-[rgba(38,230,255,.5)]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {state?.status !== "online" && state?.status !== "running"
                ? <Btn tone="cyan" onClick={() => setAgent(agentId, { status: "online" })}><Play size={12} className="mr-1 inline" />Avvia</Btn>
                : <Btn onClick={() => setAgent(agentId, { status: "paused" })}><Pause size={12} className="mr-1 inline" />Pausa</Btn>}
              <Btn onClick={() => setAgent(agentId, { status: "online" })}><RotateCw size={12} className="mr-1 inline" />Riavvia</Btn>
              <Btn tone="danger" onClick={() => setAgent(agentId, { status: "off", currentTask: null })}><Power size={12} className="mr-1 inline" />Off</Btn>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

export default function Agents() {
  const agentsState = useAgentsState();
  const { agentEvents } = useDerived();
  const events = useEvents();
  const [selected, setSelected] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const lastLen = useRef(events.length);

  const statsById = useMemo(() => Object.fromEntries(AGENTS.map((a) => [a.id, agentStats(agentEvents[a.id] || [])])), [agentEvents]);

  // illumina il nodo dell'agente dell'ultimo evento
  useEffect(() => {
    if (events.length === lastLen.current) return;
    lastLen.current = events.length;
    const last = events[events.length - 1];
    if (last && AGENTS.some((a) => a.id === last.source)) {
      setActiveId(last.source);
      const t = setTimeout(() => setActiveId(null), 1100);
      return () => clearTimeout(t);
    }
  }, [events]);

  return (
    <div className="mx-auto max-w-[1440px] p-4 lg:p-5">
      <OrgGraph agentsState={agentsState} statsById={statsById} activeId={activeId} selectedId={selected} onSelect={setSelected} />
      <p className="mt-3 text-center text-[11px] text-faint">Clicca un agente per aprirne il dettaglio: performance, activity log, comunicazioni e controlli.</p>
      <AnimatePresence>
        {selected && (
          <>
            <motion.div className="fixed inset-0 z-20 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} />
            <DetailPanel agentId={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
