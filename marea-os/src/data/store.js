/* ============================================================
   MAREA OS — Store applicativo (zustand)
   Due binari di dati SEMPRE separati:
   - realEvents: persistiti su disco (Electron) — la verità.
   - demoEvents: volatili, generati dal motore demo.
   La UI mostra un binario alla volta (mode: 'real' | 'demo').
   ============================================================ */
import { create } from "zustand";
import { deriveState, makeEvent } from "./events.js";
import { DEFAULT_AGENT_STATE } from "./agents.js";
import { seedHistory, startLiveDemo, DEMO_AGENT_STATE } from "./demo.js";
import { isElectron, bootstrap, persistEvent, onExternalEvent, persistAgentState, persistSetting } from "./bridge.js";

let stopDemo = null;
let demoPool = [];

export const useStore = create((set, get) => ({
  ready: false,
  mode: isElectron ? "real" : "demo",
  view: new URLSearchParams(location.search).get("view") || "overview",
  booted: false,
  paletteOpen: false,
  settingsOpen: false,
  api: null,                 // { port, token } in Electron
  settings: { sound: false, revenueGoal: 5000 },
  realEvents: [],
  demoEvents: [],
  agentsReal: { ...DEFAULT_AGENT_STATE },
  agentsDemo: { ...DEMO_AGENT_STATE },
  corePulse: { n: 0, cat: "info" },

  /* ---------- init ---------- */
  init: async () => {
    const boot = await bootstrap();
    set({
      realEvents: boot.events || [],
      agentsReal: { ...DEFAULT_AGENT_STATE, ...(boot.agents || {}) },
      settings: { ...get().settings, ...(boot.settings || {}) },
      api: boot.api || null,
      ready: true,
    });
    // eventi push dagli agenti via API locale
    onExternalEvent((evt) => {
      set((s) => ({ realEvents: [...s.realEvents, evt] }));
      get()._pulse(evt);
    });
    if (get().mode === "demo") get()._startDemo();
  },

  _startDemo: () => {
    if (stopDemo) return;
    const seeded = seedHistory();
    demoPool = seeded.leadPool;
    set({ demoEvents: seeded.events, agentsDemo: { ...DEMO_AGENT_STATE } });
    stopDemo = startLiveDemo(demoPool, (evt) => {
      set((s) => ({ demoEvents: [...s.demoEvents, evt] }));
      get()._pulse(evt);
    });
  },
  _stopDemo: () => {
    if (stopDemo) { stopDemo(); stopDemo = null; }
  },

  setMode: (mode) => {
    if (mode === get().mode) return;
    set({ mode });
    if (mode === "demo") get()._startDemo();
    else get()._stopDemo();
  },

  setView: (view) => set({ view }),
  setBooted: () => set({ booted: true }),
  openPalette: (open = true) => set({ paletteOpen: open }),
  openSettings: (open = true) => set({ settingsOpen: open }),

  _pulse: (evt) => {
    const cat =
      evt.type === "client.won" || evt.type === "email.replied" || evt.type === "finance.income" ? "success"
      : evt.type.includes("error") || evt.type === "client.lost" || evt.type === "finance.expense" ? "warning"
      : evt.source && evt.source !== "manual" && evt.source !== "api" ? "ai"
      : "info";
    set((s) => ({ corePulse: { n: s.corePulse.n + 1, cat } }));
  },

  /* ---------- dispatch ---------- */
  addEvent: async (type, data = {}) => {
    const { mode } = get();
    if (mode === "demo") {
      const evt = makeEvent(type, data, { source: "manual", demo: true });
      set((s) => ({ demoEvents: [...s.demoEvents, evt] }));
      get()._pulse(evt);
      return evt;
    }
    const evt = await persistEvent(makeEvent(type, data, { source: "manual", demo: false }));
    set((s) => ({ realEvents: [...s.realEvents, evt] }));
    get()._pulse(evt);
    return evt;
  },

  setAgent: (agentId, patch) => {
    const { mode } = get();
    if (mode === "demo") {
      set((s) => ({ agentsDemo: { ...s.agentsDemo, [agentId]: { ...s.agentsDemo[agentId], ...patch } } }));
    } else {
      set((s) => ({ agentsReal: { ...s.agentsReal, [agentId]: { ...s.agentsReal[agentId], ...patch } } }));
      persistAgentState(agentId, patch);
    }
  },

  setSetting: (key, value) => {
    set((s) => ({ settings: { ...s.settings, [key]: value } }));
    persistSetting(key, value);
  },
}));

/* ---------- selettori ---------- */
export const useEvents = () =>
  useStore((s) => (s.mode === "demo" ? s.demoEvents : s.realEvents));

export const useAgentsState = () =>
  useStore((s) => (s.mode === "demo" ? s.agentsDemo : s.agentsReal));

/** Aggregati derivati, memoizzati sull'array eventi corrente. */
let _lastEvents = null, _lastDerived = null;
export function useDerived() {
  const events = useEvents();
  if (events !== _lastEvents) { _lastEvents = events; _lastDerived = deriveState(events); }
  return _lastDerived;
}
