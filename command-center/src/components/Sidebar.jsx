/* ============================================================
   Sidebar — Today + Business Overview attivi; il resto "Soon".
   ============================================================ */
import React from "react";
import {
  Sun, LayoutGrid, Users, Wallet, FolderKanban, Network, Lightbulb,
  Wrench, LineChart, Radar, Settings, Waves,
} from "lucide-react";

const ACTIVE = [
  { id: "today", label: "Today", Icon: Sun },
  { id: "leads", label: "Leads", Icon: Users },
  { id: "finance", label: "Finance", Icon: Wallet },
  { id: "overview", label: "Business Overview", Icon: LayoutGrid },
];
const SOON = [
  { label: "Projects", Icon: FolderKanban },
  { label: "Systems Map", Icon: Network },
  { label: "Idea Vault", Icon: Lightbulb },
  { label: "Tool Library", Icon: Wrench },
  { label: "KPI avanzati", Icon: LineChart },
  { label: "Opportunity Radar", Icon: Radar },
];

export default function Sidebar({ view, setView }) {
  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col px-3 py-5">
      <div className="mb-8 flex items-center gap-2.5 px-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-viola/15">
          <Waves size={16} strokeWidth={1.75} className="text-viola-h" />
        </span>
        <div className="leading-tight">
          <p className="text-[14px] font-semibold text-ink">Command Center</p>
          <p className="text-[11px] text-ink2">Saliou</p>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {ACTIVE.map(({ id, label, Icon }) => {
          const on = view === id;
          return (
            <button key={id} onClick={() => setView(id)}
              className={`group flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors ${
                on ? "bg-viola/12 text-ink" : "text-ink2 hover:bg-white/[0.04] hover:text-ink"}`}
              style={on ? { background: "rgba(139,92,246,0.14)" } : undefined}>
              <Icon size={17} strokeWidth={1.6} className={on ? "text-viola-h" : "text-ink2 group-hover:text-ink"} />
              <span className="text-[13.5px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      <p className="section-label mb-1 mt-7 px-3">Presto disponibili</p>
      <div className="flex flex-col gap-0.5">
        {SOON.map(({ label, Icon }) => (
          <div key={label} className="flex cursor-not-allowed items-center gap-3 rounded-[12px] px-3 py-2.5 opacity-40">
            <Icon size={17} strokeWidth={1.6} className="text-ink2" />
            <span className="text-[13.5px] font-medium text-ink2">{label}</span>
            <span className="ml-auto rounded-full border border-line px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-ink2">Soon</span>
          </div>
        ))}
      </div>

      <button className="mt-auto flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-ink2 transition-colors hover:bg-white/[0.04] hover:text-ink">
        <Settings size={17} strokeWidth={1.6} />
        <span className="text-[13.5px] font-medium">Impostazioni</span>
      </button>
    </aside>
  );
}
