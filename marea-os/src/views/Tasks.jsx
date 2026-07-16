/* ============================================================
   MAREA OS — Tasks: attività personali e operative
   ============================================================ */
import React, { useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useStore, useDerived } from "../data/store.js";
import { nextId, fmtDate } from "../data/events.js";
import { Panel, SysLabel, Empty } from "../components/ui.jsx";

const PRIO = {
  high: { label: "ALTA", color: "#f87171" },
  med:  { label: "MEDIA", color: "#fbbf24" },
  low:  { label: "BASSA", color: "#71717a" },
};

function TaskRow({ t }) {
  const addEvent = useStore((s) => s.addEvent);
  const p = PRIO[t.priority] || PRIO.med;
  const overdue = !t.done && t.due && new Date(t.due).getTime() < Date.now() - 86400000;
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
      t.done ? "border-white/[0.035] bg-white/[0.008] opacity-45" : "border-white/[0.05] bg-white/[0.015]"}`}>
      <button disabled={t.done} onClick={() => addEvent("task.done", { taskId: t.id })}
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border ${
          t.done ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-300"
                 : "border-white/15 text-transparent hover:border-cyan-300/60 hover:text-cyan-300/60"}`}>
        <Check size={11} />
      </button>
      <p className={`min-w-0 flex-1 truncate text-[12.5px] ${t.done ? "text-zinc-500 line-through" : "text-zinc-200"}`}>{t.title}</p>
      <span className="num rounded px-1.5 py-px text-[8.5px] font-bold tracking-wider"
        style={{ color: p.color, background: p.color + "14", border: `1px solid ${p.color}30` }}>{p.label}</span>
      {t.due && (
        <span className={`num w-14 shrink-0 text-right text-[10px] ${overdue ? "font-semibold text-red-300" : "text-zinc-600"}`}>
          {fmtDate(t.due)}
        </span>
      )}
    </div>
  );
}

export default function Tasks() {
  const { tasks } = useDerived();
  const addEvent = useStore((s) => s.addEvent);
  const [title, setTitle] = useState("");
  const [prio, setPrio] = useState("med");

  const groups = useMemo(() => {
    const today = [], overdue = [], later = [], done = [];
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
    for (const t of tasks) {
      if (t.done) { done.push(t); continue; }
      if (!t.due) { later.push(t); continue; }
      const d = new Date(t.due);
      if (d < startOfDay) overdue.push(t);
      else if (d <= endOfDay) today.push(t);
      else later.push(t);
    }
    return { today, overdue, later, done: done.slice(0, 30) };
  }, [tasks]);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    addEvent("task.created", { taskId: nextId("task"), title: title.trim(), priority: prio, due: new Date().toISOString() });
    setTitle("");
  };

  const Section = ({ label, items, accent }) => (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <SysLabel>{label}</SysLabel>
        <span className="num text-[10px]" style={{ color: accent }}>{items.length}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((t) => <TaskRow key={t.id} t={t} />)}
        {!items.length && <p className="px-1 text-[10.5px] text-zinc-700">Niente qui.</p>}
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex h-full max-w-[860px] flex-col gap-4 p-4">
      <Panel className="p-3">
        <form onSubmit={submit} className="flex items-center gap-2">
          <Plus size={15} className="ml-1 shrink-0 text-zinc-600" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nuovo task… (invio per aggiungere, oggi come scadenza)"
            className="w-full bg-transparent py-1.5 text-[13px] text-zinc-100 outline-none placeholder-zinc-600" />
          <select value={prio} onChange={(e) => setPrio(e.target.value)}
            className="num rounded-lg border border-white/10 bg-black px-2 py-1.5 text-[10.5px] text-zinc-300 outline-none">
            <option value="high">Alta</option><option value="med">Media</option><option value="low">Bassa</option>
          </select>
        </form>
      </Panel>

      {!tasks.length ? (
        <Empty title="Nessun task" hint="Aggiungi il primo qui sopra, con ⌘K, o lascia che l'Operations Agent li crei via API." />
      ) : (
        <div className="grid min-h-0 flex-1 content-start gap-5 overflow-y-auto pb-4">
          {groups.overdue.length > 0 && <Section label="IN RITARDO" items={groups.overdue} accent="#f87171" />}
          <Section label="OGGI" items={groups.today} accent="#67e8f9" />
          <Section label="PROSSIMI" items={groups.later} accent="#a1a1aa" />
          <Section label="COMPLETATI" items={groups.done} accent="#34d399" />
        </div>
      )}
    </div>
  );
}
