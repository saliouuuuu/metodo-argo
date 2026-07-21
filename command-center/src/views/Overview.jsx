/* ============================================================
   Pagina 2 — Business Overview
   Una card per progetto: status dot, obiettivo in una riga,
   un solo KPI, ultimo aggiornamento. Griglia max 2 colonne.
   ============================================================ */
import React from "react";
import { motion } from "framer-motion";
import { useStore } from "../data/store.js";

const GROUPS = [
  { key: "active", label: "Attivo", dot: "#8B5CF6" },
  { key: "in_construction", label: "In costruzione", dot: "#FF9F0A" },
  { key: "standby", label: "Standby", dot: "#98989D" },
];

function ProjectCard({ p, dot, updated }) {
  return (
    <div className="glass group p-5 transition-[background,border-color] hover:border-white/10"
      style={{ cursor: "default" }}>
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 rounded-full" style={{ background: dot, boxShadow: `0 0 10px ${dot}66` }} />
        <h3 className="text-[16px] font-semibold text-ink">{p.name}</h3>
      </div>
      <p className="mt-2 text-[13.5px] leading-snug text-ink2">{p.current_milestone}</p>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="section-label">{p.kpi_label}</p>
          <p className="mt-1 text-[18px] font-semibold text-ink">{p.kpi_value}</p>
        </div>
        <span className="tnum text-[11px] text-ink2">agg. {updated}</span>
      </div>
    </div>
  );
}

export default function Overview() {
  const pm = useStore((s) => s.project_management);
  const future = useStore((s) => s.business_overview.future);
  const updated = useStore((s) => s.last_updated);
  const byGroup = (g) => Object.values(pm).filter((p) => p.group === g);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: "easeOut" }}
      className="mx-auto max-w-[1040px] px-8 py-9">
      <h1 className="text-[30px] font-semibold tracking-tight text-ink">Business Overview</h1>
      <p className="mt-1 text-[13.5px] text-ink2">Radar sintetico degli asset — vista dall'alto, zero ansia.</p>

      <div className="mt-8 flex flex-col gap-8">
        {GROUPS.map(({ key, label, dot }) => {
          const items = byGroup(key);
          if (!items.length) return null;
          return (
            <section key={key}>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
                <p className="section-label">{label}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.map((p) => <ProjectCard key={p.name} p={p} dot={dot} updated={updated} />)}
              </div>
            </section>
          );
        })}

        {/* Futuro / incubatore — card leggere, non progetti attivi */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ink2/50" />
            <p className="section-label">Futuro · Incubatore</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {future.map((name) => (
              <span key={name} className="rounded-2xl border border-line bg-white/[0.015] px-4 py-2.5 text-[13px] text-ink2">{name}</span>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
