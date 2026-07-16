/* ============================================================
   MAREA OS — Motore demo
   Genera uno storico realistico di agency + eventi live ogni
   3–9 secondi. TUTTI gli eventi hanno demo:true e non vengono
   mai salvati su disco: i dati demo restano separati dai reali.
   ============================================================ */
import { makeEvent, nextId } from "./events.js";

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;

const NAMES = [
  "Trattoria Da Rino", "Studio Dentistico Bianchi", "Palestra IronWorks", "Bar Centrale",
  "Idraulica Ferri", "Parrucchiere GlamHair", "Pizzeria La Brace", "Autofficina Motta",
  "Centro Estetico Luce", "Falegnameria Bosco", "Gelateria Polare", "Ottica Visione",
  "Agenzia Immobiliare Domus", "Pasticceria Reale", "Studio Legale Marchetti", "Ristorante Il Faro",
  "Elettricista Voltari", "Fioraio Petali", "Libreria Pagine", "Osteria del Ponte",
  "Carrozzeria Speed", "Farmacia San Marco", "Enoteca Divino", "Panificio Grano",
];
const SECTORS = ["Ristorazione", "Salute", "Fitness", "Artigianato", "Retail", "Servizi", "Beauty", "Immobiliare"];
const CITIES = ["Milano", "Monza", "Bergamo", "Brescia", "Como", "Varese", "Pavia", "Lecco"];
const ISSUES = ["Nessun sito web", "Sito non mobile", "Google Business incompleto", "Sito datato (2016)", "Nessuna presenza social", "Recensioni non gestite"];
const SUBJECTS = [
  "Il vostro sito su mobile — 3 problemi trovati",
  "Un'idea per {name}",
  "Ho analizzato la vostra presenza online",
  "Domanda veloce su {name}",
  "I clienti vi trovano su Google?",
];
const EXP_CATS = ["Software", "Pubblicità", "Hosting", "Formazione", "Commercialista"];

function slug() { return nextId("lead"); }

/* ---------- Storico: ~35 giorni di attività ---------- */
export function seedHistory() {
  const events = [];
  const day = 86400000;
  const now = Date.now();
  let leadPool = [];

  const at = (t, type, data, source) => {
    const e = makeEvent(type, data, { source: source || "demo", demo: true });
    e.ts = new Date(t).toISOString();
    e.id = nextId();
    events.push(e);
    return e;
  };

  for (let d = 35; d >= 0; d--) {
    const base = now - d * day;
    const isPast = d > 0;
    const dayStart = base - (isPast ? rand(6, 9) : rand(2, 8)) * 3600000;

    // Lead Intelligence: 2–6 lead al giorno
    const nLeads = rand(2, 6);
    for (let i = 0; i < nLeads; i++) {
      const id = slug();
      const name = pick(NAMES) + (chance(0.4) ? ` ${pick(CITIES)}` : "");
      const lead = { leadId: id, name, sector: pick(SECTORS), location: pick(CITIES),
        email: "info@" + name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12) + ".it",
        phone: "3" + rand(200000000, 999999999), quality: rand(35, 92), issues: pick(ISSUES) };
      at(dayStart + i * 600000, "lead.found", lead, "lead-intel");
      if (chance(0.8)) {
        at(dayStart + i * 600000 + 300000, "lead.verified", { leadId: id, name }, "lead-intel");
        leadPool.push({ id, name });
      }
    }

    // Outreach: email su lead verificati
    const nMail = Math.min(leadPool.length, rand(3, 9));
    for (let i = 0; i < nMail; i++) {
      const l = pick(leadPool);
      const emailId = nextId("mail");
      const t0 = dayStart + 3600000 + i * 480000;
      at(t0, "email.sent", { emailId, leadId: l.id, leadName: l.name, subject: pick(SUBJECTS).replace("{name}", l.name) }, "outreach");
      if (chance(0.94)) at(t0 + 120000, "email.delivered", { emailId }, "outreach");
      else { at(t0 + 120000, "email.error", { emailId }, "outreach"); continue; }
      if (chance(0.55)) at(t0 + rand(1, 8) * 3600000, "email.opened", { emailId }, "outreach");
      if (chance(0.16)) {
        at(t0 + rand(2, 20) * 3600000, "email.replied",
          { emailId, leadId: l.id, leadName: l.name, classification: pick(["interested", "interested", "not_interested", "later"]) }, "outreach");
      } else if (chance(0.5)) {
        const fuId = nextId("fu");
        at(t0 + 3600000, "followup.created", { followupId: fuId, leadId: l.id, leadName: l.name, due: new Date(t0 + rand(2, 4) * day).toISOString() }, "outreach");
        if (chance(0.7) && isPast) at(t0 + rand(2, 4) * day, "followup.done", { followupId: fuId, leadId: l.id, leadName: l.name }, "outreach");
      }
    }

    // Sales: chiamate, appuntamenti, preventivi
    const nCalls = rand(1, 5);
    for (let i = 0; i < nCalls; i++) {
      const l = leadPool.length ? pick(leadPool) : null;
      const t0 = dayStart + 5 * 3600000 + i * 900000;
      const outcome = pick(["answered", "answered", "no_answer", "callback", "refused"]);
      at(t0, "call.made", { leadId: l?.id, leadName: l?.name, outcome, note: outcome === "callback" ? "Richiamare la prossima settimana" : "" }, "sales");
      if (outcome === "answered" && chance(0.35) && l) {
        at(t0 + 600000, "meeting.scheduled", { leadId: l.id, leadName: l.name, when: new Date(base + rand(1, 5) * day).toISOString() }, "sales");
        if (chance(0.6)) {
          const amount = pick([690, 890, 1190, 1490, 1990, 2490]);
          at(t0 + 2 * day > now ? t0 + 3600000 : t0 + rand(1, 2) * day, "quote.sent", { leadId: l.id, leadName: l.name, amount }, "sales");
          if (isPast && d > 3 && chance(0.4)) {
            if (chance(0.65)) {
              at(t0 + rand(2, 4) * day, "client.won", { leadId: l.id, leadName: l.name, amount }, "ops");
              at(t0 + rand(2, 4) * day + 3600000, "finance.income", { amount, category: "Progetto sito", note: l.name }, "finance");
              leadPool = leadPool.filter(x => x.id !== l.id);
            } else {
              at(t0 + rand(2, 5) * day, "client.lost", { leadId: l.id, leadName: l.name, reason: pick(["Budget", "Ha scelto altri", "Non risponde"]) }, "ops");
              leadPool = leadPool.filter(x => x.id !== l.id);
            }
          }
        }
      }
    }

    // Finance: spese periodiche
    if (d % 7 === 3) at(dayStart + 2 * 3600000, "finance.expense", { amount: pick([29, 49, 79, 120, 250]), category: pick(EXP_CATS) }, "finance");
    // acconti ricorrenti clienti attivi
    if (d % 9 === 2) at(dayStart + 3 * 3600000, "finance.income", { amount: pick([300, 450, 500]), category: "Manutenzione mensile" }, "finance");

    // Tasks personali
    if (chance(0.5)) {
      const taskId = nextId("task");
      at(dayStart + 3600000, "task.created", { taskId, title: pick([
        "Preparare case study palestra", "Aggiornare portfolio", "Rivedere template email",
        "Fatturare manutenzioni mese", "Post LinkedIn agency", "Call di allineamento agenti",
      ]), due: new Date(base + rand(0, 3) * day).toISOString(), priority: pick(["high", "med", "med", "low"]) }, "demo");
      if (isPast && chance(0.7)) at(dayStart + rand(2, 9) * 3600000, "task.done", { taskId }, "demo");
    }
  }

  events.sort((a, b) => new Date(a.ts) - new Date(b.ts));
  return { events, leadPool };
}

/* ---------- Eventi live (ogni 3–9s) ---------- */
export function startLiveDemo(pool, dispatch) {
  let leadPool = [...pool];
  let timer = null;

  const tick = () => {
    const roll = Math.random();
    let e;
    if (roll < 0.22) {
      const id = slug(); const name = pick(NAMES) + " " + pick(CITIES);
      leadPool.push({ id, name });
      e = makeEvent("lead.found", { leadId: id, name, sector: pick(SECTORS), location: pick(CITIES), quality: rand(35, 92), issues: pick(ISSUES) }, { source: "lead-intel", demo: true });
    } else if (roll < 0.32 && leadPool.length) {
      const l = pick(leadPool);
      e = makeEvent("lead.verified", { leadId: l.id, name: l.name }, { source: "lead-intel", demo: true });
    } else if (roll < 0.55 && leadPool.length) {
      const l = pick(leadPool);
      e = makeEvent("email.sent", { emailId: nextId("mail"), leadId: l.id, leadName: l.name, subject: pick(SUBJECTS).replace("{name}", l.name) }, { source: "outreach", demo: true });
    } else if (roll < 0.65 && leadPool.length) {
      const l = pick(leadPool);
      e = makeEvent("email.replied", { emailId: nextId("mail"), leadId: l.id, leadName: l.name, classification: pick(["interested", "interested", "later"]) }, { source: "outreach", demo: true });
    } else if (roll < 0.78 && leadPool.length) {
      const l = pick(leadPool);
      e = makeEvent("call.made", { leadId: l.id, leadName: l.name, outcome: pick(["answered", "no_answer", "callback"]) }, { source: "sales", demo: true });
    } else if (roll < 0.86 && leadPool.length) {
      const l = pick(leadPool);
      e = makeEvent("meeting.scheduled", { leadId: l.id, leadName: l.name, when: new Date(Date.now() + rand(1, 5) * 86400000).toISOString() }, { source: "sales", demo: true });
    } else if (roll < 0.93 && leadPool.length) {
      const l = pick(leadPool);
      e = makeEvent("quote.sent", { leadId: l.id, leadName: l.name, amount: pick([690, 890, 1190, 1490, 1990]) }, { source: "sales", demo: true });
    } else if (roll < 0.97 && leadPool.length) {
      const l = pick(leadPool);
      const amount = pick([890, 1190, 1490, 1990]);
      leadPool = leadPool.filter(x => x.id !== l.id);
      dispatch(makeEvent("client.won", { leadId: l.id, leadName: l.name, amount }, { source: "ops", demo: true }));
      e = makeEvent("finance.income", { amount, category: "Progetto sito", note: l.name }, { source: "finance", demo: true });
    } else {
      e = makeEvent("finance.expense", { amount: pick([19, 29, 49]), category: pick(EXP_CATS) }, { source: "finance", demo: true });
    }
    dispatch(e);
    timer = setTimeout(tick, rand(3000, 9000));
  };

  timer = setTimeout(tick, 2500);
  return () => clearTimeout(timer);
}

/* ---------- Stato demo degli agenti ---------- */
export const DEMO_AGENT_STATE = {
  "lead-intel": { status: "online", mode: "auto",     currentTask: "Scansione attività — Monza e Brianza" },
  "outreach":   { status: "online", mode: "approval", currentTask: "Sequenza follow-up B — 12 in coda" },
  "sales":      { status: "online", mode: "manual",   currentTask: "Lista chiamate di domani (8 numeri)" },
  "ops":        { status: "paused", mode: "approval", currentTask: null },
  "finance":    { status: "online", mode: "auto",     currentTask: "Riconciliazione entrate settimana" },
};
