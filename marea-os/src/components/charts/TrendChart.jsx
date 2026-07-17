/* ============================================================
   MAREA OS — TrendChart
   Barre entrate/spese per bucket + linea profitto netto.
   Il bucket "previsione" è reso tratteggiato/traslucido per
   distinguerlo chiaramente dai dati reali.
   ============================================================ */
import React, { useMemo, useState } from "react";
import { fmtEur } from "../../data/events.js";

export default function TrendChart({ buckets, height = 230 }) {
  const [hover, setHover] = useState(null);
  const W = 720, H = height, PADL = 8, PADR = 8, PADB = 26, PADT = 12;
  const innerW = W - PADL - PADR, innerH = H - PADB - PADT;

  const { max, bw, gap } = useMemo(() => {
    const m = Math.max(1, ...buckets.map((b) => Math.max(b.income, b.expense)));
    const n = buckets.length || 1;
    const g = n > 24 ? 2 : 6;
    return { max: m, bw: (innerW - g * (n - 1)) / n, gap: g };
  }, [buckets, innerW]);

  const x = (i) => PADL + i * (bw + gap);
  const yTop = (v) => PADT + innerH - (v / max) * innerH;

  // linea profitto netto (per bucket)
  const netMax = Math.max(1, ...buckets.map((b) => Math.abs(b.income - b.expense)));
  const yNet = (v) => PADT + innerH / 2 - (v / netMax) * (innerH / 2 - 6);
  const linePts = buckets.map((b, i) => [x(i) + bw / 2, yNet(b.income - b.expense)]);
  const lineD = linePts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={PADL} x2={W - PADR} y1={PADT + innerH - f * innerH} y2={PADT + innerH - f * innerH}
            stroke="rgba(120,190,255,0.06)" strokeWidth="1" />
        ))}
        {buckets.map((b, i) => {
          const gi = bw * 0.5, ge = bw * 0.5;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} style={{ cursor: "pointer" }}>
              <rect x={x(i) - 2} y={PADT} width={bw + 4} height={innerH} fill={hover === i ? "rgba(120,190,255,0.05)" : "transparent"} />
              {/* entrate */}
              <rect x={x(i)} y={yTop(b.income)} width={gi} height={Math.max(0, PADT + innerH - yTop(b.income))} rx="2"
                fill={b.forecast ? "none" : "#41F5A2"} opacity={b.forecast ? 1 : 0.9}
                stroke={b.forecast ? "#41F5A2" : "none"} strokeWidth={b.forecast ? 1 : 0} strokeDasharray={b.forecast ? "3 3" : "0"} />
              {/* spese */}
              <rect x={x(i) + gi + (bw - gi - ge)} y={yTop(b.expense)} width={ge} height={Math.max(0, PADT + innerH - yTop(b.expense))} rx="2"
                fill={b.forecast ? "none" : "#FFC857"} opacity={b.forecast ? 1 : 0.65}
                stroke={b.forecast ? "#FFC857" : "none"} strokeWidth={b.forecast ? 1 : 0} strokeDasharray={b.forecast ? "3 3" : "0"} />
              {buckets.length <= 16 && (
                <text x={x(i) + bw / 2} y={H - 8} textAnchor="middle" fontSize="8.5" fontFamily="JetBrains Mono, monospace"
                  fill={hover === i ? "#F5F8FC" : "#5A6675"}>{b.label}</text>
              )}
            </g>
          );
        })}
        {/* linea profitto */}
        <path d={lineD} fill="none" stroke="#26E6FF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        {linePts.map((p, i) => !buckets[i].forecast && (
          <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 3 : 1.6} fill="#26E6FF" />
        ))}
      </svg>

      {hover != null && buckets[hover] && (
        <div className="pointer-events-none absolute left-0 top-0 rounded-lg border border-hair bg-[#0b1017] px-2.5 py-1.5 text-[10px] shadow-card"
          style={{ transform: `translateX(${Math.min(80, (hover / buckets.length) * 100)}%)` }}>
          <p className="num mb-0.5 font-semibold text-fg">{buckets[hover].label}{buckets[hover].forecast ? " · previsione" : ""}</p>
          <p className="num text-green">↑ {fmtEur(buckets[hover].income)}</p>
          <p className="num text-yellow">↓ {fmtEur(buckets[hover].expense)}</p>
          <p className="num text-cyan">= {fmtEur(buckets[hover].income - buckets[hover].expense)}</p>
        </div>
      )}

      <div className="mt-1 flex items-center gap-4 px-1">
        <span className="num flex items-center gap-1.5 text-[9px] text-muted"><span className="h-2 w-2 rounded-sm bg-green" /> ENTRATE</span>
        <span className="num flex items-center gap-1.5 text-[9px] text-muted"><span className="h-2 w-2 rounded-sm bg-yellow opacity-70" /> SPESE</span>
        <span className="num flex items-center gap-1.5 text-[9px] text-muted"><span className="h-2 w-2 rounded-full bg-cyan" /> PROFITTO</span>
        <span className="num flex items-center gap-1.5 text-[9px] text-muted"><span className="h-2 w-2 rounded-sm border border-dashed border-green" /> PREVISIONE</span>
      </div>
    </div>
  );
}
