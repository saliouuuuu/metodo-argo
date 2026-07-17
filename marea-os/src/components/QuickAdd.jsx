/* ============================================================
   MAREA OS — Quick Add (⌘K)
   Ogni azione che compi in agency si registra da qui in pochi
   secondi: l'evento aggiorna automaticamente tutta la dashboard.
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, useDerived } from "../data/store.js";
import { nextId } from "../data/events.js";

const ACTIONS = [
  { id: "lead.found", label: "Lead trovato", hint: "Nuova attività individuata", fields: ["name", "email", "sector", "location", "issues"] },
  { id: "lead.verified", label: "Lead verificato", hint: "Contatto controllato e completo", fields: ["lead"] },
  { id: "lead.contacted", label: "Attività contattata", hint: "Primo contatto avvenuto", fields: ["lead"] },
  { id: "email.sent", label: "Email inviata", hint: "Outreach o follow-up manuale", fields: ["lead", "subject"] },
  { id: "email.replied", label: "Risposta ricevuta", hint: "Il lead ha risposto", fields: ["lead", "classification"] },
  { id: "call.made", label: "Chiamata effettuata", hint: "Registra esito e note", fields: ["lead", "outcome", "note"] },
  { id: "followup.created", label: "Follow-up da fare", hint: "Pianifica un richiamo", fields: ["lead", "due", "note"] },
  { id: "followup.done", label: "Follow-up completato", hint: "Richiamo eseguito", fields: ["followup"] },
  { id: "meeting.scheduled", label: "Appuntamento fissato", hint: "Call o incontro in agenda", fields: ["lead", "when"] },
  { id: "quote.sent", label: "Preventivo inviato", hint: "Offerta economica al lead", fields: ["lead", "amount"] },
  { id: "client.won", label: "Cliente acquisito", hint: "Trattativa chiusa: vinta", fields: ["lead", "amount"] },
  { id: "client.lost", label: "Cliente perso", hint: "Trattativa chiusa: persa", fields: ["lead", "reason"] },
  { id: "finance.income", label: "Entrata", hint: "Pagamento ricevuto", fields: ["amount", "category", "note"] },
  { id: "finance.expense", label: "Spesa", hint: "Costo sostenuto", fields: ["amount", "category", "note"] },
  { id: "task.created", label: "Nuovo task", hint: "Attività personale/operativa", fields: ["title", "due", "priority"] },
];

const FIELD_DEFS = {
  name: { label: "Nome attività", type: "text", req: true, ph: "Es. Pizzeria La Brace" },
  email: { label: "Email (per l'outreach)", type: "email", ph: "info@attivita.it" },
  sector: { label: "Settore", type: "text", ph: "Ristorazione, Beauty…" },
  location: { label: "Località", type: "text", ph: "Milano" },
  issues: { label: "Problemi individuati", type: "text", ph: "Nessun sito, GMB incompleto…" },
  lead: { label: "Lead", type: "lead" },
  subject: { label: "Oggetto", type: "text", ph: "Oggetto dell'email" },
  classification: { label: "Esito", type: "select", opts: [["interested", "Interessato"], ["later", "Da ricontattare"], ["not_interested", "Non interessato"], ["auto", "Risposta automatica"]] },
  outcome: { label: "Esito chiamata", type: "select", opts: [["answered", "Risposto"], ["no_answer", "Nessuna risposta"], ["callback", "Richiamare"], ["refused", "Rifiutato"]] },
  note: { label: "Nota", type: "text", ph: "Facoltativa" },
  due: { label: "Scadenza", type: "date" },
  when: { label: "Quando", type: "date" },
  amount: { label: "Importo €", type: "number", req: true, ph: "1490" },
  category: { label: "Categoria", type: "text", ph: "Progetto sito, Software…" },
  reason: { label: "Motivo", type: "text", ph: "Budget, ha scelto altri…" },
  title: { label: "Titolo", type: "text", req: true, ph: "Cosa va fatto" },
  priority: { label: "Priorità", type: "select", opts: [["high", "Alta"], ["med", "Media"], ["low", "Bassa"]] },
  followup: { label: "Follow-up", type: "followup" },
};

export default function QuickAdd() {
  const open = useStore((s) => s.paletteOpen);
  const setOpen = useStore((s) => s.openPalette);
  const addEvent = useStore((s) => s.addEvent);
  const derived = useDerived();
  const [q, setQ] = useState("");
  const [action, setAction] = useState(null);
  const [form, setForm] = useState({});
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(!open); }
      if (e.key === "Escape") { setOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) { setQ(""); setAction(null); setForm({}); setSel(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? ACTIONS.filter((a) => (a.label + " " + a.hint).toLowerCase().includes(s)) : ACTIONS;
  }, [q]);

  const openLeads = useMemo(
    () => derived.leads.filter((l) => l.stage !== "won" && l.stage !== "lost").slice(0, 60),
    [derived.leads]
  );

  const submit = async () => {
    const data = {};
    for (const f of action.fields) {
      const def = FIELD_DEFS[f];
      const v = form[f];
      if (def.req && (v == null || v === "")) return;
      if (f === "lead") {
        if (v) { const l = derived.leads.find((x) => x.id === v); data.leadId = v; data.leadName = l?.name; }
        else if (form.leadName) data.leadName = form.leadName;
      } else if (f === "followup") {
        if (!v) return; data.followupId = v;
        const fu = derived.followupsPending.find((x) => x.id === v);
        if (fu) { data.leadId = fu.leadId; data.leadName = fu.leadName; }
      } else if (v != null && v !== "") {
        data[f] = def.type === "number" ? Number(v) : v;
      }
    }
    if (action.id === "email.sent") data.emailId = nextId("mail");
    if (action.id === "task.created") data.taskId = nextId("task");
    if (action.id === "followup.created") data.followupId = nextId("fu");
    await addEvent(action.id, data);
    setOpen(false);
  };

  const onListKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && filtered[sel]) { setAction(filtered[sel]); setForm({}); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-start justify-center bg-black/70 pt-[14vh] backdrop-blur-[2px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <motion.div
            className="w-[540px] max-w-[92vw] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0c] shadow-[0_30px_90px_-20px_rgba(34,211,238,.15)]"
            initial={{ scale: 0.96, y: -8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            {!action ? (
              <>
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
                  <span className="eyebrow">REGISTRA</span>
                  <input
                    ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onListKey}
                    placeholder="Cosa hai fatto? (lead, email, chiamata, entrata…)"
                    className="w-full bg-transparent py-3.5 text-[13.5px] text-zinc-100 placeholder-zinc-600 outline-none"
                  />
                  <kbd className="num rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-zinc-500">ESC</kbd>
                </div>
                <div className="max-h-[46vh] overflow-y-auto p-2">
                  {filtered.map((a, i) => (
                    <button key={a.id}
                      onClick={() => { setAction(a); setForm({}); }}
                      onMouseEnter={() => setSel(i)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left ${i === sel ? "bg-cyan-400/10" : ""}`}>
                      <div>
                        <p className={`text-[13px] font-medium ${i === sel ? "text-cyan-100" : "text-zinc-200"}`}>{a.label}</p>
                        <p className="text-[11px] text-zinc-600">{a.hint}</p>
                      </div>
                      <span className="num text-[9px] tracking-widest text-zinc-700">{a.id}</span>
                    </button>
                  ))}
                  {!filtered.length && <p className="px-3 py-6 text-center text-[12px] text-zinc-600">Nessuna azione trovata.</p>}
                </div>
              </>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                  <div>
                    <p className="text-[13.5px] font-semibold text-zinc-100">{action.label}</p>
                    <p className="text-[10.5px] text-zinc-600">{action.hint}</p>
                  </div>
                  <button type="button" onClick={() => setAction(null)} className="text-[11px] text-zinc-500 hover:text-zinc-300">← indietro</button>
                </div>
                <div className="grid gap-3 p-4">
                  {action.fields.map((f) => {
                    const def = FIELD_DEFS[f];
                    if (def.type === "lead") {
                      return (
                        <label key={f} className="grid gap-1">
                          <span className="eyebrow">{def.label}</span>
                          <select value={form[f] || ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-[13px] text-zinc-100 outline-none focus:border-cyan-400/50">
                            <option value="">— Nuovo / non in lista —</option>
                            {openLeads.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.location || l.sector}</option>)}
                          </select>
                          {!form[f] && (
                            <input placeholder="…oppure scrivi il nome" value={form.leadName || ""}
                              onChange={(e) => setForm({ ...form, leadName: e.target.value })}
                              className="rounded-lg border border-white/10 bg-black px-3 py-2 text-[13px] text-zinc-100 outline-none placeholder-zinc-700 focus:border-cyan-400/50" />
                          )}
                        </label>
                      );
                    }
                    if (def.type === "followup") {
                      return (
                        <label key={f} className="grid gap-1">
                          <span className="eyebrow">{def.label}</span>
                          <select required value={form[f] || ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-[13px] text-zinc-100 outline-none focus:border-cyan-400/50">
                            <option value="">Scegli il follow-up…</option>
                            {derived.followupsPending.map((fu) => (
                              <option key={fu.id} value={fu.id}>{fu.leadName} · entro {new Date(fu.due).toLocaleDateString("it-IT")}</option>
                            ))}
                          </select>
                        </label>
                      );
                    }
                    if (def.type === "select") {
                      return (
                        <label key={f} className="grid gap-1">
                          <span className="eyebrow">{def.label}</span>
                          <select value={form[f] || def.opts[0][0]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-[13px] text-zinc-100 outline-none focus:border-cyan-400/50">
                            {def.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </label>
                      );
                    }
                    return (
                      <label key={f} className="grid gap-1">
                        <span className="eyebrow">{def.label}{def.req && " *"}</span>
                        <input type={def.type} required={def.req} placeholder={def.ph || ""}
                          value={form[f] || ""} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                          step={def.type === "number" ? "0.01" : undefined}
                          className="num rounded-lg border border-white/10 bg-black px-3 py-2 text-[13px] text-zinc-100 outline-none placeholder-zinc-700 focus:border-cyan-400/50" />
                      </label>
                    );
                  })}
                  <button type="submit"
                    className="mt-1 rounded-lg border border-cyan-400/40 bg-cyan-400/15 py-2.5 text-[13px] font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/25">
                    Registra evento ↵
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
