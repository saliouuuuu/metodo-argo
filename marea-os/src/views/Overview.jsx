/* ============================================================
   MAREA OS — Overview: il centro di comando
   Neural Core al centro, attività di oggi a sinistra, feed
   live a destra, barra KPI (i soldi) in basso.
   ============================================================ */
import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TrendingUp, TrendingDown, Users, Activity } from "lucide-react";
import NeuralCore from "../core3d/NeuralCore.jsx";
import { useStore, useDerived, useEvents, useAgentsState } from "../data/store.js";
import { AGENTS } from "../data/agents.js";
import { Panel, SysLabel, Rolling, FeedItem, Stat } from "../components/ui.jsx";
import { fmtEur } from "../data/events.js";

function KpiBar({ finance, clients }) {
  const items = [
    { label: "PROFIT", value: finance.profit, eur: true, color: finance.profit >= 0 ? "#34d399" : "#f87171", Icon: TrendingUp },
    { label: "REVENUE", value: finance.income, eur: true, color: "#67e8f9", Icon: TrendingUp },
    { label: "EXPENSES", value: finance.expenses, eur: true, color: "#fbbf24", Icon: TrendingDown },
    { label: "PIPELINE", value: finance.pipelineValue, eur: true, color: "#a78bfa", Icon: Activity },
    { label: "CLIENTS", value: clients, eur: false, color: "#e4e4e7", Icon: Users },
  ];
  return (
    <Panel className="grid grid-cols-5 divide-x divide-white/[0.05]">
      {items.map(({ label, value, eur, color, Icon }) => (
        <div key={label} className="flex items-center gap-3 px-5 py-3.5">
          <Icon size={15} strokeWidth={1.75} className="shrink-0 text-zinc-600" />
          <div className="min-w-0">
            <SysLabel>{label}</SysLabel>
            <p className="mt-1 text-lg font-medium leading-none" style={{ color }}>
              <Rolling value={value} prefix={eur ? "€" : ""} />
            </p>
          </div>
        </div>
      ))}
    </Panel>
  );
}

function Funnel({ funnel }) {
  const steps = [
    ["LEADS", funnel.leads, "#67e8f9"],
    ["CONTACTED", funnel.contacted, "#60a5fa"],
    ["REPLIES", funnel.replied, "#a78bfa"],
    ["MEETINGS", funnel.meetings, "#f0abfc"],
    ["QUOTES", funnel.quotes, "#fbbf24"],
    ["WON", funnel.won, "#34d399"],
  ];
  const max = Math.max(1, funnel.leads);
  return (
    <div className="grid gap-2">
      {steps.map(([label, n, color]) => (
        <div key={label} className="flex items-center gap-2.5">
          <span className="label-sys w-[76px] shrink-0">{label}</span>
          <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-white/[0.05]">
            <motion.div className="h-full rounded-full" style={{ background: color + "cc" }}
              animate={{ width: `${Math.max(n > 0 ? 4 : 0, (n / max) * 100)}%` }}
              transition={{ type: "spring", stiffness: 90, damping: 22 }} />
          </div>
          <span className="num w-9 shrink-0 text-right text-[11.5px] text-zinc-300">{n}</span>
        </div>
      ))}
    </div>
  );
}

function AgentStrip() {
  const agents = useAgentsState();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {AGENTS.map((a) => {
        const st = agents[a.id]?.status || "off";
        const c = st === "online" ? "#34d399" : st === "paused" ? "#fbbf24" : "#52525b";
        return (
          <span key={a.id} className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1">
            <span className={`h-1.5 w-1.5 rounded-full ${st === "online" ? "dot-live" : ""}`} style={{ background: c }} />
            <span className="num text-[9px] tracking-[0.12em] text-zinc-400">{a.name.toUpperCase()}</span>
          </span>
        );
      })}
    </div>
  );
}

export default function Overview() {
  const derived = useDerived();
  const events = useEvents();
  const pulse = useStore((s) => s.corePulse);
  const { today, funnel, finance, clients, followupsPending, followupsOverdue } = derived;

  const feed = useMemo(() => events.slice(-30).reverse(), [events]);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_320px] gap-4">
        {/* OGGI */}
        <div className="flex min-h-0 flex-col gap-4">
          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <SysLabel>ATTIVITÀ DI OGGI</SysLabel>
              <span className="num text-[9px] text-zinc-600">{new Date().toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" })}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="LEAD TROVATI" value={today.leadsFound} accent="#67e8f9" />
              <Stat label="CONTATTATE" value={today.contacted + today.emailsSent} accent="#60a5fa" />
              <Stat label="EMAIL INVIATE" value={today.emailsSent} accent="#60a5fa" />
              <Stat label="RISPOSTE" value={today.replies} accent="#34d399" />
              <Stat label="CHIAMATE" value={today.calls} accent="#a78bfa" />
              <Stat label="APPUNTAMENTI" value={today.meetings} accent="#f0abfc" />
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2">
              <span className="text-[11px] text-zinc-400">Follow-up da fare</span>
              <span className="num text-[12px] font-semibold" style={{ color: followupsOverdue.length ? "#fbbf24" : "#34d399" }}>
                {followupsPending.length}{followupsOverdue.length ? ` · ${followupsOverdue.length} in ritardo` : ""}
              </span>
            </div>
          </Panel>

          <Panel className="flex-1 p-4">
            <SysLabel className="mb-3 block">FUNNEL · TUTTO IL PERIODO</SysLabel>
            <Funnel funnel={funnel} />
          </Panel>
        </div>

        {/* CORE — integrato nello sfondo, nessun riquadro */}
        <div className="relative flex min-h-0 flex-col overflow-visible">
          <div className="pointer-events-none z-10 flex items-center justify-between px-2 pt-1">
            <SysLabel>MAREA CORE</SysLabel>
            <span className="num flex items-center gap-1.5 text-[9px] tracking-[0.2em] text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 dot-live" /> NEURAL LINK ACTIVE
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <NeuralCore pulse={pulse} />
          </div>
          <div className="z-10 flex items-center justify-between gap-3 px-2 pb-1">
            <AgentStrip />
            <span className="num shrink-0 text-[9px] tracking-[0.15em] text-zinc-600">
              {events.length.toLocaleString("it-IT")} EVENTS
            </span>
          </div>
        </div>

        {/* FEED */}
        <Panel className="flex min-h-0 flex-col p-3.5">
          <div className="mb-2.5 flex items-center justify-between px-0.5">
            <SysLabel>LIVE ACTIVITY</SysLabel>
            <span className="flex items-center gap-1.5 text-[9.5px] text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-live" /> streaming
            </span>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="flex flex-col gap-1.5">
              <AnimatePresence initial={false}>
                {feed.map((e) => (
                  <motion.div key={e.id} layout
                    initial={{ opacity: 0, y: -12, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}>
                    <FeedItem evt={e} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black to-transparent" />
          </div>
        </Panel>
      </div>

      <KpiBar finance={finance} clients={clients} />
    </div>
  );
}
