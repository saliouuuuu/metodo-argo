/* ============================================================
   MAREA OS — Pipeline: board + table, metriche, filtri
   ============================================================ */
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Table2, ChevronRight, XCircle, Search } from "lucide-react";
import { useStore, useDerived } from "../data/store.js";
import { STAGES, STAGE_INDEX, fmtEur, fmtDate, daysAgo } from "../data/events.js";
import { pipelineMetrics } from "../data/analytics.js";
import { Card, Eyebrow, Pill, Btn, Empty } from "../components/ui/index.jsx";

const AGENT_OF = { new: "Lead Intel.", verified: "Lead Intel.", contacted: "Outreach", replied: "Outreach", meeting: "Sales", quote: "Sales", won: "Operations", lost: "—" };
const NEXT = {
  new: ["lead.verified", "Verifica"], verified: ["lead.contacted", "Contatta"],
  contacted: ["email.replied", "Risposta"], replied: ["meeting.scheduled", "Fissa call"],
  meeting: ["quote.sent", "Preventivo"], quote: ["client.won", "Chiudi ✓"],
};
const scoreColor = (q) => (q == null ? "#5A6675" : q >= 70 ? "#41F5A2" : q >= 45 ? "#FFC857" : "#FF5E6C");

function LeadCard({ lead, compact }) {
  const addEvent = useStore((s) => s.addEvent);
  const next = NEXT[lead.stage];
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
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="card card-hover p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[12.5px] font-semibold text-fg">{lead.name}</p>
        <span className="num flex shrink-0 items-center gap-1 rounded px-1.5 py-px text-[9px] font-bold" style={{ color: scoreColor(lead.quality), background: scoreColor(lead.quality) + "18" }}>
          {lead.quality ?? "—"}
        </span>
      </div>
      <p className="mt-0.5 truncate text-[10.5px] text-muted">{[lead.sector, lead.location].filter(Boolean).join(" · ") || "—"}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="num text-[12px] font-semibold text-yellow">{lead.value ? fmtEur(lead.value) : "—"}</span>
        <span className="num text-[9px] text-faint">{Math.round(daysAgo(lead.updated))}g fa</span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-hair2 pt-2">
        <span className="text-[9.5px] text-muted">{AGENT_OF[lead.stage]}</span>
        {next && (
          <div className="flex items-center gap-1">
            {needsAmount && <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="€" className="num w-12 rounded border border-hair bg-bg px-1 py-0.5 text-[10px] text-fg outline-none" />}
            <button onClick={advance} className="flex items-center gap-0.5 rounded-md border border-[rgba(38,230,255,.25)] bg-[rgba(38,230,255,.08)] px-2 py-1 text-[10px] font-medium text-cyan hover:bg-[rgba(38,230,255,.18)]">
              {next[1]} <ChevronRight size={11} />
            </button>
            {lead.stage !== "new" && (
              <button title="Perso" onClick={() => addEvent("client.lost", { leadId: lead.id, leadName: lead.name })} className="rounded-md border border-hair p-1 text-faint hover:border-[rgba(255,94,108,.3)] hover:text-red"><XCircle size={11} /></button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TopMetrics({ pm }) {
  const items = [
    ["VALORE PIPELINE", fmtEur(pm.potential), "#9D6CFF"],
    ["PONDERATO", fmtEur(pm.weighted), "#3388FF"],
    ["LEAD ATTIVI", pm.active, "#26E6FF"],
    ["CONVERSION RATE", pm.convRate + "%", "#41F5A2"],
    ["TEMPO MEDIO CHIUSURA", pm.avgCloseDays + "g", "#FFC857"],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {items.map(([l, v, c]) => (
        <Card key={l} className="p-3.5"><Eyebrow>{l}</Eyebrow><p className="num mt-1 text-[19px] font-bold" style={{ color: c }}>{v}</p></Card>
      ))}
    </div>
  );
}

export default function Pipeline() {
  const { leads } = useDerived();
  const pm = useMemo(() => pipelineMetrics(leads), [leads]);
  const [view, setView] = useState("board");
  const [q, setQ] = useState("");
  const [fSector, setFSector] = useState("");
  const [fCity, setFCity] = useState("");
  const [fStage, setFStage] = useState("");

  const sectors = useMemo(() => [...new Set(leads.map((l) => l.sector).filter(Boolean))].sort(), [leads]);
  const cities = useMemo(() => [...new Set(leads.map((l) => l.location).filter(Boolean))].sort(), [leads]);

  const filtered = useMemo(() => leads.filter((l) =>
    (!q || l.name.toLowerCase().includes(q.toLowerCase())) &&
    (!fSector || l.sector === fSector) && (!fCity || l.location === fCity) && (!fStage || l.stage === fStage)
  ), [leads, q, fSector, fCity, fStage]);

  const byStage = useMemo(() => {
    const m = Object.fromEntries(STAGES.map((s) => [s.id, []]));
    for (const l of filtered) m[l.stage]?.push(l);
    return m;
  }, [filtered]);

  const selInput = "num rounded-lg border border-hair bg-card2 px-2.5 py-1.5 text-[11px] text-muted outline-none focus:border-[rgba(38,230,255,.4)]";

  return (
    <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4 p-4 lg:p-5">
      <TopMetrics pm={pm} />

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-hair bg-card2 px-2.5">
          <Search size={13} className="text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca attività…" className="w-40 bg-transparent py-1.5 text-[12px] text-fg outline-none placeholder-faint" />
        </div>
        <select value={fSector} onChange={(e) => setFSector(e.target.value)} className={selInput}><option value="">Settore</option>{sectors.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={fCity} onChange={(e) => setFCity(e.target.value)} className={selInput}><option value="">Città</option>{cities.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={fStage} onChange={(e) => setFStage(e.target.value)} className={selInput}><option value="">Fase</option>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
        {(q || fSector || fCity || fStage) && <Btn size="sm" onClick={() => { setQ(""); setFSector(""); setFCity(""); setFStage(""); }}>Azzera</Btn>}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-hair2 bg-card2 p-0.5">
          <button onClick={() => setView("board")} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] ${view === "board" ? "bg-[rgba(38,230,255,.12)] text-cyan" : "text-muted"}`}><LayoutGrid size={13} /> Board</button>
          <button onClick={() => setView("table")} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] ${view === "table" ? "bg-[rgba(38,230,255,.12)] text-cyan" : "text-muted"}`}><Table2 size={13} /> Table</button>
        </div>
      </div>

      {!filtered.length ? (
        <Empty title="Nessun lead" hint="Registra un lead con ⌘K o lascia che il Lead Intelligence Agent riempia la pipeline via API." />
      ) : view === "board" ? (
        <div className="grid min-h-0 flex-1 auto-cols-[260px] grid-flow-col gap-3 overflow-x-auto pb-2">
          {STAGES.map((s) => {
            const m = pm.perStage.find((x) => x.id === s.id);
            return (
              <div key={s.id} className="flex min-h-0 flex-col rounded-2xl border border-hair2 bg-white/[0.008]">
                <div className="border-b border-hair2 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} /><span className="num text-[10px] font-semibold tracking-wide text-fg">{s.label.toUpperCase()}</span></span>
                    <span className="num text-[11px] text-muted">{byStage[s.id].length}</span>
                  </div>
                  <div className="num mt-1 flex items-center gap-2 text-[9px] text-faint">
                    <span className="text-yellow">{fmtEur(m?.value || 0)}</span>
                    {m?.conv != null && <span>· conv {m.conv}%</span>}
                    {m?.avgDays ? <span>· {m.avgDays}g</span> : null}
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
                  {byStage[s.id].map((l) => <LeadCard key={l.id} lead={l} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="min-h-0 flex-1 overflow-auto p-0">
          <table className="w-full min-w-[880px]">
            <thead className="sticky top-0 bg-card"><tr className="border-b border-hair text-left">
              {["ATTIVITÀ", "SETTORE", "CITTÀ", "SCORE", "VALORE", "FASE", "AGENTE", "ULT. CONTATTO", "PROSSIMA AZIONE"].map((h) => <th key={h} className="eyebrow whitespace-nowrap px-3 py-2.5 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map((l) => {
                const s = STAGES.find((x) => x.id === l.stage);
                return (
                  <tr key={l.id} className="border-b border-hair2 hover:bg-white/[0.015]">
                    <td className="px-3 py-2.5 text-[12.5px] font-medium text-fg">{l.name}</td>
                    <td className="px-3 py-2.5 text-[11.5px] text-muted">{l.sector || "—"}</td>
                    <td className="px-3 py-2.5 text-[11.5px] text-muted">{l.location || "—"}</td>
                    <td className="num px-3 py-2.5 text-[12px] font-semibold" style={{ color: scoreColor(l.quality) }}>{l.quality ?? "—"}</td>
                    <td className="num px-3 py-2.5 text-[12px] text-yellow">{l.value ? fmtEur(l.value) : "—"}</td>
                    <td className="px-3 py-2.5"><span className="num inline-flex items-center gap-1.5 text-[11px]" style={{ color: s?.color }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: s?.color }} />{s?.label}</span></td>
                    <td className="px-3 py-2.5 text-[11px] text-muted">{AGENT_OF[l.stage]}</td>
                    <td className="num px-3 py-2.5 text-[10.5px] text-faint">{fmtDate(l.updated)}</td>
                    <td className="px-3 py-2.5 text-[11px] text-cyan">{NEXT[l.stage]?.[1] || (l.stage === "won" ? "Onboarding" : "—")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
