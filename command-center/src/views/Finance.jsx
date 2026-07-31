/* ============================================================
   Finance — centro operativo semplice: lead chiuse (ricavi),
   entrate/uscite manuali, profitto netto. Stile Apple, un accento.
   ============================================================ */
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Plus, X, Wallet } from "lucide-react";
import { useStore, actions } from "../data/store.js";

const eur = (n) =>
  (n < 0 ? "−" : "") + "€" + Math.abs(Math.round(n)).toLocaleString("it-IT");

function Stat({ label, value, tone = "ink", Icon }) {
  const color = tone === "pos" ? "#30D158" : tone === "crit" ? "#FF453A" : "#F5F5F7";
  return (
    <div className="glass p-5">
      <div className="flex items-center gap-2 text-ink2">
        <Icon size={15} strokeWidth={1.6} />
        <span className="text-[12px] font-medium">{label}</span>
      </div>
      <p className="tnum mt-2 text-[26px] font-semibold tracking-tight" style={{ color }}>{value}</p>
    </div>
  );
}

function Row({ left, sub, amount, onDel }) {
  const pos = amount >= 0;
  return (
    <div className="group flex items-center gap-3 border-b border-line px-1 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-ink">{left}</p>
        {sub && <p className="truncate text-[11.5px] text-ink2">{sub}</p>}
      </div>
      <span className="tnum shrink-0 text-[13.5px] font-semibold" style={{ color: pos ? "#30D158" : "#FF453A" }}>
        {pos ? "+" : ""}{eur(amount)}
      </span>
      <button onClick={onDel} className="shrink-0 text-ink2/40 opacity-0 transition group-hover:opacity-100 hover:text-crit">
        <X size={14} />
      </button>
    </div>
  );
}

function AddDeal() {
  const [open, setOpen] = useState(false);
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const save = () => { if (!client.trim() || !amount) return; actions.addDeal({ client, amount }); setClient(""); setAmount(""); setOpen(false); };
  if (!open) return (
    <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-medium text-ink2 transition hover:border-viola/40 hover:text-viola-h">
      <Plus size={12} /> Lead chiusa
    </button>
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input autoFocus value={client} onChange={(e) => setClient(e.target.value)} placeholder="Cliente" className="w-40 rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5 text-[12.5px] text-ink outline-none placeholder:text-ink2/50" />
      <input value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder="€" type="number" className="w-24 rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5 text-[12.5px] text-ink outline-none placeholder:text-ink2/50" />
      <button onClick={save} className="rounded-lg bg-viola px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-viola-h">Aggiungi</button>
      <button onClick={() => setOpen(false)} className="text-ink2 hover:text-ink"><X size={15} /></button>
    </div>
  );
}

function AddTx() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState("expense");
  const save = () => { if (!label.trim() || !amount) return; actions.addTransaction({ label, amount, kind }); setLabel(""); setAmount(""); setOpen(false); };
  if (!open) return (
    <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-medium text-ink2 transition hover:border-viola/40 hover:text-viola-h">
      <Plus size={12} /> Movimento
    </button>
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Descrizione" className="w-44 rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5 text-[12.5px] text-ink outline-none placeholder:text-ink2/50" />
      <input value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder="€" type="number" className="w-24 rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5 text-[12.5px] text-ink outline-none placeholder:text-ink2/50" />
      <div className="flex overflow-hidden rounded-lg border border-line text-[12px]">
        <button onClick={() => setKind("income")} className={`px-2.5 py-1.5 ${kind === "income" ? "bg-pos/15 text-pos" : "text-ink2"}`}>Entrata</button>
        <button onClick={() => setKind("expense")} className={`px-2.5 py-1.5 ${kind === "expense" ? "bg-crit/15 text-crit" : "text-ink2"}`}>Uscita</button>
      </div>
      <button onClick={save} className="rounded-lg bg-viola px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-viola-h">Aggiungi</button>
      <button onClick={() => setOpen(false)} className="text-ink2 hover:text-ink"><X size={15} /></button>
    </div>
  );
}

export default function Finance() {
  const fin = useStore((s) => s.finance);
  const { deals, transactions } = fin;

  const m = useMemo(() => {
    const dealIncome = deals.reduce((a, d) => a + d.amount, 0);
    const txIncome = transactions.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
    const expenses = transactions.filter((t) => t.amount < 0).reduce((a, t) => a + t.amount, 0);
    const income = dealIncome + txIncome;
    return { income, expenses, profit: income + expenses, won: deals.length };
  }, [deals, transactions]);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: "easeOut" }} className="mx-auto max-w-[1040px] px-8 py-9">
      <h1 className="text-[30px] font-semibold tracking-tight text-ink">Finance</h1>
      <p className="mt-1 text-[13.5px] text-ink2">Lead chiuse, entrate e uscite. Il tuo centro operativo, semplice.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Profitto netto" value={eur(m.profit)} tone={m.profit >= 0 ? "pos" : "crit"} Icon={Wallet} />
        <Stat label="Entrate" value={eur(m.income)} tone="pos" Icon={TrendingUp} />
        <Stat label="Uscite" value={eur(m.expenses)} tone="crit" Icon={TrendingDown} />
        <Stat label="Lead chiuse" value={String(m.won)} Icon={Trophy} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass p-5">
          <div className="flex items-center justify-between">
            <p className="section-label">Lead chiuse · ricavi</p>
            <AddDeal />
          </div>
          <div className="mt-2">
            {deals.length ? deals.map((d) => (
              <Row key={d.id} left={d.client} sub={[d.project, d.ts].filter(Boolean).join(" · ")} amount={d.amount} onDel={() => actions.removeDeal(d.id)} />
            )) : <p className="py-6 text-center text-[12.5px] text-ink2">Nessuna lead chiusa ancora.</p>}
          </div>
        </div>

        <div className="glass p-5">
          <div className="flex items-center justify-between">
            <p className="section-label">Movimenti</p>
            <AddTx />
          </div>
          <div className="mt-2">
            {transactions.length ? transactions.map((t) => (
              <Row key={t.id} left={t.label} sub={t.ts} amount={t.amount} onDel={() => actions.removeTransaction(t.id)} />
            )) : <p className="py-6 text-center text-[12.5px] text-ink2">Nessun movimento ancora.</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
