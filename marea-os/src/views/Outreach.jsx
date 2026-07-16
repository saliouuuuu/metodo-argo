/* ============================================================
   MAREA OS — Outreach: email, chiamate, follow-up
   ============================================================ */
import React, { useMemo } from "react";
import { Mail, Phone, BellRing, Check } from "lucide-react";
import { useStore, useDerived } from "../data/store.js";
import { fmtTime, fmtDate, isToday } from "../data/events.js";
import { Panel, SysLabel, Stat, Empty, Segmented } from "../components/ui.jsx";

const MAIL_STATUS = {
  sent:      { label: "Inviata",    color: "#60a5fa" },
  delivered: { label: "Consegnata", color: "#67e8f9" },
  opened:    { label: "Aperta",     color: "#a78bfa" },
  replied:   { label: "Risposta",   color: "#34d399" },
  error:     { label: "Errore",     color: "#f87171" },
};
const CALL_OUTCOME = {
  answered:  { label: "Risposto",     color: "#34d399" },
  no_answer: { label: "No risposta",  color: "#71717a" },
  callback:  { label: "Richiamare",   color: "#fbbf24" },
  refused:   { label: "Rifiutato",    color: "#f87171" },
};

const Chip = ({ def }) => (
  <span className="num rounded px-1.5 py-px text-[9px] font-semibold tracking-wider"
    style={{ color: def.color, background: def.color + "16", border: `1px solid ${def.color}30` }}>
    {def.label.toUpperCase()}
  </span>
);

export default function Outreach() {
  const addEvent = useStore((s) => s.addEvent);
  const { emails, calls, followups, followupsPending, followupsOverdue } = useDerived();

  const stats = useMemo(() => {
    const sent = emails.length;
    const opened = emails.filter((m) => m.status === "opened" || m.status === "replied").length;
    const replied = emails.filter((m) => m.status === "replied").length;
    const errors = emails.filter((m) => m.status === "error").length;
    return {
      sent, opened, replied, errors,
      openRate: sent ? Math.round((opened / sent) * 100) : 0,
      replyRate: sent ? Math.round((replied / sent) * 100) : 0,
    };
  }, [emails]);

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-4 p-4">
      <div className="grid grid-cols-6 gap-3">
        <Stat label="EMAIL INVIATE" value={stats.sent} accent="#60a5fa" />
        <Stat label="APERTE" value={stats.opened} accent="#a78bfa" sub={`${stats.openRate}% open rate`} />
        <Stat label="RISPOSTE" value={stats.replied} accent="#34d399" sub={`${stats.replyRate}% reply rate`} />
        <Stat label="ERRORI" value={stats.errors} accent={stats.errors ? "#f87171" : "#3f3f46"} />
        <Stat label="CHIAMATE" value={calls.length} accent="#f0abfc" />
        <Stat label="FOLLOW-UP APERTI" value={followupsPending.length} accent={followupsOverdue.length ? "#fbbf24" : "#67e8f9"}
          sub={followupsOverdue.length ? `${followupsOverdue.length} in ritardo` : "tutto in orario"} />
      </div>

      <div className="grid min-h-0 grid-cols-[1.25fr_1fr_1fr] gap-4">
        {/* EMAIL */}
        <Panel className="flex min-h-0 flex-col p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-2"><Mail size={13} className="text-blue-300" /><SysLabel>EMAIL</SysLabel></span>
            <div className="w-32"><Segmented pct={stats.replyRate * 4} color="#34d399" segments={20} /></div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!emails.length ? <Empty title="Nessuna email" hint="Registra un invio con ⌘K o collega l'Outreach Agent via API." /> : (
              <table className="w-full text-left">
                <tbody>
                  {emails.slice(0, 120).map((m) => (
                    <tr key={m.id} className="border-b border-white/[0.035]">
                      <td className="max-w-0 truncate py-2 pr-2 text-[11.5px] text-zinc-300" style={{ width: "42%" }}>{m.leadName}</td>
                      <td className="max-w-0 truncate py-2 pr-2 text-[10.5px] text-zinc-600">{m.subject || "—"}</td>
                      <td className="py-2 pr-2"><Chip def={MAIL_STATUS[m.status]} /></td>
                      <td className="num py-2 text-right text-[9.5px] text-zinc-600">{isToday(m.ts) ? fmtTime(m.ts) : fmtDate(m.ts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Panel>

        {/* CHIAMATE */}
        <Panel className="flex min-h-0 flex-col p-3.5">
          <div className="mb-2.5 flex items-center gap-2"><Phone size={13} className="text-fuchsia-300" /><SysLabel>CHIAMATE</SysLabel></div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!calls.length ? <Empty title="Nessuna chiamata" hint="Registra gli esiti con ⌘K → «Chiamata effettuata»." /> : (
              <div className="flex flex-col gap-1.5">
                {calls.slice(0, 80).map((c) => (
                  <div key={c.id} className="rounded-lg border border-white/[0.045] bg-white/[0.015] px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[11.5px] text-zinc-300">{c.leadName}</p>
                      <Chip def={CALL_OUTCOME[c.outcome] || CALL_OUTCOME.answered} />
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[10px] text-zinc-600">{c.note || "—"}</p>
                      <span className="num shrink-0 text-[9px] text-zinc-700">{isToday(c.ts) ? fmtTime(c.ts) : fmtDate(c.ts)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>

        {/* FOLLOW-UP */}
        <Panel className="flex min-h-0 flex-col p-3.5">
          <div className="mb-2.5 flex items-center gap-2"><BellRing size={13} className="text-amber-300" /><SysLabel>FOLLOW-UP</SysLabel></div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!followups.length ? <Empty title="Nessun follow-up" hint="Pianificali con ⌘K → «Follow-up da fare»." /> : (
              <div className="flex flex-col gap-1.5">
                {followups.slice(0, 80).map((f) => {
                  const overdue = !f.done && new Date(f.due).getTime() < Date.now();
                  return (
                    <div key={f.id} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${
                      f.done ? "border-white/[0.035] bg-white/[0.008] opacity-50"
                        : overdue ? "border-amber-400/25 bg-amber-400/[0.05]" : "border-white/[0.045] bg-white/[0.015]"}`}>
                      <button
                        disabled={f.done}
                        onClick={() => addEvent("followup.done", { followupId: f.id, leadId: f.leadId, leadName: f.leadName })}
                        className={`flex h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 items-center justify-center rounded border ${
                          f.done ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-300" : "border-white/15 text-transparent hover:border-cyan-300/60 hover:text-cyan-300/60"}`}>
                        <Check size={11} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[11.5px] ${f.done ? "text-zinc-500 line-through" : "text-zinc-300"}`}>{f.leadName}</p>
                        <p className="truncate text-[9.5px] text-zinc-600">{f.note || "Follow-up"}</p>
                      </div>
                      <span className={`num shrink-0 text-[9.5px] ${overdue ? "font-semibold text-amber-300" : "text-zinc-600"}`}>
                        {fmtDate(f.due)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
