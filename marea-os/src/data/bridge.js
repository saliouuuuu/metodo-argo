/* ============================================================
   MAREA OS — Bridge dati
   In Electron: window.marea (preload) → store persistente su
   disco + API locale per gli agenti.
   Nel browser (sviluppo/anteprima): nessuna persistenza, si
   parte direttamente in modalità DEMO.
   ============================================================ */

export const isElectron = typeof window !== "undefined" && !!window.marea;

export async function bootstrap() {
  if (isElectron) {
    // { events, agents, settings, api: { port, token } }
    return await window.marea.bootstrap();
  }
  return { events: [], agents: null, settings: {}, api: null };
}

/** Salva un evento REALE (mai i demo). Ritorna l'evento arricchito. */
export async function persistEvent(evt) {
  if (isElectron) return await window.marea.addEvent(evt);
  return evt; // browser: solo in memoria
}

export function onExternalEvent(cb) {
  if (isElectron) return window.marea.onEvent(cb); // eventi push dall'API agenti
  return () => {};
}

export async function persistAgentState(agentId, patch) {
  if (isElectron) return await window.marea.setAgent(agentId, patch);
}

export async function persistSetting(key, value) {
  if (isElectron) return await window.marea.setSetting(key, value);
}

/* ---------- Motore Outreach (solo Electron) ---------- */
const OUTREACH_STUB = {
  status: async () => null,
  setConfig: async () => null,
  verify: async () => ({ ok: false, error: "Disponibile nell'app desktop" }),
  sendNow: async () => ({ ok: false, error: "Disponibile nell'app desktop" }),
  start: async () => ({ ok: false }), startBulk: async () => ({ ok: false }),
  stop: async () => ({ ok: false }), approve: async () => ({ ok: false }), discard: async () => ({ ok: false }),
  onStatus: () => () => {},
};
export const outreach = isElectron ? window.marea.outreach : OUTREACH_STUB;
