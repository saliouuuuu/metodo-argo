/* ============================================================
   Leads — i lead trovati dal motore Apify (via n8n → Google Sheet).
   Legge il foglio pubblicato come CSV. Nessun terminale.
   ============================================================ */
import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Settings2, Globe, Phone, Mail, Plus, Search, Link2 } from "lucide-react";
import { fetchLeads, getSheetUrl, setSheetUrl } from "../data/leads.js";
import { actions } from "../data/store.js";

function ConfigCard({ url, onSave }) {
  const [v, setV] = useState(url);
  return (
    <div className="glass mx-auto mt-10 max-w-[560px] p-6 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-viola/15"><Link2 size={20} className="text-viola-h" /></span>
      <h2 className="mt-3 text-[17px] font-semibold text-ink">Collega il foglio dei lead</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink2">
        In n8n il motore Apify salva i lead in un Google Sheet. Pubblica il foglio
        (File → Condividi → <b>Pubblica sul web</b> → CSV) e incolla qui il link.
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-white/[0.02] px-3 py-2">
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="https://docs.google.com/…/pub?output=csv"
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink2/50" />
      </div>
      <button onClick={() => onSave(v)} disabled={!v.trim()}
        className="mt-3 rounded-xl bg-viola px-4 py-2 text-[13.5px] font-semibold text-white transition hover:bg-viola-h disabled:opacity-40">
        Collega
      </button>
    </div>
  );
}

function LeadCard({ l }) {
  const [added, setAdded] = useState(false);
  const add = () => { actions.addFollowup(l.name, l.email ? `Scrivi a ${l.email}` : l.phone ? `Chiama ${l.phone}` : "Ricontatta"); setAdded(true); };
  return (
    <div className="glass p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-ink">{l.name}</p>
          <p className="truncate text-[12px] text-ink2">{[l.category, l.city].filter(Boolean).join(" · ") || "—"}</p>
        </div>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={l.hasSite ? { background: "rgba(152,152,157,0.12)", color: "#98989D" } : { background: "rgba(48,209,88,0.12)", color: "#30D158" }}>
          {l.hasSite ? "ha sito" : "senza sito"}
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink2">
        {l.website && <span className="inline-flex items-center gap-1"><Globe size={12} />{l.website.replace(/^https?:\/\//, "").slice(0, 24)}</span>}
        {l.phone && <span className="inline-flex items-center gap-1"><Phone size={12} />{l.phone}</span>}
        {l.email && <span className="inline-flex items-center gap-1"><Mail size={12} />{l.email}</span>}
      </div>
      <button onClick={add} disabled={added}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-medium text-ink2 transition hover:border-viola/40 hover:text-viola-h disabled:opacity-50">
        <Plus size={12} /> {added ? "Aggiunto ai follow-up" : "Aggiungi ai follow-up"}
      </button>
    </div>
  );
}

export default function Leads() {
  const [url, setUrl] = useState(getSheetUrl());
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [onlyNoSite, setOnlyNoSite] = useState(false);
  const [showCfg, setShowCfg] = useState(false);

  const load = useCallback(async (u) => {
    if (!u) return;
    setLoading(true); setErr("");
    try { const r = await fetchLeads(u); setLeads(r.leads); }
    catch (e) { setErr("Non riesco a leggere il foglio. Assicurati che sia pubblicato come CSV. (" + e.message + ")"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (url) load(url); }, [url, load]);

  const save = (u) => { setSheetUrl(u); setUrl(u.trim()); setShowCfg(false); };

  const filtered = leads.filter((l) =>
    (!onlyNoSite || !l.hasSite) &&
    (!q || (l.name + l.city + l.category).toLowerCase().includes(q.toLowerCase()))
  );

  if (!url || showCfg) {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="mx-auto max-w-[1040px] px-8 py-9">
        <h1 className="text-[30px] font-semibold tracking-tight text-ink">Leads</h1>
        <ConfigCard url={url} onSave={save} />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: "easeOut" }} className="mx-auto max-w-[1040px] px-8 py-9">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight text-ink">Leads</h1>
          <p className="mt-1 text-[13.5px] text-ink2">Trovati dal motore Apify · {leads.length} in totale</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(url)} className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-[12.5px] text-ink2 transition hover:text-ink">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Aggiorna
          </button>
          <button onClick={() => setShowCfg(true)} className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-[12.5px] text-ink2 transition hover:text-ink">
            <Settings2 size={14} /> Foglio
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.02] px-3">
          <Search size={14} className="text-ink2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca…" className="w-44 bg-transparent py-2 text-[13px] text-ink outline-none placeholder:text-ink2/50" />
        </div>
        <button onClick={() => setOnlyNoSite(!onlyNoSite)}
          className={`rounded-xl border px-3 py-2 text-[12.5px] transition ${onlyNoSite ? "border-viola/40 bg-viola/10 text-viola-h" : "border-line text-ink2 hover:text-ink"}`}>
          Solo senza sito
        </button>
      </div>

      {err && <p className="mt-5 rounded-xl border border-crit/30 bg-crit/5 px-4 py-3 text-[13px] text-crit">{err}</p>}

      {!err && !filtered.length && !loading && (
        <p className="mt-10 text-center text-[13.5px] text-ink2">Nessun lead ancora. Fai girare il workflow Apify in n8n: appariranno qui.</p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((l) => <LeadCard key={l.id} l={l} />)}
      </div>
    </motion.div>
  );
}
