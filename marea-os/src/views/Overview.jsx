/* ============================================================
   MAREA OS — Overview / Command Center (3 livelli)
   1) Hero finanziario · 2) Marea Core + essenziali · 3) Priorità + Live
   ============================================================ */
import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  TrendingUp, Users, Mail, CalendarClock, Wallet,
  AlertTriangle, PhoneCall, BellRing, Flag, ArrowUpRight,
} from "lucide-react";
import NeuralCore from "../core3d/NeuralCore.jsx";
import { useStore, useDerived, useEvents, useAgentsState } from "../data/store.js";
import { AGENTS } from "../data/agents.js";
import { financeStats, forecast } from "../data/analytics.js";
import { Card, Eyebrow, Rolling, Delta, FeedRow, Bar, Pill, Empty } from "../components/ui/index.jsx";
import { fmtEur, fmtDate, isToday } from "../data/events.js";

/* ---------- Livello 1: hero finanziario ---------- */
function FinancialHero({ derived, goal }) {
  const stats = financeStats(derived);
  const fc = forecast(derived, goal);
  return (
    <Card ambient="cyan" className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.3fr_1fr] lg:p-7">
      <div className="min-w-0">
        <Eyebrow>VALORE GENERATO · TOTALE</Eyebrow>
        <div className="mt-2 flex items-end gap-3">
          <span className="text-[46px] font-extrabold leading-none tracking-tight text-fg lg:text-[56px]">
            <Rolling value={derived.finance.profit} prefix="€" />
          </span>
          <Delta pct={stats.growth} className="mb-2" />
        </div>
        <p className="mt-2 text-[12.5px] text-muted">
          <span className="num text-green">{fmtEur(stats.monthIncome)}</span> generati questo mese · margine <span className="num text-fg">{derived.finance.income ? Math.round((derived.finance.profit / derived.finance.income) * 100) : 0}%</span>
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { l: "ENTRATE", v: derived.finance.income, c: "#41F5A2" },
            { l: "SPESE", v: derived.finance.expenses, c: "#FFC857" },
            { l: "PIPELINE", v: derived.finance.pipelineValue, c: "#9D6CFF" },
          ].map((m) => (
            <div key={m.l}>
              <Eyebrow>{m.l}</Eyebrow>
              <p className="num mt-1 text-[17px] font-semibold" style={{ color: m.c }}>{fmtEur(m.v)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-2xl border border-hair bg-black/20 p-5">
        <div className="flex items-center justify-between">
          <Eyebrow>OBIETTIVO MENSILE</Eyebrow>
          <Pill tone={fc.reachedPct >= 100 ? "green" : "cyan"}>{fc.reachedPct}%</Pill>
        </div>
        <div className="my-3">
          <p className="num text-[22px] font-bold text-fg">
            {fmtEur(stats.monthIncome)} <span className="text-[14px] font-medium text-faint">/ {fmtEur(goal)}</span>
          </p>
          <Bar pct={fc.reachedPct} color={fc.reachedPct >= 100 ? "#41F5A2" : "#26E6FF"} className="mt-2.5" h={8} />
        </div>
        <div className="flex items-center justify-between border-t border-hair pt-3">
          <div>
            <Eyebrow>PREVISIONE FINE MESE</Eyebrow>
            <p className="num text-[15px] font-semibold text-cyan">{fmtEur(fc.endOfMonth)}</p>
          </div>
          <div className="text-right">
            <Eyebrow>PROB. OBIETTIVO</Eyebrow>
            <p className="num text-[15px] font-semibold text-fg">{fc.probability}%</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Livello 2: Core + essenziali ---------- */
function EssentialTile({ Icon, label, value, accent, prefix }) {
  return (
    <Card hover className="flex items-center gap-3 p-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: accent + "16", color: accent }}>
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <Eyebrow>{label}</Eyebrow>
        <p className="num mt-0.5 text-[19px] font-semibold text-fg"><Rolling value={value} prefix={prefix || ""} /></p>
      </div>
    </Card>
  );
}

function CoreBand({ derived, pulse, agentsState, eventsCount, mode }) {
  const onlineAgents = AGENTS.filter((a) => agentsState[a.id]?.status === "online" || agentsState[a.id]?.status === "running").length;
  const runningTasks = derived.tasks.filter((t) => !t.done).length;
  const errors = Object.values(derived.agentEvents).flat().filter((e) => e.type.includes("error") && isToday(e.ts)).length;
  const stats = financeStats(derived);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr_220px]">
      <div className="order-2 grid content-center gap-3 lg:order-1">
        <EssentialTile Icon={Users} label="LEAD OGGI" value={derived.today.leadsFound} accent="#26E6FF" />
        <EssentialTile Icon={Mail} label="EMAIL INVIATE" value={derived.today.emailsSent} accent="#3388FF" />
      </div>

      <Card className="order-1 relative flex min-h-[380px] flex-col items-center justify-center overflow-hidden lg:order-2">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3">
          <Eyebrow>MAREA CORE</Eyebrow>
          <span className="num flex items-center gap-1.5 text-[9px] tracking-[0.2em] text-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan live-dot" /> NEURAL LINK
          </span>
        </div>
        <div className="h-[360px] w-full max-w-[440px]"><NeuralCore pulse={pulse} /></div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 pb-4">
          <p className="text-[13px] font-semibold tracking-wide text-fg">Operational</p>
          <div className="num flex items-center gap-3 text-[10.5px] text-muted">
            <span><span className="text-green">{onlineAgents}</span> agenti attivi</span>
            <span className="text-faint">·</span>
            <span><span className="text-cyan">{runningTasks}</span> task in esecuzione</span>
            <span className="text-faint">·</span>
            <span><span style={{ color: errors ? "#FF5E6C" : "#8B97A8" }}>{errors}</span> errori</span>
          </div>
          <span className="num mt-1 text-[8.5px] tracking-[0.2em] text-faint">{eventsCount.toLocaleString("it-IT")} EVENTS · {mode.toUpperCase()}</span>
        </div>
      </Card>

      <div className="order-3 grid content-center gap-3">
        <EssentialTile Icon={CalendarClock} label="APPUNTAMENTI" value={derived.today.meetings} accent="#9D6CFF" />
        <EssentialTile Icon={Wallet} label="ENTRATE MESE" value={stats.monthIncome} accent="#41F5A2" prefix="€" />
      </div>
    </div>
  );
}

/* ---------- Livello 3: priorità + live ---------- */
function Priorities({ derived }) {
  const setView = useStore((s) => s.setView);
  const items = useMemo(() => {
    const out = [];
    for (const f of derived.followupsOverdue.slice(0, 4))
      out.push({ id: "f" + f.id, Icon: PhoneCall, tone: "#FF5E6C", title: `Richiama ${f.leadName}`, sub: "Follow-up in ritardo", due: f.due, tag: "URGENTE" });
    for (const f of derived.followupsPending.filter((x) => isToday(x.due)).slice(0, 3))
      out.push({ id: "ft" + f.id, Icon: BellRing, tone: "#FFC857", title: `Follow-up ${f.leadName}`, sub: "In scadenza oggi", due: f.due, tag: "OGGI" });
    for (const t of derived.tasks.filter((t) => !t.done && t.priority === "high").slice(0, 4))
      out.push({ id: "t" + t.id, Icon: Flag, tone: "#26E6FF", title: t.title, sub: "Task prioritario", due: t.due, tag: "TASK" });
    for (const l of derived.leads.filter((l) => l.stage === "quote").slice(0, 3))
      out.push({ id: "q" + l.id, Icon: ArrowUpRight, tone: "#41F5A2", title: `Chiudi ${l.name}`, sub: `Preventivo ${fmtEur(l.value || 0)} inviato`, due: l.updated, tag: "DEAL" });
    return out.slice(0, 8);
  }, [derived]);

  return (
    <Card className="flex min-h-0 flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <Eyebrow>PRIORITÀ DI OGGI</Eyebrow>
        <Pill tone={items.length ? "yellow" : "green"}>{items.length} da gestire</Pill>
      </div>
      {!items.length ? (
        <Empty title="Tutto sotto controllo" hint="Nessuna priorità urgente al momento. Le attività in ritardo o in scadenza appariranno qui." />
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((it) => (
            <button key={it.id} onClick={() => setView(it.tag === "TASK" ? "tasks" : it.tag === "DEAL" ? "pipeline" : "outreach")}
              className="card-hover flex items-center gap-3 rounded-xl border border-hair2 bg-white/[0.012] px-3 py-2.5 text-left">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: it.tone + "18", color: it.tone }}>
                <it.Icon size={15} strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-fg">{it.title}</p>
                <p className="truncate text-[10.5px] text-muted">{it.sub}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="num rounded px-1.5 py-px text-[8.5px] font-bold tracking-wide" style={{ color: it.tone, background: it.tone + "16" }}>{it.tag}</span>
                {it.due && <span className="num text-[9px] text-faint">{fmtDate(it.due)}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

function LiveActivity({ events }) {
  const feed = useMemo(() => events.slice(-22).reverse(), [events]);
  return (
    <Card className="flex min-h-0 flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <Eyebrow>LIVE ACTIVITY</Eyebrow>
        <span className="flex items-center gap-1.5 text-[9.5px] text-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-green live-dot" /> streaming
        </span>
      </div>
      <div className="relative max-h-[420px] min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {feed.map((e) => (
              <motion.div key={e.id}
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}>
                <FeedRow evt={e} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}

export default function Overview() {
  const derived = useDerived();
  const events = useEvents();
  const agentsState = useAgentsState();
  const pulse = useStore((s) => s.corePulse);
  const mode = useStore((s) => s.mode);
  const goal = useStore((s) => s.settings.revenueGoal) || 5000;

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-4 p-4 lg:p-5">
      <FinancialHero derived={derived} goal={goal} />
      <CoreBand derived={derived} pulse={pulse} agentsState={agentsState} eventsCount={events.length} mode={mode} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Priorities derived={derived} />
        <LiveActivity events={events} />
      </div>
    </div>
  );
}
