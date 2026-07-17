/* ============================================================
   MAREA OS — Finance (wallet premium)
   ============================================================ */
import React, { useMemo, useState } from "react";
import { TrendingUp, Crown, Layers, Clock, Repeat, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useStore, useDerived } from "../data/store.js";
import { fmtEur, fmtDate, isToday, fmtTime } from "../data/events.js";
import { financeStats, forecast } from "../data/analytics.js";
import { Card, Eyebrow, Rolling, Delta, Bar, Pill, Empty } from "../components/ui/index.jsx";
import TrendChart from "../components/charts/TrendChart.jsx";

const RANGES = [
  { id: "7d", label: "7G", days: 7 },
  { id: "30d", label: "30G", days: 30 },
  { id: "3m", label: "3M", days: 92 },
  { id: "6m", label: "6M", days: 183 },
  { id: "1y", label: "1A", days: 365 },
  { id: "all", label: "Tutto", days: Infinity },
];

function buildBuckets(tx, range, forecastIncome) {
  const now = new Date();
  const monthly = range.days >= 92;
  const buckets = [];
  if (monthly) {
    const n = range.days === 92 ? 3 : range.days === 183 ? 6 : range.days === 365 ? 12 : 12;
    const count = range.id === "all"
      ? Math.min(14, Math.max(3, (now.getFullYear() * 12 + now.getMonth()) - (() => {
          const first = tx.length ? new Date(tx[tx.length - 1].ts) : now;
          return first.getFullYear() * 12 + first.getMonth();
        })() + 1))
      : n;
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("it-IT", { month: "short" }), income: 0, expense: 0, isCurrentMonth: i === 0 });
    }
    const idx = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
    for (const t of tx) { const d = new Date(t.ts); const k = `${d.getFullYear()}-${d.getMonth()}`; if (idx[k] != null) buckets[idx[k]][t.kind === "income" ? "income" : "expense"] += t.amount; }
    // bucket previsione = mese corrente proiettato
    if (forecastIncome != null) {
      const cur = buckets[buckets.length - 1];
      const recExp = cur.expense; // stima spese: quelle già viste nel mese
      buckets.push({ key: "fc", label: "prev.", income: Math.round(forecastIncome), expense: Math.round(recExp), forecast: true });
    }
  } else {
    const step = range.days === 7 ? 1 : 3;
    const n = Math.ceil(range.days / step);
    for (let i = n - 1; i >= 0; i--) {
      const end = new Date(now); end.setHours(23, 59, 59, 999); end.setDate(now.getDate() - i * step);
      const start = new Date(end); start.setDate(end.getDate() - (step - 1)); start.setHours(0, 0, 0, 0);
      buckets.push({ start: start.getTime(), end: end.getTime(),
        label: step === 1 ? end.toLocaleDateString("it-IT", { day: "2-digit", month: "short" }) : `${start.getDate()}`, income: 0, expense: 0 });
    }
    for (const t of tx) { const ts = new Date(t.ts).getTime(); const b = buckets.find((b) => ts >= b.start && ts <= b.end); if (b) b[t.kind === "income" ? "income" : "expense"] += t.amount; }
  }
  return buckets;
}

function StatCard({ Icon, label, value, sub, accent = "#8B97A8" }) {
  return (
    <Card hover className="p-4">
      <div className="flex items-center gap-2">
        <Icon size={13} style={{ color: accent }} strokeWidth={2} />
        <Eyebrow>{label}</Eyebrow>
      </div>
      <p className="num mt-1.5 truncate text-[16px] font-semibold text-fg">{value}</p>
      {sub && <p className="mt-0.5 truncate text-[10.5px] text-muted">{sub}</p>}
    </Card>
  );
}

export default function Finance() {
  const derived = useDerived();
  const mode = useStore((s) => s.mode);
  const goal = useStore((s) => s.settings.revenueGoal) || 5000;
  const [range, setRange] = useState(RANGES[3]);

  const stats = financeStats(derived);
  const fc = forecast(derived, goal);
  const { finance, tx } = derived;
  const buckets = useMemo(() => buildBuckets(tx, range, range.days >= 92 ? fc.endOfMonth : null), [tx, range, fc.endOfMonth]);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-4 p-4 lg:p-5">
      {/* WALLET HERO */}
      <Card ambient="green" className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1.2fr_1.4fr] lg:p-7">
        <div>
          <Eyebrow>PROFITTO TOTALE</Eyebrow>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-[48px] font-extrabold leading-none tracking-tight text-fg lg:text-[60px]">
              <Rolling value={finance.profit} prefix="€" glowColor="rgba(65,245,162,.5)" />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Delta pct={stats.growth} />
            <span className="text-[12px] text-muted">rispetto al mese precedente · margine <span className="num text-fg">{finance.income ? Math.round((finance.profit / finance.income) * 100) : 0}%</span></span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {[
            { l: "ENTRATE", v: finance.income, c: "#41F5A2", Icon: ArrowUpRight },
            { l: "SPESE", v: finance.expenses, c: "#FFC857", Icon: ArrowDownRight },
            { l: "CREDITI", v: stats.receivable, c: "#3388FF", Icon: Clock },
            { l: "OBIETTIVO", v: goal, c: "#26E6FF", Icon: TrendingUp },
          ].map((m) => (
            <div key={m.l} className="rounded-xl border border-hair bg-black/20 p-3.5">
              <div className="flex items-center gap-1.5"><m.Icon size={12} style={{ color: m.c }} /><Eyebrow>{m.l}</Eyebrow></div>
              <p className="num mt-1 text-[16px] font-semibold" style={{ color: m.c }}>{fmtEur(m.v)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* CHART + FORECAST */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <Eyebrow>ANDAMENTO</Eyebrow>
            <div className="flex items-center gap-1 rounded-lg border border-hair2 bg-card2 p-0.5">
              {RANGES.map((r) => (
                <button key={r.id} onClick={() => setRange(r)}
                  className={`num rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${range.id === r.id ? "bg-[rgba(38,230,255,.14)] text-cyan" : "text-muted hover:text-fg"}`}>{r.label}</button>
              ))}
            </div>
          </div>
          <TrendChart buckets={buckets} />
        </Card>

        <Card className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <Eyebrow>PREVISIONE FINE MESE</Eyebrow>
            {mode === "demo" && <Pill tone="violet">SIMULATA</Pill>}
          </div>
          <p className="num mt-2 text-[34px] font-bold leading-none text-cyan">{fmtEur(fc.endOfMonth)}</p>
          <p className="mt-2 text-[11.5px] text-muted">Ritmo attuale <span className="num text-green">+{fmtEur(fc.perDay)}/giorno</span> · {fc.daysLeft} giorni rimasti</p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px]"><span className="text-muted">Probabilità obiettivo</span><span className="num font-semibold text-fg">{fc.probability}%</span></div>
            <Bar pct={fc.probability} color={fc.probability >= 60 ? "#41F5A2" : fc.probability >= 35 ? "#FFC857" : "#FF5E6C"} className="mt-1.5" />
          </div>

          <div className="mt-4 grid gap-2 border-t border-hair pt-3">
            {[
              ["Conservativo", fc.conservative, "#8B97A8"],
              ["Realistico", fc.realistic, "#26E6FF"],
              ["Ottimistico", fc.optimistic, "#41F5A2"],
            ].map(([l, v, c]) => (
              <div key={l} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[11.5px] text-muted"><span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{l}</span>
                <span className="num text-[13px] font-semibold" style={{ color: c }}>{fmtEur(v)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[9.5px] leading-relaxed text-faint">
            Calcolata da media giornaliera, spese ricorrenti e pipeline ponderata. Con dati reali userà anche contratti confermati e pagamenti attesi.
          </p>
        </Card>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard Icon={TrendingUp} label="RICAVO MEDIO/CLIENTE" value={fmtEur(stats.arpc)} accent="#26E6FF" />
        <StatCard Icon={Crown} label="CLIENTE TOP" value={stats.topClient?.name || "—"} sub={stats.topClient ? fmtEur(stats.topClient.value) : ""} accent="#FFC857" />
        <StatCard Icon={Layers} label="SERVIZIO TOP" value={stats.topService?.[0] || "—"} sub={stats.topService ? fmtEur(stats.topService[1]) : ""} accent="#9D6CFF" />
        <StatCard Icon={Clock} label="CREDITI DA INCASSARE" value={fmtEur(stats.receivable)} accent="#3388FF" />
        <StatCard Icon={Repeat} label="COSTI RICORRENTI/MESE" value={fmtEur(stats.recurringMonthly)} accent="#FF5E6C" />
        <StatCard Icon={TrendingUp} label="CRESCITA MENSILE" value={`${stats.growth >= 0 ? "+" : ""}${stats.growth}%`} accent={stats.growth >= 0 ? "#41F5A2" : "#FF5E6C"} />
      </div>

      {/* MOVIMENTI */}
      <Card className="p-4">
        <Eyebrow className="mb-2.5 block">MOVIMENTI</Eyebrow>
        {!tx.length ? (
          <Empty title="Nessun movimento" hint="Registra entrate e spese con ⌘K o lascia che il Finance Agent le spinga via API." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead><tr className="border-b border-hair text-left">
                {["MOVIMENTO", "CATEGORIA", "IMPORTO", "STATO", "DATA"].map((h) => <th key={h} className="eyebrow pb-2 pr-3 font-medium">{h}</th>)}
              </tr></thead>
              <tbody>
                {tx.slice(0, 60).map((t) => (
                  <tr key={t.id} className="border-b border-hair2">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: t.kind === "income" ? "rgba(65,245,162,.12)" : "rgba(255,200,87,.12)", color: t.kind === "income" ? "#41F5A2" : "#FFC857" }}>
                          {t.kind === "income" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        </span>
                        <span className="text-[12.5px] font-medium text-fg">{t.note || t.category}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3"><span className="text-[11.5px] text-muted">{t.category}</span></td>
                    <td className="num py-2.5 pr-3 text-[13px] font-semibold" style={{ color: t.kind === "income" ? "#41F5A2" : "#FFC857" }}>{t.kind === "income" ? "+" : "−"}{fmtEur(t.amount)}</td>
                    <td className="py-2.5 pr-3"><Pill tone={t.kind === "income" ? "green" : "yellow"}>{t.kind === "income" ? "Incassato" : "Pagato"}</Pill></td>
                    <td className="num py-2.5 text-[10.5px] text-faint">{isToday(t.ts) ? fmtTime(t.ts) : fmtDate(t.ts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
