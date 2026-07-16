/* ============================================================
   MAREA OS — Agents: la squadra AI di Marea Creative
   Stato, modalità, task corrente, metriche, errori, cronologia
   e controlli per ogni agente.
   ============================================================ */
import React, { useMemo, useState } from "react";
import { Play, Pause, Power, Settings2 } from "lucide-react";
import { useStore, useDerived, useAgentsState } from "../data/store.js";
import { AGENTS, AGENT_MODES } from "../data/agents.js";
import { isToday } from "../data/events.js";
import { Panel, SysLabel, FeedItem, Btn, Empty } from "../components/ui.jsx";

const STATUS = {
  online: { label: "ONLINE", color: "#34d399" },
  paused: { label: "IN PAUSA", color: "#fbbf24" },
  off:    { label: "SPENTO", color: "#52525b" },
};

function AgentCard({ agent, state, events, selected, onSelect }) {
  const setAgent = useStore((s) => s.setAgent);
  const st = STATUS[state?.status || "off"];
  const todayCount = events.filter((e) => isToday(e.ts)).length;
  const errors = events.filter((e) => e.type.includes("error")).length;
  const [cfg, setCfg] = useState(false);

  return (
    <Panel className={`flex flex-col p-4 transition-colors ${selected ? "!border-cyan-400/30" : ""}`}
      onClick={() => onSelect(agent.id)} role="button">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border text-[10px] font-bold"
            style={{ borderColor: agent.color + "40", color: agent.color, background: agent.color + "0d" }}>
            {agent.code.split("-")[0]}
          </span>
          <div>
            <p className="text-[13px] font-semibold text-zinc-100">{agent.name}</p>
            <p className="text-[10px] text-zinc-600">{agent.role}</p>
          </div>
        </div>
        <span className="num flex items-center gap-1.5 text-[8.5px] font-bold tracking-[0.18em]" style={{ color: st.color }}>
          <span className={`h-1.5 w-1.5 rounded-full ${state?.status === "online" ? "dot-live" : ""}`} style={{ background: st.color }} />
          {st.label}
        </span>
      </div>

      <p className="mt-2.5 line-clamp-2 text-[10.5px] leading-relaxed text-zinc-500">{agent.desc}</p>

      <div className="mt-2.5 flex flex-wrap gap-1">
        {agent.capabilities.map((c) => (
          <span key={c} className="rounded border border-white/[0.06] bg-white/[0.02] px-1.5 py-px text-[8.5px] text-zinc-500">{c}</span>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-white/[0.05] bg-white/[0.015] px-2.5 py-2">
        <SysLabel>TASK CORRENTE</SysLabel>
        <p className="mt-1 truncate text-[11px] text-zinc-300">{state?.currentTask || "—"}</p>
      </div>

      <div className="num mt-3 grid grid-cols-3 gap-2 text-center">
        <div><p className="text-[15px] font-medium text-cyan-200">{todayCount}</p><p className="label-sys mt-0.5">OGGI</p></div>
        <div><p className="text-[15px] font-medium text-zinc-300">{events.length}</p><p className="label-sys mt-0.5">TOTALI</p></div>
        <div><p className="text-[15px] font-medium" style={{ color: errors ? "#f87171" : "#3f3f46" }}>{errors}</p><p className="label-sys mt-0.5">ERRORI</p></div>
      </div>

      <div className="mt-3.5 flex items-center gap-1.5 border-t border-white/[0.05] pt-3" onClick={(e) => e.stopPropagation()}>
        {state?.status !== "online" ? (
          <Btn tone="cyan" onClick={() => setAgent(agent.id, { status: "online" })}><Play size={11} className="mr-1 inline" />Avvia</Btn>
        ) : (
          <Btn onClick={() => setAgent(agent.id, { status: "paused" })}><Pause size={11} className="mr-1 inline" />Pausa</Btn>
        )}
        <Btn onClick={() => setAgent(agent.id, { status: "off", currentTask: null })}><Power size={11} className="mr-1 inline" />Off</Btn>
        <Btn className="ml-auto" onClick={() => setCfg(!cfg)}><Settings2 size={11} className="mr-1 inline" />Modalità</Btn>
      </div>

      {cfg && (
        <div className="mt-2 grid gap-1 rounded-lg border border-white/[0.06] bg-black/40 p-2" onClick={(e) => e.stopPropagation()}>
          {AGENT_MODES.map((m) => (
            <button key={m.id} onClick={() => { setAgent(agent.id, { mode: m.id }); setCfg(false); }}
              className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-left ${state?.mode === m.id ? "bg-cyan-400/10" : "hover:bg-white/[0.04]"}`}>
              <span>
                <span className={`text-[11px] font-medium ${state?.mode === m.id ? "text-cyan-200" : "text-zinc-300"}`}>{m.label}</span>
                <span className="ml-2 text-[9.5px] text-zinc-600">{m.desc}</span>
              </span>
              {state?.mode === m.id && <span className="text-cyan-300">✓</span>}
            </button>
          ))}
        </div>
      )}
      {!cfg && (
        <p className="num mt-2 text-[8.5px] tracking-[0.14em] text-zinc-600">
          MODE: {(AGENT_MODES.find((m) => m.id === state?.mode)?.label || "—").toUpperCase()}
        </p>
      )}
    </Panel>
  );
}

export default function Agents() {
  const { agentEvents } = useDerived();
  const agents = useAgentsState();
  const [selected, setSelected] = useState(AGENTS[0].id);
  const log = useMemo(() => (agentEvents[selected] || []).slice(-40).reverse(), [agentEvents, selected]);
  const selAgent = AGENTS.find((a) => a.id === selected);

  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_300px] gap-4 p-4">
      <div className="grid min-h-0 auto-rows-min grid-cols-2 gap-4 overflow-y-auto pb-2 2xl:grid-cols-3">
        {AGENTS.map((a) => (
          <AgentCard key={a.id} agent={a} state={agents[a.id]} events={agentEvents[a.id] || []}
            selected={selected === a.id} onSelect={setSelected} />
        ))}
      </div>

      <Panel className="flex min-h-0 flex-col p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <SysLabel>CRONOLOGIA · {selAgent?.name.toUpperCase()}</SysLabel>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: selAgent?.color }} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!log.length ? (
            <Empty title="Nessuna attività" hint="Quando l'agente lavorerà (via API o in demo), qui vedrai ogni sua operazione." />
          ) : (
            <div className="flex flex-col gap-1.5">
              {log.map((e) => <FeedItem key={e.id} evt={e} dense />)}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
