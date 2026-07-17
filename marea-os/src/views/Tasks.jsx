/* ============================================================
   MAREA OS — Tasks: workspace operativo (Today / Board / All)
   ============================================================ */
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, X, CalendarDays, LayoutGrid, List } from "lucide-react";
import { useStore, useDerived } from "../data/store.js";
import { nextId, fmtDate, isToday } from "../data/events.js";
import { AGENTS } from "../data/agents.js";
import { Card, Eyebrow, Pill, Btn, Bar, Empty, Tabs } from "../components/ui/index.jsx";

const PRIO = { high: { label: "ALTA", color: "#FF5E6C" }, med: { label: "MEDIA", color: "#FFC857" }, low: { label: "BASSA", color: "#8B97A8" } };
const startOfDay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const endOfDay = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; };

function TaskRow({ t }) {
  const addEvent = useStore((s) => s.addEvent);
  const p = PRIO[t.priority] || PRIO.med;
  const overdue = !t.done && t.due && new Date(t.due) < startOfDay();
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${t.done ? "border-hair2 bg-white/[0.006] opacity-45" : "border-hair2 bg-white/[0.012]"}`}>
      <button disabled={t.done} onClick={() => addEvent("task.done", { taskId: t.id })}
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border ${t.done ? "border-[rgba(65,245,162,.4)] bg-[rgba(65,245,162,.2)] text-green" : "border-hair text-transparent hover:border-cyan hover:text-cyan"}`}><Check size={11} /></button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[12.5px] ${t.done ? "text-muted line-through" : "text-fg"}`}>{t.title}</p>
        {(t.project || t.assignee) && <p className="truncate text-[10px] text-faint">{[t.project, t.assignee].filter(Boolean).join(" · ")}</p>}
      </div>
      <span className="num rounded px-1.5 py-px text-[8.5px] font-bold" style={{ color: p.color, background: p.color + "18" }}>{p.label}</span>
      {t.due && <span className={`num w-14 shrink-0 text-right text-[10px] ${overdue ? "font-semibold text-red" : "text-faint"}`}>{fmtDate(t.due)}</span>}
    </div>
  );
}

function CreateModal({ open, onClose }) {
  const addEvent = useStore((s) => s.addEvent);
  const [f, setF] = useState({ title: "", description: "", project: "", due: "", priority: "med", assignee: "" });
  if (!open) return null;
  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    addEvent("task.created", { taskId: nextId("task"), title: f.title.trim(), description: f.description,
      project: f.project, due: f.due || new Date().toISOString(), priority: f.priority, assignee: f.assignee });
    setF({ title: "", description: "", project: "", due: "", priority: "med", assignee: "" });
    onClose();
  };
  const inp = "rounded-lg border border-hair bg-bg px-3 py-2 text-[13px] text-fg outline-none focus:border-[rgba(38,230,255,.5)] placeholder-faint";
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/75 p-4 pt-[10vh] backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.form onSubmit={submit} initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} className="card w-[520px] max-w-full p-5">
        <div className="mb-4 flex items-center justify-between"><p className="text-[15px] font-semibold text-fg">Nuovo task</p><button type="button" onClick={onClose} className="text-muted hover:text-fg"><X size={16} /></button></div>
        <div className="grid gap-3">
          <input autoFocus placeholder="Titolo del task *" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inp} />
          <textarea placeholder="Descrizione (facoltativa)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} className={inp} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Progetto" value={f.project} onChange={(e) => setF({ ...f, project: e.target.value })} className={inp} />
            <input type="date" value={f.due?.slice(0, 10) || ""} onChange={(e) => setF({ ...f, due: e.target.value ? new Date(e.target.value).toISOString() : "" })} className={`num ${inp}`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1"><Eyebrow>PRIORITÀ</Eyebrow>
              <select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} className={`num ${inp}`}><option value="high">Alta</option><option value="med">Media</option><option value="low">Bassa</option></select></label>
            <label className="grid gap-1"><Eyebrow>RESPONSABILE</Eyebrow>
              <select value={f.assignee} onChange={(e) => setF({ ...f, assignee: e.target.value })} className={`${inp}`}><option value="">Saliou</option>{AGENTS.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}</select></label>
          </div>
          <button type="submit" className="mt-1 rounded-lg bg-cyan py-2.5 text-[13px] font-semibold text-[#04121a] hover:brightness-110">Crea task</button>
        </div>
      </motion.form>
    </div>
  );
}

const BOARD_COLS = [
  { id: "backlog", label: "BACKLOG", color: "#8B97A8" },
  { id: "todo", label: "DA FARE", color: "#3388FF" },
  { id: "doing", label: "IN CORSO", color: "#26E6FF" },
  { id: "review", label: "IN REVISIONE", color: "#9D6CFF" },
  { id: "blocked", label: "BLOCCATO", color: "#FF5E6C" },
  { id: "done", label: "COMPLETATO", color: "#41F5A2" },
];
function boardCol(t) {
  if (t.done) return "done";
  if (t.status && BOARD_COLS.some((c) => c.id === t.status)) return t.status;
  if (!t.due) return "backlog";
  const d = new Date(t.due);
  if (d <= endOfDay()) return "doing";
  return "todo";
}

export default function Tasks() {
  const { tasks } = useDerived();
  const [view, setView] = useState("today");
  const [creating, setCreating] = useState(false);

  const metrics = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    const doneWeek = tasks.filter((t) => t.done && t.doneTs && new Date(t.doneTs).getTime() > weekAgo).length;
    const today = tasks.filter((t) => !t.done && t.due && isToday(t.due)).length;
    const overdue = tasks.filter((t) => !t.done && t.due && new Date(t.due) < startOfDay()).length;
    const open = tasks.filter((t) => !t.done).length;
    const pct = tasks.length ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : 0;
    return { today, overdue, doneWeek, blocked: tasks.filter((t) => t.status === "blocked").length, pct, open };
  }, [tasks]);

  const groups = useMemo(() => {
    const abs = [], today = [], waiting = [], done = [];
    for (const t of tasks) {
      if (t.done) { done.push(t); continue; }
      if (t.priority === "high") { abs.push(t); continue; }
      if (t.due && new Date(t.due) <= endOfDay()) today.push(t);
      else waiting.push(t);
    }
    return { abs, today, waiting, done: done.slice(0, 40) };
  }, [tasks]);

  const board = useMemo(() => {
    const m = Object.fromEntries(BOARD_COLS.map((c) => [c.id, []]));
    for (const t of tasks) m[boardCol(t)].push(t);
    return m;
  }, [tasks]);

  const Section = ({ label, items, color }) => (
    <div>
      <div className="mb-2 flex items-center gap-2"><Eyebrow>{label}</Eyebrow><span className="num text-[10px]" style={{ color }}>{items.length}</span></div>
      <div className="flex flex-col gap-1.5">{items.length ? items.map((t) => <TaskRow key={t.id} t={t} />) : <p className="px-1 text-[10.5px] text-faint">Niente qui.</p>}</div>
    </div>
  );

  return (
    <div className="mx-auto flex h-full max-w-[1440px] flex-col gap-4 p-4 lg:p-5">
      {/* header metriche */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[["OGGI", metrics.today, "#26E6FF"], ["IN RITARDO", metrics.overdue, metrics.overdue ? "#FF5E6C" : "#5A6675"], ["FATTI (7GG)", metrics.doneWeek, "#41F5A2"], ["BLOCCATI", metrics.blocked, "#FFC857"]].map(([l, v, c]) => (
          <Card key={l} className="p-3.5"><Eyebrow>{l}</Eyebrow><p className="num mt-1 text-[20px] font-bold" style={{ color: c }}>{v}</p></Card>
        ))}
        <Card className="p-3.5"><Eyebrow>COMPLETAMENTO</Eyebrow><p className="num mt-1 text-[20px] font-bold text-fg">{metrics.pct}%</p><Bar pct={metrics.pct} color="#41F5A2" className="mt-1.5" h={5} /></Card>
      </div>

      <div className="flex items-center justify-between">
        <Tabs tabs={[{ id: "today", label: "Today" }, { id: "board", label: "Board" }, { id: "all", label: "All Tasks", count: tasks.length }]} active={view} onChange={setView} />
        <Btn tone="cyan" onClick={() => setCreating(true)}><Plus size={13} className="mr-1 inline" />Nuovo task</Btn>
      </div>

      {!tasks.length ? (
        <Empty title="Nessun task" hint="Crea il primo task, oppure lascia che l'Operations Agent li generi via API." />
      ) : view === "today" ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Section label="PRIORITÀ ASSOLUTA" items={groups.abs} color="#FF5E6C" />
          <Section label="DA COMPLETARE OGGI" items={groups.today} color="#26E6FF" />
          <Section label="IN ATTESA" items={groups.waiting} color="#8B97A8" />
          <Section label="COMPLETATI" items={groups.done} color="#41F5A2" />
        </div>
      ) : view === "board" ? (
        <div className="grid min-h-0 flex-1 auto-cols-[240px] grid-flow-col gap-3 overflow-x-auto pb-2">
          {BOARD_COLS.map((c) => (
            <div key={c.id} className="flex min-h-0 flex-col rounded-2xl border border-hair2 bg-white/[0.008]">
              <div className="flex items-center justify-between border-b border-hair2 px-3 py-2.5">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: c.color }} /><span className="num text-[10px] font-semibold text-fg">{c.label}</span></span>
                <span className="num text-[11px] text-muted">{board[c.id].length}</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">{board[c.id].map((t) => <TaskRow key={t.id} t={t} />)}</div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="min-h-0 flex-1 overflow-auto p-0">
          <table className="w-full min-w-[720px]">
            <thead className="sticky top-0 bg-card"><tr className="border-b border-hair text-left">{["TASK", "PROGETTO", "RESPONSABILE", "PRIORITÀ", "SCADENZA", "STATO"].map((h) => <th key={h} className="eyebrow px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {tasks.map((t) => { const p = PRIO[t.priority] || PRIO.med; return (
                <tr key={t.id} className="border-b border-hair2">
                  <td className="px-3 py-2.5 text-[12.5px] text-fg">{t.title}</td>
                  <td className="px-3 py-2.5 text-[11.5px] text-muted">{t.project || "—"}</td>
                  <td className="px-3 py-2.5 text-[11.5px] text-muted">{t.assignee || "Saliou"}</td>
                  <td className="px-3 py-2.5"><span className="num text-[11px] font-semibold" style={{ color: p.color }}>{p.label}</span></td>
                  <td className="num px-3 py-2.5 text-[10.5px] text-faint">{t.due ? fmtDate(t.due) : "—"}</td>
                  <td className="px-3 py-2.5"><Pill tone={t.done ? "green" : "cyan"}>{t.done ? "Completato" : BOARD_COLS.find((c) => c.id === boardCol(t))?.label}</Pill></td>
                </tr>
              ); })}
            </tbody>
          </table>
        </Card>
      )}

      <AnimatePresence>{creating && <CreateModal open={creating} onClose={() => setCreating(false)} />}</AnimatePresence>
    </div>
  );
}
