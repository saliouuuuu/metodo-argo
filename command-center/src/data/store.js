/* ============================================================
   CEO Command Center V1 — stato + persistenza (localStorage)
   Basato sullo state.json della spec. Un solo store leggero.
   ============================================================ */
import { useSyncExternalStore } from "react";

const KEY = "ceo_cc_v1";

export const INITIAL = {
  last_updated: new Date().toISOString().slice(0, 10),
  today_focus: {
    top_3_tasks: [
      { id: 1, task: "Finalizzazione offerta/VSL Il Metodo Argo", status: "in_progress" },
      { id: 2, task: "Definizione architettura lead generation per Marea Creative", status: "pending" },
      { id: 3, task: "Scripting e generazione AI per i 2 video giornalieri", status: "pending" },
    ],
    routines: {
      content_engine_video_1: false,
      content_engine_video_2: false,
      outreach_daily: false,
    },
    crm_quick_followups: [
      { contact: "Lead Marea Creative", action: "Inviare proposta servizi" },
      { contact: "Host Vista BnB", action: "Rivedere offerta commerciale" },
    ],
    quick_inbox: [],
  },
  business_overview: {
    active: ["Il Metodo Argo"],
    in_construction: ["Marea Creative"],
    standby: ["Vista BnB"],
    future: ["Dropshipping AI", "SaaS Ideas", "CRWNZ"],
  },
  project_management: {
    metodo_argo: {
      name: "Il Metodo Argo", group: "active",
      current_milestone: "Validazione Funnel & Prime Vendite",
      blockers: "Copywriting VSL & Ottimizzazione Conversioni",
      next_action: "Pubblicare 2 video ad alto valore e testare il traffico",
      kpi_label: "Funnel", kpi_value: "In validazione",
    },
    marea_creative: {
      name: "Marea Creative", group: "in_construction",
      current_milestone: "Setup Infrastruttura Acquisizione",
      blockers: "Standardizzazione pacchetti di servizio",
      next_action: "Mappare workflow outreach automatizzato",
      kpi_label: "Infrastruttura", kpi_value: "In setup",
    },
    vista_bnb: {
      name: "Vista BnB", group: "standby",
      current_milestone: "Apertura Campagna Outreach Host",
      blockers: "In pausa fino a stabilizzazione Argo",
      next_action: "Rivedere lista contatti e offerta commerciale",
      kpi_label: "Stato", kpi_value: "In pausa",
    },
  },
  finance: {
    // Lead chiuse / vinte: diventano ricavi.
    deals: [
      { id: 1, client: "Il Metodo Argo — Corso", project: "Metodo Argo", amount: 97, ts: "2026-07-28", status: "won" },
    ],
    // Movimenti manuali (entrate/uscite non legate a un deal).
    transactions: [
      { id: 1, label: "Abbonamenti tool (n8n, Apify)", amount: -49, ts: "2026-07-25", kind: "expense" },
    ],
  },
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...INITIAL, ...JSON.parse(raw) };
  } catch {}
  return structuredClone(INITIAL);
}

let state = load();
const listeners = new Set();
const emit = () => { listeners.forEach((l) => l()); };
function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }

export function setState(updater) {
  state = typeof updater === "function" ? updater(structuredClone(state)) : { ...state, ...updater };
  state.last_updated = new Date().toISOString().slice(0, 10);
  persist(); emit();
}

export function useStore(selector = (s) => s) {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => selector(state),
    () => selector(state)
  );
}

/* ---------- azioni ---------- */
export const actions = {
  cycleTask(id) {
    setState((s) => {
      const t = s.today_focus.top_3_tasks.find((x) => x.id === id);
      if (t) t.status = t.status === "pending" ? "in_progress" : t.status === "in_progress" ? "done" : "pending";
      return s;
    });
  },
  toggleRoutine(key) {
    setState((s) => { s.today_focus.routines[key] = !s.today_focus.routines[key]; return s; });
  },
  addTask(task) {
    setState((s) => {
      const list = s.today_focus.top_3_tasks;
      if (list.length >= 5) return s; // max 5 righe visibili (spec)
      list.push({ id: Date.now(), task, status: "pending" });
      return s;
    });
  },
  removeTask(id) { setState((s) => { s.today_focus.top_3_tasks = s.today_focus.top_3_tasks.filter((t) => t.id !== id); return s; }); },
  addInbox(text) { setState((s) => { s.today_focus.quick_inbox.unshift({ id: Date.now(), text, ts: new Date().toISOString() }); return s; }); },
  removeInbox(id) { setState((s) => { s.today_focus.quick_inbox = s.today_focus.quick_inbox.filter((x) => x.id !== id); return s; }); },
  doneFollowup(i) { setState((s) => { s.today_focus.crm_quick_followups.splice(i, 1); return s; }); },
  addFollowup(contact, action) {
    setState((s) => {
      if (!s.today_focus.crm_quick_followups.some((f) => f.contact === contact)) {
        s.today_focus.crm_quick_followups.unshift({ contact, action });
      }
      return s;
    });
  },

  /* ---------- finance ---------- */
  addDeal({ client, project, amount }) {
    setState((s) => {
      s.finance.deals.unshift({
        id: Date.now(), client: client.trim(),
        project: (project || "").trim(), amount: Math.round(+amount || 0),
        ts: new Date().toISOString().slice(0, 10), status: "won",
      });
      return s;
    });
  },
  removeDeal(id) { setState((s) => { s.finance.deals = s.finance.deals.filter((d) => d.id !== id); return s; }); },
  addTransaction({ label, amount, kind }) {
    setState((s) => {
      const a = Math.abs(Math.round(+amount || 0));
      s.finance.transactions.unshift({
        id: Date.now(), label: label.trim(),
        amount: kind === "income" ? a : -a,
        ts: new Date().toISOString().slice(0, 10),
        kind: kind === "income" ? "income" : "expense",
      });
      return s;
    });
  },
  removeTransaction(id) { setState((s) => { s.finance.transactions = s.finance.transactions.filter((t) => t.id !== id); return s; }); },
};
