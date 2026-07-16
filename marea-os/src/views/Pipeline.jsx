/* ============================================================
   MAREA OS — Pipeline: kanban lead → cliente
   ============================================================ */
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, XCircle } from "lucide-react";
import { useStore, useDerived } from "../data/store.js";
import { STAGES, STAGE_INDEX, fmtEur, fmtDate } from "../data/events.js";
import { SysLabel, Empty } from "../components/ui.jsx";

const NEXT_EVENT = {
  new: ["lead.verified", "Verifica"],
  verified: ["lead.contacted", "Contatta"],
  contacted: ["email.replied", "Risposta"],
  replied: ["meeting.scheduled", "Appuntamento"],
  meeting: ["quote.sent", "Preventivo"],
  quote: ["client.won", "Chiudi ✓"],
};

function LeadCard({ lead }) {
  const addEvent = useStore((s) => s.addEvent);
  const next = NEXT_EVENT[lead.stage];
  const terminal = lead.stage === "won" || lead.stage === "lost";
  const [amount, setAmount] = useState("");
  const needsAmount = next && next[0] === "quote.sent";

  const advance = () => {
    const data = { leadId: lead.id, leadName: lead.name };
    if (needsAmount) { if (!amount) return; data.amount = Number(amount); }
    if (next[0] === "client.won" && lead.value) data.amount = lead.value;
    if (next[0] === "email.replied") { data.emailId = "manual"; data.classification = "interested"; }
    addEvent(next[0], data);
  };

  return (
    <motion.div layout className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[12.5px] font-medium text-zinc-200">{lead.name}</p>
        {lead.value > 0 && <span className="num shrink-0 text-[11px] text-amber-300">{fmtEur(lead.value)}</span>}
      </div>
      <p className="mt-0.5 truncate text-[10.5px] text-zinc-600">
        {[lead.sector, lead.location].filter(Boolean).join(" · ") || "—"}
      </p>
      {lead.issues && <p className="mt-1 truncate text-[10px] text-zinc-600">⚠ {lead.issues}</p>}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="num text-[9px] text-zinc-700">{fmtDate(lead.updated)}</span>
        {!terminal && next && (
          <div className="flex items-center gap-1.5">
            {needsAmount && (
              <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="€"
                className="num w-14 rounded border border-white/10 bg-black px-1.5 py-0.5 text-[10px] text-zinc-200 outline-none focus:border-cyan-400/50" />
            )}
            <button onClick={advance}
              className="flex items-center gap-0.5 rounded-md border border-cyan-400/25 bg-cyan-400/[0.08] px-2 py-1 text-[10px] font-medium text-cyan-200 hover:bg-cyan-400/20">
              {next[1]} <ChevronRight size={11} />
            </button>
            {lead.stage !== "new" && (
              <button title="Segna come perso"
                onClick={() => addEvent("client.lost", { leadId: lead.id, leadName: lead.name })}
                className="rounded-md border border-white/[0.07] p-1 text-zinc-600 hover:border-red-400/30 hover:text-red-300">
                <XCircle size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Pipeline() {
  const { leads, finance } = useDerived();
  const byStage = useMemo(() => {
    const m = Object.fromEntries(STAGES.map((s) => [s.id, []]));
    for (const l of leads) m[l.stage]?.push(l);
    return m;
  }, [leads]);

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <SysLabel>PIPELINE · {leads.length} LEAD</SysLabel>
          <span className="num text-[11px] text-violet-300">{fmtEur(finance.pipelineValue)} in trattativa</span>
        </div>
      </div>
      {!leads.length ? (
        <Empty title="Pipeline vuota" hint="Registra il primo lead con ⌘K → «Lead trovato», oppure lascia che sia il Lead Intelligence Agent a riempirla via API." />
      ) : (
        <div className="grid min-h-0 flex-1 auto-cols-[236px] grid-flow-col gap-3 overflow-x-auto pb-2">
          {STAGES.map((s) => (
            <div key={s.id} className="flex min-h-0 flex-col rounded-xl border border-white/[0.05] bg-white/[0.012]">
              <div className="flex items-center justify-between border-b border-white/[0.05] px-3 py-2.5">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                  <span className="num text-[9.5px] font-semibold tracking-[0.16em] text-zinc-400">{s.label.toUpperCase()}</span>
                </span>
                <span className="num text-[10px] text-zinc-600">{byStage[s.id].length}</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
                {byStage[s.id].map((l) => <LeadCard key={l.id} lead={l} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
