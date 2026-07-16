/* ============================================================
   MAREA OS — Finance: entrate, spese, profitto, obiettivo
   ============================================================ */
import React, { useMemo } from "react";
import { useStore, useDerived } from "../data/store.js";
import { fmtEur, fmtDate, isToday, fmtTime } from "../data/events.js";
import { Panel, SysLabel, Rolling, Empty, Segmented } from "../components/ui.jsx";

function MonthlyChart({ tx }) {
  const months = useMemo(() => {
    const map = new Map();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      map.set(`${d.getFullYear()}-${d.getMonth()}`, {
        label: d.toLocaleDateString("it-IT", { month: "short" }), inc: 0, exp: 0,
      });
    }
    for (const t of tx) {
      const d = new Date(t.ts);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (map.has(k)) map.get(k)[t.kind === "income" ? "inc" : "exp"] += t.amount;
    }
    return [...map.values()];
  }, [tx]);

  const max = Math.max(1, ...months.map((m) => Math.max(m.inc, m.exp)));
  const W = 560, H = 190, PAD = 26;
  const bw = (W - PAD * 2) / months.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={PAD} x2={W - 4} y1={H - 24 - f * (H - 48)} y2={H - 24 - f * (H - 48)}
          stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
      ))}
      {months.map((m, i) => {
        const x = PAD + i * bw;
        const hInc = (m.inc / max) * (H - 48);
        const hExp = (m.exp / max) * (H - 48);
        return (
          <g key={i}>
            <rect x={x + bw * 0.18} y={H - 24 - hInc} width={bw * 0.26} height={Math.max(hInc, 1)} rx="2" fill="#34d399" opacity="0.85" />
            <rect x={x + bw * 0.52} y={H - 24 - hExp} width={bw * 0.26} height={Math.max(hExp, 1)} rx="2" fill="#fbbf24" opacity="0.7" />
            <text x={x + bw / 2} y={H - 8} textAnchor="middle" fill="rgb(113,113,122)" fontSize="9"
              fontFamily="JetBrains Mono, monospace">{m.label.toUpperCase()}</text>
          </g>
        );
      })}
      <text x={PAD} y={12} fill="rgb(82,82,91)" fontSize="8.5" fontFamily="JetBrains Mono, monospace"
        letterSpacing="2">■ ENTRATE&nbsp;&nbsp;■ SPESE (MAX {fmtEur(max)})</text>
    </svg>
  );
}

export default function Finance() {
  const { tx, finance } = useDerived();
  const goal = useStore((s) => s.settings.revenueGoal) || 5000;

  const month = useMemo(() => {
    const now = new Date();
    let inc = 0, exp = 0;
    for (const t of tx) {
      const d = new Date(t.ts);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        if (t.kind === "income") inc += t.amount; else exp += t.amount;
      }
    }
    return { inc, exp, profit: inc - exp };
  }, [tx]);

  const goalPct = Math.min(100, Math.round((month.inc / goal) * 100));
  const margin = finance.income ? Math.round((finance.profit / finance.income) * 100) : 0;

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-4 p-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          ["REVENUE · TOTALE", finance.income, "#67e8f9"],
          ["EXPENSES · TOTALE", finance.expenses, "#fbbf24"],
          ["PROFIT · TOTALE", finance.profit, finance.profit >= 0 ? "#34d399" : "#f87171"],
        ].map(([label, v, color]) => (
          <Panel key={label} className="px-4 py-3.5">
            <SysLabel>{label}</SysLabel>
            <p className="mt-1.5 text-xl font-medium" style={{ color }}><Rolling value={v} prefix="€" /></p>
            {label.startsWith("PROFIT") && <p className="num mt-1 text-[10px] text-zinc-600">margine {margin}%</p>}
          </Panel>
        ))}
        <Panel className="px-4 py-3.5">
          <div className="flex items-center justify-between">
            <SysLabel>OBIETTIVO MESE</SysLabel>
            <span className="num text-[10px] text-zinc-500">{fmtEur(goal)}</span>
          </div>
          <p className="mt-1.5 text-xl font-medium text-cyan-200"><Rolling value={month.inc} prefix="€" /></p>
          <div className="mt-2"><Segmented pct={goalPct} color={goalPct >= 100 ? "#34d399" : "#22d3ee"} /></div>
          <p className="num mt-1 text-[10px] text-zinc-600">{goalPct}% raggiunto</p>
        </Panel>
      </div>

      <div className="grid min-h-0 grid-cols-[1.15fr_1fr] gap-4">
        <Panel className="flex min-h-0 flex-col p-4">
          <SysLabel className="mb-2 block">ULTIMI 6 MESI</SysLabel>
          <MonthlyChart tx={tx} />
          <div className="num mt-3 grid grid-cols-3 gap-3 border-t border-white/[0.05] pt-3 text-center">
            <div><p className="text-[15px] text-emerald-300">{fmtEur(month.inc)}</p><p className="label-sys mt-1">ENTRATE MESE</p></div>
            <div><p className="text-[15px] text-amber-300">{fmtEur(month.exp)}</p><p className="label-sys mt-1">SPESE MESE</p></div>
            <div><p className="text-[15px]" style={{ color: month.profit >= 0 ? "#34d399" : "#f87171" }}>{fmtEur(month.profit)}</p><p className="label-sys mt-1">PROFITTO MESE</p></div>
          </div>
        </Panel>

        <Panel className="flex min-h-0 flex-col p-3.5">
          <SysLabel className="mb-2.5 block">MOVIMENTI</SysLabel>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!tx.length ? (
              <Empty title="Nessun movimento" hint="Registra entrate e spese con ⌘K, o lascia che il Finance Agent le spinga via API." />
            ) : (
              <table className="w-full">
                <tbody>
                  {tx.slice(0, 150).map((t) => (
                    <tr key={t.id} className="border-b border-white/[0.035]">
                      <td className="py-2 pr-2">
                        <p className="text-[11.5px] text-zinc-300">{t.category}</p>
                        {t.note && <p className="truncate text-[9.5px] text-zinc-600">{t.note}</p>}
                      </td>
                      <td className="num py-2 pr-3 text-right text-[12px] font-medium"
                        style={{ color: t.kind === "income" ? "#34d399" : "#fbbf24" }}>
                        {t.kind === "income" ? "+" : "−"}{fmtEur(t.amount)}
                      </td>
                      <td className="num py-2 text-right text-[9.5px] text-zinc-600">
                        {isToday(t.ts) ? fmtTime(t.ts) : fmtDate(t.ts)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
