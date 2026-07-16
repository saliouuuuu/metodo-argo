/* ============================================================
   MAREA OS — Roster degli agenti AI di Marea Creative
   Pochi agenti, ognuno con più capacità interne. Le capacità
   sono estendibili senza creare nuovi agenti.
   ============================================================ */

export const AGENTS = [
  {
    id: "lead-intel",
    name: "Lead Intelligence",
    code: "LI-01",
    color: "#22d3ee",
    role: "Ricerca e qualifica dei lead",
    desc: "Cerca attività locali, verifica il sito, analizza la presenza online e completa ogni contatto con email, telefono, titolare, settore e problemi individuati.",
    capabilities: ["Ricerca attività", "Verifica sito", "Analisi presenza online", "Arricchimento contatti"],
    eventTypes: ["lead.found", "lead.verified"],
  },
  {
    id: "outreach",
    name: "Outreach",
    code: "OU-02",
    color: "#60a5fa",
    role: "Email e follow-up automatici",
    desc: "Scrive email personalizzate, le invia secondo limiti e orari, gestisce le sequenze di follow-up, classifica le risposte e aggiorna la pipeline.",
    capabilities: ["Email personalizzate", "Invio programmato", "Sequenze follow-up", "Classificazione risposte"],
    eventTypes: ["email.sent", "email.delivered", "email.opened", "email.replied", "email.error", "followup.created", "followup.done"],
    modes: true, // manuale | approvazione | automatico
  },
  {
    id: "sales",
    name: "Sales",
    code: "SA-03",
    color: "#a78bfa",
    role: "Chiamate, appuntamenti e preventivi",
    desc: "Prepara le liste da chiamare, suggerisce gli script, registra esiti e note, individua il prossimo passo e aggiorna la pipeline.",
    capabilities: ["Liste chiamate", "Script suggeriti", "Registrazione esiti", "Preventivi"],
    eventTypes: ["call.made", "meeting.scheduled", "quote.sent"],
  },
  {
    id: "ops",
    name: "Operations",
    code: "OP-04",
    color: "#f0abfc",
    role: "Clienti, progetti e coordinamento",
    desc: "Gestisce clienti acquisiti, progetti, task e scadenze. Coordina gli altri agenti e segnala blocchi, errori o attività urgenti.",
    capabilities: ["Gestione clienti", "Progetti e scadenze", "Coordinamento agenti", "Alert e blocchi"],
    eventTypes: ["client.won", "client.lost", "task.created", "task.done"],
  },
  {
    id: "finance",
    name: "Finance & Analytics",
    code: "FA-05",
    color: "#34d399",
    role: "Entrate, spese e analisi",
    desc: "Registra entrate, spese e pagamenti. Analizza conversioni, produttività, performance degli agenti e crescita dell'agency nel tempo.",
    capabilities: ["Registrazione movimenti", "Analisi conversioni", "Performance agenti", "Trend di crescita"],
    eventTypes: ["finance.income", "finance.expense"],
  },
];

export const AGENT_BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a]));

export const AGENT_MODES = [
  { id: "manual",   label: "Manuale",      desc: "L'agente suggerisce, esegui tu." },
  { id: "approval", label: "Approvazione", desc: "Prepara tutto, tu approvi prima dell'invio." },
  { id: "auto",     label: "Automatico",   desc: "Esegue da solo entro i limiti impostati." },
];

export const DEFAULT_AGENT_STATE = Object.fromEntries(
  AGENTS.map((a) => [a.id, { status: "off", mode: "approval", currentTask: null }])
);
