/* ============================================================
   MAREA OS — Outreach: Campaigns / Sequences / Inbox / Leads / Analytics
   ============================================================ */
import React, { useMemo, useState } from "react";
import { Mail, PhoneCall, BellRing, Check, ArrowRight, Inbox as InboxIcon } from "lucide-react";
import { useStore, useDerived } from "../data/store.js";
import { fmtTime, fmtDate, isToday, STAGE_INDEX } from "../data/events.js";
import { Card, Eyebrow, Pill, Bar, Empty, Tabs } from "../components/ui/index.jsx";

const DAILY_LIMIT = 50;
const MAIL_STATUS = { sent: ["Inviata", "#3388FF"], delivered: ["Consegnata", "#26E6FF"], opened: ["Aperta", "#9D6CFF"], replied: ["Risposta", "#41F5A2"], error: ["Errore", "#FF5E6C"] };
const REPLY = { interested: ["Interessato", "green"], later: ["Da ricontattare", "yellow"], not_interested: ["Non interessato", "red"], auto: ["Automatica", "muted"] };

function Metric({ label, value, sub, accent = "#F5F8FC" }) {
  return <Card className="p-3.5"><Eyebrow>{label}</Eyebrow><p className="num mt-1 text-[19px] font-bold" style={{ color: accent }}>{value}</p>{sub && <p className="mt-0.5 text-[10px] text-faint">{sub}</p>}</Card>;
}

function normalizeSubject(s) {
  return (s || "Campagna").replace(/[A-ZÀ-Ù][a-zà-ù]+(\s[A-ZÀ-Ù][a-zà-ù]+)?/g, "").replace(/\d+/g, "").replace(/\s+/g, " ").trim().slice(0, 40) || "Outreach generale";
}

export default function Outreach() {
  const { emails, calls, followups, followupsPending, followupsOverdue, meetings, leads } = useDerived();
  const today = useDerived().today;
  const [tab, setTab] = useState("campaigns");

  const m = useMemo(() => {
    const sent = emails.length;
    const opened = emails.filter((e) => e.status === "opened" || e.status === "replied").length;
    const replied = emails.filter((e) => e.status === "replied").length;
    const positive = leads.filter((l) => l.reply === "interested").length;
    return { sent, opened, replied, positive,
      openRate: sent ? Math.round((opened / sent) * 100) : 0, replyRate: sent ? Math.round((replied / sent) * 100) : 0 };
  }, [emails, leads]);

  const campaigns = useMemo(() => {
    const map = new Map();
    for (const e of emails) {
      const k = normalizeSubject(e.subject);
      if (!map.has(k)) map.set(k, { name: k, leads: new Set(), sent: 0, opened: 0, replied: 0 });
      const c = map.get(k); c.sent++; if (e.leadId) c.leads.add(e.leadId);
      if (e.status === "opened" || e.status === "replied") c.opened++;
      if (e.status === "replied") c.replied++;
    }
    return [...map.values()].map((c) => ({ ...c, recipients: c.leads.size })).sort((a, b) => b.sent - a.sent).slice(0, 8);
  }, [emails]);

  const inbox = useMemo(() => leads.filter((l) => l.reply).sort((a, b) => new Date(b.updated) - new Date(a.updated)), [leads]);
  const outreachLeads = useMemo(() => leads.filter((l) => STAGE_INDEX[l.stage] >= STAGE_INDEX.contacted && l.stage !== "won" && l.stage !== "lost"), [leads]);

  const SEQ = [
    { label: "Email iniziale", cond: "All'ingresso del lead verificato", n: campaigns.reduce((s, c) => s + c.sent, 0) ? emails.length : 0 },
    { label: "Follow-up 1", cond: "+2 giorni · se nessuna risposta", n: followups.length },
    { label: "Follow-up 2", cond: "+4 giorni · se ancora nessuna risposta", n: Math.round(followups.length * 0.5) },
    { label: "Ultimo follow-up", cond: "+7 giorni · chiusura sequenza", n: Math.round(followups.length * 0.25) },
  ];

  return (
    <div className="mx-auto flex h-full max-w-[1440px] flex-col gap-4 p-4 lg:p-5">
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        <Metric label="INVIATE OGGI" value={`${today.emailsSent}`} sub={`limite ${DAILY_LIMIT}/g`} accent="#3388FF" />
        <Metric label="LIMITE GIORNALIERO" value={`${Math.round((today.emailsSent / DAILY_LIMIT) * 100)}%`} sub={`${today.emailsSent}/${DAILY_LIMIT}`} accent="#26E6FF" />
        <Metric label="OPEN RATE" value={`${m.openRate}%`} accent="#9D6CFF" />
        <Metric label="REPLY RATE" value={`${m.replyRate}%`} accent="#41F5A2" />
        <Metric label="RISPOSTE POSITIVE" value={m.positive} accent="#41F5A2" />
        <Metric label="APPUNTAMENTI" value={meetings.length} accent="#FFC857" />
      </div>

      <Tabs tabs={[{ id: "campaigns", label: "Campaigns", count: campaigns.length }, { id: "sequences", label: "Sequences" }, { id: "inbox", label: "Inbox", count: inbox.length }, { id: "leads", label: "Leads", count: outreachLeads.length }, { id: "analytics", label: "Analytics" }]} active={tab} onChange={setTab} />

      {tab === "campaigns" && (
        !campaigns.length ? <Empty title="Nessuna campagna" hint="Le campagne si formano dalle email inviate dall'Outreach Agent." /> :
        <Card className="overflow-auto p-0">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-hair text-left"><tr>{["CAMPAGNA", "DESTINATARI", "INVIATE", "APERTURE", "RISPOSTE", "AGENTE", "STATO"].map((h) => <th key={h} className="eyebrow px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.name} className="border-b border-hair2 hover:bg-white/[0.015]">
                  <td className="px-3 py-3 text-[12.5px] font-medium text-fg">{c.name}</td>
                  <td className="num px-3 py-3 text-[12px] text-muted">{c.recipients}</td>
                  <td className="num px-3 py-3 text-[12px] text-fg">{c.sent}</td>
                  <td className="num px-3 py-3 text-[12px]"><span className="text-violet">{c.opened}</span> <span className="text-faint">({c.sent ? Math.round((c.opened / c.sent) * 100) : 0}%)</span></td>
                  <td className="num px-3 py-3 text-[12px]"><span className="text-green">{c.replied}</span> <span className="text-faint">({c.sent ? Math.round((c.replied / c.sent) * 100) : 0}%)</span></td>
                  <td className="px-3 py-3"><Pill tone="blue">Outreach</Pill></td>
                  <td className="px-3 py-3"><Pill tone="green" dot>Attiva</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "sequences" && (
        <Card className="p-6">
          <Eyebrow className="mb-4 block">SEQUENZA AUTOMATICA · OUTREACH AGENT</Eyebrow>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
            {SEQ.map((s, i) => (
              <React.Fragment key={s.label}>
                <div className="card-2 flex-1 p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(38,230,255,.12)] text-[12px] font-bold text-cyan">{i + 1}</span>
                    <span className="num text-[11px] text-muted">{s.n} inviate</span>
                  </div>
                  <p className="mt-2 text-[13px] font-semibold text-fg">{s.label}</p>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{s.cond}</p>
                </div>
                {i < SEQ.length - 1 && <div className="flex items-center justify-center lg:flex-col"><ArrowRight size={16} className="text-faint" /></div>}
              </React.Fragment>
            ))}
          </div>
          <p className="mt-4 rounded-xl border border-hair2 bg-white/[0.012] px-4 py-2.5 text-[11px] text-muted">
            La sequenza si <span className="text-green">interrompe automaticamente</span> quando arriva una risposta: il lead passa a <span className="text-violet">Sales</span> se interessato, o viene archiviato.
          </p>
        </Card>
      )}

      {tab === "inbox" && (
        !inbox.length ? <Empty title="Inbox vuota" hint="Le risposte ai messaggi appariranno qui, classificate automaticamente." /> :
        <div className="flex flex-col gap-1.5">
          {inbox.map((l) => { const r = REPLY[l.reply] || REPLY.auto; return (
            <Card key={l.id} hover className="flex items-center gap-3 p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(65,245,162,.1)] text-green"><InboxIcon size={15} /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-[12.5px] font-medium text-fg">{l.name}</p><p className="truncate text-[10.5px] text-muted">{l.sector} · {l.location}</p></div>
              <Pill tone={r[1]}>{r[0]}</Pill>
              <span className="num w-14 text-right text-[10px] text-faint">{fmtDate(l.updated)}</span>
            </Card>
          ); })}
        </div>
      )}

      {tab === "leads" && (
        !outreachLeads.length ? <Empty title="Nessun lead in outreach" hint="I lead contattati e in dialogo appariranno qui." /> :
        <Card className="overflow-auto p-0">
          <table className="w-full min-w-[600px]">
            <thead className="border-b border-hair text-left"><tr>{["ATTIVITÀ", "SETTORE", "CITTÀ", "FASE", "ULT. CONTATTO"].map((h) => <th key={h} className="eyebrow px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
            <tbody>{outreachLeads.map((l) => (
              <tr key={l.id} className="border-b border-hair2"><td className="px-3 py-2.5 text-[12.5px] text-fg">{l.name}</td><td className="px-3 py-2.5 text-[11.5px] text-muted">{l.sector}</td><td className="px-3 py-2.5 text-[11.5px] text-muted">{l.location}</td><td className="px-3 py-2.5"><Pill tone="cyan">{l.stage}</Pill></td><td className="num px-3 py-2.5 text-[10.5px] text-faint">{fmtDate(l.updated)}</td></tr>
            ))}</tbody>
          </table>
        </Card>
      )}

      {tab === "analytics" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="flex min-h-0 flex-col p-4 lg:col-span-1">
            <div className="mb-2.5 flex items-center gap-2"><Mail size={13} className="text-blue" /><Eyebrow>STATO EMAIL</Eyebrow></div>
            <div className="grid gap-2">
              {Object.entries(MAIL_STATUS).map(([k, [label, color]]) => { const n = emails.filter((e) => e.status === k).length; return (
                <div key={k}><div className="flex items-center justify-between text-[11px]"><span className="text-muted">{label}</span><span className="num text-fg">{n}</span></div><Bar pct={emails.length ? (n / emails.length) * 100 : 0} color={color} className="mt-1" h={5} /></div>
              ); })}
            </div>
          </Card>
          <Card className="flex min-h-0 flex-col p-4">
            <div className="mb-2.5 flex items-center gap-2"><PhoneCall size={13} className="text-violet" /><Eyebrow>CHIAMATE ({calls.length})</Eyebrow></div>
            <div className="max-h-[320px] min-h-0 flex-1 overflow-y-auto">
              {!calls.length ? <Empty title="Nessuna chiamata" /> : <div className="flex flex-col gap-1.5">{calls.slice(0, 40).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-hair2 bg-white/[0.012] px-3 py-2"><span className="truncate text-[11.5px] text-fg">{c.leadName}</span><span className="num text-[10px] text-muted">{c.outcome}</span></div>
              ))}</div>}
            </div>
          </Card>
          <Card className="flex min-h-0 flex-col p-4">
            <div className="mb-2.5 flex items-center gap-2"><BellRing size={13} className="text-yellow" /><Eyebrow>FOLLOW-UP ({followupsPending.length} aperti)</Eyebrow></div>
            <div className="max-h-[320px] min-h-0 flex-1 overflow-y-auto">
              {!followups.length ? <Empty title="Nessun follow-up" /> : <div className="flex flex-col gap-1.5">{followups.slice(0, 40).map((f) => { const overdue = !f.done && new Date(f.due) < new Date(); return (
                <div key={f.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${f.done ? "border-hair2 opacity-50" : overdue ? "border-[rgba(255,200,87,.25)] bg-[rgba(255,200,87,.05)]" : "border-hair2 bg-white/[0.012]"}`}>
                  <span className="truncate text-[11.5px] text-fg">{f.leadName}</span><span className={`num text-[10px] ${overdue ? "text-yellow" : "text-faint"}`}>{fmtDate(f.due)}</span></div>
              ); })}</div>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
