/* ============================================================
   MAREA OS — Analytics deterministica
   Metriche pipeline, statistiche finanziarie e forecast calcolati
   SEMPRE dai dati (mai numeri casuali). In demo restano coerenti
   con lo storico generato; in reale useranno gli stessi calcoli.
   ============================================================ */
import { STAGES, STAGE_INDEX, daysAgo } from "./events.js";

// probabilità di chiusura per stadio (pipeline ponderata)
export const STAGE_PROB = {
  new: 0.03, verified: 0.06, contacted: 0.12, replied: 0.28,
  meeting: 0.48, quote: 0.62, won: 1, lost: 0,
};

const OPEN = ["contacted", "replied", "meeting", "quote"];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/* ---------- Pipeline ---------- */
export function pipelineMetrics(leads) {
  const reach = {}; // quanti lead hanno raggiunto ALMENO lo stadio i (esclusi persi)
  for (const s of STAGES) reach[s.id] = 0;
  for (const l of leads) {
    if (l.stage === "lost") continue;
    for (const s of STAGES) {
      if (s.id === "lost") continue;
      if (STAGE_INDEX[l.stage] >= STAGE_INDEX[s.id]) reach[s.id]++;
    }
  }
  const perStage = STAGES.map((s, i) => {
    const inStage = leads.filter((l) => l.stage === s.id);
    const value = inStage.reduce((sum, l) => sum + (l.value || 0), 0);
    const prev = STAGES[i - 1];
    const conv = prev && prev.id !== "lost" && reach[prev.id]
      ? Math.round((reach[s.id] / reach[prev.id]) * 100) : null;
    const avgDays = inStage.length
      ? Math.round(inStage.reduce((sum, l) => sum + daysAgo(l.updated), 0) / inStage.length)
      : 0;
    return { ...s, count: inStage.length, value, conv, avgDays };
  });

  const won = leads.filter((l) => l.stage === "won");
  const weighted = leads
    .filter((l) => OPEN.includes(l.stage))
    .reduce((sum, l) => sum + (l.value || 0) * (STAGE_PROB[l.stage] || 0), 0);
  const potential = leads.filter((l) => OPEN.includes(l.stage)).reduce((s, l) => s + (l.value || 0), 0);
  const contacted = reach.contacted || 0;
  const convRate = contacted ? Math.round((won.length / contacted) * 100) : 0;
  const avgCloseDays = won.length
    ? Math.round(won.reduce((s, l) => s + Math.max(0, daysAgo(l.ts) - daysAgo(l.updated)), 0) / won.length)
    : 0;

  return {
    perStage,
    active: leads.filter((l) => l.stage !== "won" && l.stage !== "lost").length,
    potential, weighted: Math.round(weighted),
    convRate, avgCloseDays,
    wonValue: won.reduce((s, l) => s + (l.value || 0), 0),
  };
}

/* ---------- Finance ---------- */
export function financeStats(derived) {
  const { tx, leads } = derived;
  const now = new Date();
  const inMonth = (d, back = 0) => {
    const x = new Date(d);
    const m = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const m2 = new Date(now.getFullYear(), now.getMonth() - back + 1, 1);
    return x >= m && x < m2;
  };
  const monthIncome = tx.filter((t) => t.kind === "income" && inMonth(t.ts)).reduce((s, t) => s + t.amount, 0);
  const prevIncome = tx.filter((t) => t.kind === "income" && inMonth(t.ts, 1)).reduce((s, t) => s + t.amount, 0);
  const growth = prevIncome ? Math.round(((monthIncome - prevIncome) / prevIncome) * 100) : (monthIncome ? 100 : 0);

  const won = leads.filter((l) => l.stage === "won" && l.value > 0);
  const arpc = won.length ? Math.round(won.reduce((s, l) => s + l.value, 0) / won.length) : 0;
  const topClient = won.slice().sort((a, b) => b.value - a.value)[0] || null;

  const byService = {};
  for (const t of tx) if (t.kind === "income") byService[t.category] = (byService[t.category] || 0) + t.amount;
  const topService = Object.entries(byService).sort((a, b) => b[1] - a[1])[0] || null;

  const recurring = tx.filter((t) => t.kind === "expense" && /mensile|hosting|software|abbon/i.test(t.category + " " + (t.note || "")))
    .reduce((s, t) => s + t.amount, 0);

  // "crediti da incassare": valore dei preventivi ancora aperti (stadio quote)
  const receivable = leads.filter((l) => l.stage === "quote").reduce((s, l) => s + (l.value || 0), 0);

  return { monthIncome, prevIncome, growth, arpc, topClient, topService, recurringMonthly: recurring, receivable };
}

/* ---------- Forecast deterministico ---------- */
export function forecast(derived, goal) {
  const stats = financeStats(derived);
  const pm = pipelineMetrics(derived.leads);
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(0, daysInMonth - dayOfMonth);

  const dailyAvg = dayOfMonth ? stats.monthIncome / dayOfMonth : 0;
  const runRate = stats.monthIncome + dailyAvg * daysLeft;
  // quota della pipeline ponderata che può realisticamente chiudere entro fine mese
  const pipelineMonth = pm.weighted * clamp(daysLeft / 30, 0.2, 0.8);

  const conservative = Math.round(runRate * 0.9);
  const realistic = Math.round(runRate + pipelineMonth * 0.35);
  const optimistic = Math.round(runRate + pipelineMonth * 0.7);

  const probability = goal > 0 ? clamp(Math.round((realistic / goal) * 78), 4, 96) : 0;

  return {
    endOfMonth: realistic,
    conservative, realistic, optimistic,
    probability,
    perDay: Math.round(dailyAvg),
    daysLeft,
    goal,
    reachedPct: goal ? Math.round((stats.monthIncome / goal) * 100) : 0,
    monthIncome: stats.monthIncome,
  };
}
