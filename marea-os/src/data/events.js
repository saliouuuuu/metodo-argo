/* ============================================================
   MAREA OS — Modello eventi
   Ogni cosa che accade in agency è un evento:
   { id, ts, type, source, demo, data }
   source: 'manual' | 'api' | 'demo' | <agentId>
   Gli aggregati (pipeline, outreach, finance, ...) si derivano
   sempre e solo dalla lista eventi: una sola fonte di verità.
   ============================================================ */

let _seq = 0;
export const nextId = (p = "evt") =>
  `${p}_${Date.now().toString(36)}${(_seq++).toString(36)}`;

/* ---------- Stadi pipeline ---------- */
export const STAGES = [
  { id: "new",       label: "Nuovi",       color: "#67e8f9" },
  { id: "verified",  label: "Verificati",  color: "#22d3ee" },
  { id: "contacted", label: "Contattati",  color: "#60a5fa" },
  { id: "replied",   label: "In dialogo",  color: "#a78bfa" },
  { id: "meeting",   label: "Appuntamento", color: "#f0abfc" },
  { id: "quote",     label: "Preventivo",  color: "#fbbf24" },
  { id: "won",       label: "Clienti",     color: "#34d399" },
  { id: "lost",      label: "Persi",       color: "#f87171" },
];
export const STAGE_INDEX = Object.fromEntries(STAGES.map((s, i) => [s.id, i]));

/* ---------- Catalogo tipi evento ----------
   cat: colore/categoria feed · label: titolo IT nel feed */
export const EVENT_TYPES = {
  "lead.found":        { cat: "info",    label: "Lead trovato" },
  "lead.verified":     { cat: "info",    label: "Lead verificato" },
  "lead.contacted":    { cat: "info",    label: "Attività contattata" },
  "email.sent":        { cat: "info",    label: "Email inviata" },
  "email.delivered":   { cat: "info",    label: "Email consegnata" },
  "email.opened":      { cat: "ai",      label: "Email aperta" },
  "email.replied":     { cat: "success", label: "Risposta ricevuta" },
  "email.error":       { cat: "warning", label: "Errore invio email" },
  "call.made":         { cat: "info",    label: "Chiamata effettuata" },
  "followup.created":  { cat: "info",    label: "Follow-up pianificato" },
  "followup.done":     { cat: "success", label: "Follow-up completato" },
  "meeting.scheduled": { cat: "success", label: "Appuntamento fissato" },
  "quote.sent":        { cat: "ai",      label: "Preventivo inviato" },
  "client.won":        { cat: "success", label: "Cliente acquisito" },
  "client.lost":       { cat: "warning", label: "Cliente perso" },
  "finance.income":    { cat: "success", label: "Entrata registrata" },
  "finance.expense":   { cat: "warning", label: "Spesa registrata" },
  "task.created":      { cat: "info",    label: "Task creato" },
  "task.done":         { cat: "success", label: "Task completato" },
  "agent.status":      { cat: "ai",      label: "Stato agente" },
  "agent.log":         { cat: "ai",      label: "Attività agente" },
  "agent.error":       { cat: "warning", label: "Errore agente" },
};

export const CATS = {
  info:    { dot: "#22d3ee", text: "#67e8f9" },
  success: { dot: "#34d399", text: "#6ee7b7" },
  warning: { dot: "#fbbf24", text: "#fcd34d" },
  ai:      { dot: "#a78bfa", text: "#c4b5fd" },
};

export function makeEvent(type, data = {}, { source = "manual", demo = false } = {}) {
  return { id: nextId(), ts: new Date().toISOString(), type, source, demo, data };
}

/* ---------- Helper tempo ---------- */
export const isToday = (ts) => {
  const d = new Date(ts), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};
export const daysAgo = (ts) => (Date.now() - new Date(ts).getTime()) / 86400000;

/* ============================================================
   REDUCER — dagli eventi agli aggregati
   ============================================================ */
export function deriveState(events) {
  const leads = new Map();     // id → lead
  const emails = [];           // { id, ts, leadId, leadName, status, subject, source }
  const calls = [];            // { id, ts, leadId, leadName, outcome, note, source }
  const followups = new Map(); // id → { id, ts, leadId, leadName, due, done, doneTs }
  const meetings = [];         // { id, ts, leadId, leadName, when }
  const quotes = [];           // { id, ts, leadId, leadName, amount }
  const tx = [];               // { id, ts, kind, amount, category, note }
  const tasks = new Map();     // id → { id, ts, title, due, priority, done }
  const agentEvents = {};      // agentId → events[]
  const emailById = new Map();

  const leadOf = (d, ts) => {
    const id = d.leadId || d.id || nextId("lead");
    if (!leads.has(id)) {
      leads.set(id, {
        id, name: d.name || d.leadName || "Attività senza nome",
        sector: d.sector || "", location: d.location || "",
        email: d.email || "", phone: d.phone || "", website: d.website || "",
        quality: d.quality || null, issues: d.issues || "",
        value: 0, stage: "new", ts, updated: ts, notes: [],
      });
    }
    return leads.get(id);
  };
  const advance = (lead, stage, ts) => {
    // mai retrocedere (tranne won/lost che sono terminali espliciti)
    if (stage === "won" || stage === "lost" || STAGE_INDEX[stage] > STAGE_INDEX[lead.stage]) {
      lead.stage = stage; lead.updated = ts;
    }
  };

  for (const e of events) {
    const d = e.data || {};
    const src = e.source;
    if (src && src !== "manual" && src !== "api" && src !== "demo") {
      (agentEvents[src] ||= []).push(e);
    }
    switch (e.type) {
      case "lead.found": {
        const l = leadOf(d, e.ts); Object.assign(l, {
          name: d.name || l.name, sector: d.sector || l.sector,
          location: d.location || l.location, email: d.email || l.email,
          phone: d.phone || l.phone, website: d.website ?? l.website,
          quality: d.quality ?? l.quality, issues: d.issues || l.issues,
        });
        break;
      }
      case "lead.verified": { const l = leadOf(d, e.ts); advance(l, "verified", e.ts); break; }
      case "lead.contacted": { const l = leadOf(d, e.ts); advance(l, "contacted", e.ts); break; }
      case "email.sent": {
        const l = d.leadId || d.leadName ? leadOf(d, e.ts) : null;
        if (l) advance(l, "contacted", e.ts);
        const m = { id: d.emailId || e.id, ts: e.ts, leadId: l?.id, leadName: l?.name || d.leadName || "—",
          subject: d.subject || "", status: "sent", source: src };
        emails.push(m); emailById.set(m.id, m);
        break;
      }
      case "email.delivered": { const m = emailById.get(d.emailId); if (m && m.status === "sent") m.status = "delivered"; break; }
      case "email.opened": { const m = emailById.get(d.emailId); if (m && m.status !== "replied") m.status = "opened"; break; }
      case "email.replied": {
        const m = emailById.get(d.emailId); if (m) m.status = "replied";
        const l = d.leadId || d.leadName ? leadOf(d, e.ts) : (m?.leadId ? leads.get(m.leadId) : null);
        if (l) { advance(l, "replied", e.ts); l.reply = d.classification || "interested"; }
        break;
      }
      case "email.error": { const m = emailById.get(d.emailId); if (m) m.status = "error"; break; }
      case "call.made": {
        const l = d.leadId || d.leadName ? leadOf(d, e.ts) : null;
        if (l && (d.outcome === "answered" || d.outcome === "callback")) advance(l, "contacted", e.ts);
        calls.push({ id: e.id, ts: e.ts, leadId: l?.id, leadName: l?.name || d.leadName || "—",
          outcome: d.outcome || "answered", note: d.note || "", source: src });
        break;
      }
      case "followup.created": {
        const l = d.leadId || d.leadName ? leadOf(d, e.ts) : null;
        const id = d.followupId || e.id;
        followups.set(id, { id, ts: e.ts, leadId: l?.id, leadName: l?.name || d.leadName || "—",
          due: d.due || e.ts, done: false, doneTs: null, note: d.note || "" });
        break;
      }
      case "followup.done": {
        const f = followups.get(d.followupId);
        if (f) { f.done = true; f.doneTs = e.ts; }
        else followups.set(e.id, { id: e.id, ts: e.ts, leadId: d.leadId, leadName: d.leadName || "—",
          due: e.ts, done: true, doneTs: e.ts, note: d.note || "" });
        break;
      }
      case "meeting.scheduled": {
        const l = d.leadId || d.leadName ? leadOf(d, e.ts) : null;
        if (l) advance(l, "meeting", e.ts);
        meetings.push({ id: e.id, ts: e.ts, leadId: l?.id, leadName: l?.name || d.leadName || "—", when: d.when || "" });
        break;
      }
      case "quote.sent": {
        const l = d.leadId || d.leadName ? leadOf(d, e.ts) : null;
        const amount = Number(d.amount) || 0;
        if (l) { advance(l, "quote", e.ts); l.value = amount || l.value; }
        quotes.push({ id: e.id, ts: e.ts, leadId: l?.id, leadName: l?.name || d.leadName || "—", amount });
        break;
      }
      case "client.won": {
        const l = d.leadId || d.leadName ? leadOf(d, e.ts) : null;
        if (l) { advance(l, "won", e.ts); if (d.amount) l.value = Number(d.amount); }
        break;
      }
      case "client.lost": {
        const l = d.leadId || d.leadName ? leadOf(d, e.ts) : null;
        if (l) { l.stage = "lost"; l.updated = e.ts; l.lostReason = d.reason || ""; }
        break;
      }
      case "finance.income": tx.push({ id: e.id, ts: e.ts, kind: "income", amount: Number(d.amount) || 0, category: d.category || "Servizi", note: d.note || "" }); break;
      case "finance.expense": tx.push({ id: e.id, ts: e.ts, kind: "expense", amount: Number(d.amount) || 0, category: d.category || "Operativo", note: d.note || "" }); break;
      case "task.created": {
        const id = d.taskId || e.id;
        tasks.set(id, { id, ts: e.ts, title: d.title || "Task", due: d.due || null, priority: d.priority || "med", done: false });
        break;
      }
      case "task.done": {
        const t = tasks.get(d.taskId); if (t) { t.done = true; t.doneTs = e.ts; }
        break;
      }
      default: break;
    }
  }

  /* ---------- Aggregati ---------- */
  const leadList = [...leads.values()];
  const income = tx.filter(t => t.kind === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = tx.filter(t => t.kind === "expense").reduce((s, t) => s + t.amount, 0);
  const openStages = ["contacted", "replied", "meeting", "quote"];
  const pipelineValue = leadList.filter(l => openStages.includes(l.stage)).reduce((s, l) => s + (l.value || 0), 0);

  const today = {
    leadsFound: 0, verified: 0, contacted: 0, emailsSent: 0, replies: 0,
    calls: 0, followupsDone: 0, meetings: 0, quotes: 0, won: 0,
  };
  for (const e of events) {
    if (!isToday(e.ts)) continue;
    if (e.type === "lead.found") today.leadsFound++;
    else if (e.type === "lead.verified") today.verified++;
    else if (e.type === "lead.contacted") today.contacted++;
    else if (e.type === "email.sent") today.emailsSent++;
    else if (e.type === "email.replied") today.replies++;
    else if (e.type === "call.made") today.calls++;
    else if (e.type === "followup.done") today.followupsDone++;
    else if (e.type === "meeting.scheduled") today.meetings++;
    else if (e.type === "quote.sent") today.quotes++;
    else if (e.type === "client.won") today.won++;
  }

  const funnel = {
    leads: leadList.length,
    contacted: leadList.filter(l => STAGE_INDEX[l.stage] >= STAGE_INDEX.contacted && l.stage !== "lost").length,
    replied: leadList.filter(l => STAGE_INDEX[l.stage] >= STAGE_INDEX.replied && l.stage !== "lost").length,
    meetings: leadList.filter(l => STAGE_INDEX[l.stage] >= STAGE_INDEX.meeting && l.stage !== "lost").length,
    quotes: leadList.filter(l => STAGE_INDEX[l.stage] >= STAGE_INDEX.quote && l.stage !== "lost").length,
    won: leadList.filter(l => l.stage === "won").length,
  };

  const now = Date.now();
  const fu = [...followups.values()];
  return {
    leads: leadList.sort((a, b) => new Date(b.updated) - new Date(a.updated)),
    emails: emails.slice().reverse(),
    calls: calls.slice().reverse(),
    followups: fu.sort((a, b) => new Date(a.due) - new Date(b.due)),
    followupsPending: fu.filter(f => !f.done),
    followupsOverdue: fu.filter(f => !f.done && new Date(f.due).getTime() < now),
    meetings: meetings.slice().reverse(),
    quotes: quotes.slice().reverse(),
    tx: tx.slice().reverse(),
    tasks: [...tasks.values()].sort((a, b) => (a.done - b.done) || new Date(a.due || a.ts) - new Date(b.due || b.ts)),
    agentEvents,
    finance: { income, expenses, profit: income - expenses, pipelineValue },
    clients: leadList.filter(l => l.stage === "won").length,
    today, funnel,
  };
}

/* ---------- Formattazione ---------- */
export const fmtEur = (n) =>
  "€ " + (Math.round(n) === n ? n.toLocaleString("it-IT") : n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
export const fmtTime = (ts) => new Date(ts).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
export const fmtDate = (ts) => new Date(ts).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
