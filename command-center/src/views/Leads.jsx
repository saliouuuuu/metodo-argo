/* ============================================================
   Leads — motore di scraping REALE (Apify Google Maps).
   Cerchi per categoria × città nella zona di Cuneo, l'app filtra
   le attività SENZA sito e con telefono = lead "hot" da chiamare.
   Nessun terminale, nessun n8n: clicchi e arrivano.
   ============================================================ */
import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Phone, Plus, KeyRound, Flame, MapPin, Star, Loader2, X, PhoneCall } from "lucide-react";
import {
  runScrape, getToken, setToken, getCache, setCache,
  DEFAULT_CITIES, DEFAULT_CATEGORIES,
} from "../data/apify.js";
import { actions } from "../data/store.js";

/* ---------- prima configurazione: incolla il token Apify ---------- */
function TokenCard({ onSave }) {
  const [v, setV] = useState("");
  return (
    <div className="glass mx-auto mt-10 max-w-[560px] p-6 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-viola/15"><KeyRound size={20} className="text-viola-h" /></span>
      <h2 className="mt-3 text-[17px] font-semibold text-ink">Collega Apify</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink2">
        Il motore usa Apify per leggere Google Maps. Vai su <b>apify.com → Settings → Integrations</b>,
        copia il tuo <b>API token</b> e incollalo qui. Resta salvato solo sul tuo dispositivo.
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-white/[0.02] px-3 py-2">
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder="apify_api_…" type="password"
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink2/50" />
      </div>
      <button onClick={() => onSave(v)} disabled={!v.trim()}
        className="mt-3 rounded-xl bg-viola px-4 py-2 text-[13.5px] font-semibold text-white transition hover:bg-viola-h disabled:opacity-40">
        Collega
      </button>
    </div>
  );
}

/* ---------- singolo lead ---------- */
function LeadCard({ l }) {
  const [added, setAdded] = useState(false);
  const add = () => {
    actions.addFollowup(l.name, l.phone ? `Chiama ${l.phone}` : l.website ? `Guarda ${l.website}` : "Ricontatta");
    setAdded(true);
  };
  return (
    <div className={`glass p-4 ${l.hot ? "ring-1 ring-viola/25" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-ink">{l.name}</p>
          <p className="truncate text-[12px] text-ink2">{[l.category, l.city].filter(Boolean).join(" · ") || "—"}</p>
        </div>
        {l.hot ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(139,92,246,0.16)", color: "#A78BFA" }}>
            <Flame size={11} /> HOT
          </span>
        ) : (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "rgba(152,152,157,0.12)", color: "#98989D" }}>
            {l.hasSite ? "ha sito" : "no tel"}
          </span>
        )}
      </div>

      {l.phone && (
        <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink transition hover:text-viola-h">
          <PhoneCall size={13} className="text-viola-h" /> {l.phone}
          {l.mobile && <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-ink2">personale</span>}
        </a>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink2">
        {l.address && <span className="inline-flex items-center gap-1"><MapPin size={11} />{l.address}</span>}
        {l.score && <span className="inline-flex items-center gap-1"><Star size={11} />{l.score}</span>}
      </div>

      <button onClick={add} disabled={added}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-medium text-ink2 transition hover:border-viola/40 hover:text-viola-h disabled:opacity-50">
        <Plus size={12} /> {added ? "Aggiunto ai follow-up" : "Aggiungi ai follow-up"}
      </button>
    </div>
  );
}

/* ---------- chip città/categoria toggle ---------- */
function Chip({ on, children, onClick }) {
  return (
    <button onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-[11.5px] transition ${on ? "border-viola/40 bg-viola/12 text-viola-h" : "border-line text-ink2 hover:text-ink"}`}>
      {children}
    </button>
  );
}

export default function Leads() {
  const [token, setTok] = useState(getToken());
  const [leads, setLeads] = useState(getCache());
  const [cities, setCities] = useState(DEFAULT_CITIES.slice(0, 4));
  const [cats, setCats] = useState(["parrucchiere", "estetista", "ristorante"]);
  const [maxPer, setMaxPer] = useState(20);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [onlyHot, setOnlyHot] = useState(true);

  const saveToken = (t) => { setToken(t); setTok(t.trim()); };

  const toggle = (arr, set, val) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const run = useCallback(async () => {
    if (!cats.length || !cities.length) { setErr("Scegli almeno una categoria e una città."); return; }
    setBusy(true); setErr(""); setProgress({ phase: "start" });
    try {
      const { leads } = await runScrape(token, { categories: cats, cities, maxPerSearch: maxPer }, setProgress);
      setLeads(leads);
    } catch (e) {
      setErr(e.message || "Errore durante la ricerca.");
    } finally { setBusy(false); }
  }, [token, cats, cities, maxPer]);

  const filtered = leads.filter((l) =>
    (!onlyHot || l.hot) &&
    (!q || (l.name + l.city + l.category).toLowerCase().includes(q.toLowerCase()))
  );
  const hotCount = leads.filter((l) => l.hot).length;

  if (!token) {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="mx-auto max-w-[1040px] px-8 py-9">
        <h1 className="text-[30px] font-semibold tracking-tight text-ink">Leads</h1>
        <TokenCard onSave={saveToken} />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: "easeOut" }} className="mx-auto max-w-[1040px] px-8 py-9">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight text-ink">Leads</h1>
          <p className="mt-1 text-[13.5px] text-ink2">
            {leads.length ? <>{hotCount} hot da chiamare · {leads.length} trovati in totale</> : "Attività senza sito nella zona di Cuneo, pronte da chiamare."}
          </p>
        </div>
        <button onClick={() => { setTok(""); setToken(""); }} className="text-[11.5px] text-ink2 underline-offset-2 hover:text-ink hover:underline">Cambia token</button>
      </div>

      {/* pannello di ricerca */}
      <div className="glass mt-5 p-5">
        <p className="section-label">Cosa cerchi</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DEFAULT_CATEGORIES.map((c) => <Chip key={c} on={cats.includes(c)} onClick={() => toggle(cats, setCats, c)}>{c}</Chip>)}
        </div>
        <p className="section-label mt-4">Dove</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DEFAULT_CITIES.map((c) => <Chip key={c} on={cities.includes(c)} onClick={() => toggle(cities, setCities, c)}>{c}</Chip>)}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[12px] text-ink2">
            Max per ricerca
            <input type="number" min={5} max={50} value={maxPer} onChange={(e) => setMaxPer(+e.target.value)}
              className="w-16 rounded-lg border border-line bg-white/[0.02] px-2 py-1 text-[12.5px] text-ink outline-none" />
          </label>
          <button onClick={run} disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-viola px-4 py-2 text-[13.5px] font-semibold text-white transition hover:bg-viola-h disabled:opacity-50">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            {busy ? "Cerco…" : "Cerca lead"}
          </button>
          {busy && progress && (
            <span className="text-[12px] text-ink2">
              {progress.phase === "start" && "Avvio del motore…"}
              {progress.phase === "running" && `Scraping in corso… ${progress.found || 0} trovati (${progress.searches} ricerche)`}
              {progress.phase === "done" && "Fatto."}
            </span>
          )}
        </div>
        <p className="mt-3 text-[11px] text-ink2/70">
          Ogni categoria viene cercata in ogni città selezionata. Più combinazioni = più tempo e più crediti Apify.
        </p>
      </div>

      {err && <p className="mt-5 rounded-xl border border-crit/30 bg-crit/5 px-4 py-3 text-[13px] text-crit">{err}</p>}

      {/* filtri risultati */}
      {leads.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.02] px-3">
            <Search size={14} className="text-ink2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtra…" className="w-44 bg-transparent py-2 text-[13px] text-ink outline-none placeholder:text-ink2/50" />
          </div>
          <button onClick={() => setOnlyHot(!onlyHot)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12.5px] transition ${onlyHot ? "border-viola/40 bg-viola/10 text-viola-h" : "border-line text-ink2 hover:text-ink"}`}>
            <Flame size={13} /> Solo hot (senza sito + telefono)
          </button>
        </div>
      )}

      {leads.length === 0 && !busy && !err && (
        <p className="mt-10 text-center text-[13.5px] text-ink2">Scegli categorie e città, poi premi <b className="text-ink">Cerca lead</b>. I risultati appariranno qui.</p>
      )}
      {leads.length > 0 && filtered.length === 0 && (
        <p className="mt-8 text-center text-[13px] text-ink2">Nessun lead con questi filtri. Prova a togliere "Solo hot".</p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((l) => <LeadCard key={l.id} l={l} />)}
      </div>
    </motion.div>
  );
}
