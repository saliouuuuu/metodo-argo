/* ============================================================
   Pagina 1 — Today / Focus
   Data+saluto · Main Focus (UN business) · Priority Tasks (max 5)
   · Routine · Follow-up · Quick Capture Inbox. Niente grafici.
   ============================================================ */
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus, X, ArrowRight, Video, Send, Inbox } from "lucide-react";
import { useStore, actions } from "../data/store.js";

function greeting() {
  const h = new Date().getHours();
  return h < 6 ? "Buonanotte" : h < 13 ? "Buongiorno" : h < 19 ? "Buon pomeriggio" : "Buonasera";
}
const DATE = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

const TASK_DOT = { pending: "border-ink2", in_progress: "border-viola", done: "bg-pos border-pos" };

function MainFocus({ project }) {
  return (
    <div className="glass relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.14), transparent 70%)" }} />
      <p className="section-label">Main Focus · 90%</p>
      <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-ink">{project.name}</h2>
      <p className="mt-1 text-[14px] text-ink2">{project.current_milestone}</p>

      <div className="mt-5 rounded-2xl border border-line bg-white/[0.02] p-4">
        <p className="section-label">Next Action</p>
        <p className="mt-1.5 text-[15px] font-medium text-viola-h">{project.next_action}</p>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[12.5px] text-ink2">
        <span className="h-1.5 w-1.5 rounded-full bg-warn" />
        Blocco: <span className="text-ink">{project.blockers}</span>
      </div>
    </div>
  );
}

function PriorityTasks() {
  const tasks = useStore((s) => s.today_focus.top_3_tasks);
  const [adding, setAdding] = useState("");
  return (
    <div className="glass p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="section-label">Priority Tasks</p>
        <span className="tnum text-[12px] text-ink2">{tasks.filter((t) => t.status === "done").length}/{tasks.length}</span>
      </div>
      <div className="flex flex-col">
        {tasks.map((t) => (
          <div key={t.id} className="group flex items-center gap-3 border-b border-line py-2.5 last:border-0">
            <button onClick={() => actions.cycleTask(t.id)}
              className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${TASK_DOT[t.status]}`}>
              {t.status === "done" && <Check size={12} className="text-bg" strokeWidth={3} />}
              {t.status === "in_progress" && <span className="h-1.5 w-1.5 rounded-full bg-viola" />}
            </button>
            <span className={`flex-1 text-[14px] ${t.status === "done" ? "text-ink2 line-through" : "text-ink"}`}>{t.task}</span>
            <button onClick={() => actions.removeTask(t.id)} className="text-ink2 opacity-0 transition-opacity hover:text-crit group-hover:opacity-100"><X size={14} /></button>
          </div>
        ))}
      </div>
      {tasks.length < 5 && (
        <form onSubmit={(e) => { e.preventDefault(); if (adding.trim()) { actions.addTask(adding.trim()); setAdding(""); } }}
          className="mt-2 flex items-center gap-2.5 pt-1">
          <Plus size={16} className="text-ink2" />
          <input value={adding} onChange={(e) => setAdding(e.target.value)} placeholder="Aggiungi priorità…"
            className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink2/60" />
        </form>
      )}
    </div>
  );
}

function Routines() {
  const r = useStore((s) => s.today_focus.routines);
  const items = [
    { key: "content_engine_video_1", label: "Video 1 pubblicato", Icon: Video },
    { key: "content_engine_video_2", label: "Video 2 pubblicato", Icon: Video },
    { key: "outreach_daily", label: "Outreach / Sales del giorno", Icon: Send },
  ];
  return (
    <div className="glass p-5">
      <p className="section-label mb-3">Routine di oggi</p>
      <div className="flex flex-col gap-1">
        {items.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => actions.toggleRoutine(key)}
            className="flex items-center gap-3 rounded-xl px-1 py-2 text-left transition-colors hover:bg-white/[0.02]">
            <span className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors ${r[key] ? "border-pos bg-pos" : "border-ink2"}`}>
              {r[key] && <Check size={12} className="text-bg" strokeWidth={3} />}
            </span>
            <Icon size={15} strokeWidth={1.6} className="text-ink2" />
            <span className={`text-[14px] ${r[key] ? "text-ink2 line-through" : "text-ink"}`}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Followups() {
  const list = useStore((s) => s.today_focus.crm_quick_followups);
  return (
    <div className="glass p-5">
      <p className="section-label mb-3">Follow-up</p>
      {!list.length ? <p className="text-[13px] text-ink2">Nessun follow-up in sospeso.</p> : (
        <div className="flex flex-col">
          {list.map((f, i) => (
            <div key={i} className="group flex items-center gap-3 border-b border-line py-2.5 last:border-0">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-viola" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] text-ink">{f.contact}</p>
                <p className="truncate text-[12px] text-ink2">{f.action}</p>
              </div>
              <button onClick={() => actions.doneFollowup(i)} className="text-ink2 opacity-0 transition hover:text-pos group-hover:opacity-100"><Check size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickInbox() {
  const list = useStore((s) => s.today_focus.quick_inbox);
  const [v, setV] = useState("");
  return (
    <div className="glass p-5">
      <div className="mb-3 flex items-center gap-2"><Inbox size={14} className="text-ink2" /><p className="section-label">Quick Capture Inbox</p></div>
      <form onSubmit={(e) => { e.preventDefault(); if (v.trim()) { actions.addInbox(v.trim()); setV(""); } }}
        className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.02] px-3 py-2">
        <Plus size={15} className="text-ink2" />
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Scarica un pensiero, lo smisti dopo…"
          className="w-full bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink2/60" />
      </form>
      {list.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {list.map((it) => (
            <div key={it.id} className="group flex items-center gap-2 rounded-lg px-1 py-1">
              <ArrowRight size={12} className="shrink-0 text-ink2" />
              <span className="flex-1 truncate text-[13px] text-ink2">{it.text}</span>
              <button onClick={() => actions.removeInbox(it.id)} className="text-ink2 opacity-0 transition hover:text-crit group-hover:opacity-100"><X size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Today() {
  const active = useStore((s) => s.project_management.metodo_argo);
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: "easeOut" }}
      className="mx-auto max-w-[1040px] px-8 py-9">
      <p className="text-[13px] text-ink2">{DATE.charAt(0).toUpperCase() + DATE.slice(1)}</p>
      <h1 className="mt-1 text-[30px] font-semibold tracking-tight text-ink">{greeting()}, Saliou</h1>

      <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-4">
          <MainFocus project={active} />
          <PriorityTasks />
        </div>
        <div className="flex flex-col gap-4">
          <Routines />
          <Followups />
          <QuickInbox />
        </div>
      </div>
    </motion.div>
  );
}
