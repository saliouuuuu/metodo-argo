/* ============================================================
   Leads — banco chiamate. Scraper Apify reale + lavorazione:
   ogni lead ha uno stato (Da chiamare → Richiama → Interessato →
   Chiuso/Scartato), note e chiusura che finisce in Finance.
   ============================================================ */
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search, Phone, PhoneCall, Plus, KeyRound, Flame, MapPin, Star, Loader2,
  ChevronDown, RotateCcw, Check, X, StickyNote, PartyPopper, PhoneOff, Clock,
} from "lucide-react";
import {
  runScrape, getToken, setToken, getCache,
  DEFAULT_CITIES, DEFAULT_CATEGORIES,
} from "../data/apify.js";
import { useStore, actions } from "../data/store.js";

const STATUS = {
  nuovo:       { label: "Da chiamare", dot: "#8B5CF6" },
  richiama:    { label: "Richiama",    dot: "#FF9F0A" },
  interessato: { label: "Interessato", dot: "#30D158" },
  chiuso:      { label: "Chiuso",      dot: "#30D158" },
  scartato:    { label: "Scartato",    dot: "#8E8E93" },
};
const leadKey = (l) => (l.phone ? l.phone.replace(/\s/g, "") : `${l.name}|${l.city}`);
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- pannello ricerca (collassabile) ---------- */
function SearchPanel({ open, setOpen, token, saveToken, cats, setCats, cities, setCities, maxPer, setMaxPer, busy, progress, run }) {
  const toggle = (arr, set, val) => set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  const [tok, setTok] = useState("");
  return (
    <div className="glass mt-5 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-5 py-3.5 text-left">
        <span className="section-label">Cerca nuovi lead</span>
        <ChevronDown size={16} className={`text-ink2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-line px-5 pb-5 pt-4">
          {!token && (
            <div className="mb-4 rounded-xl border border-viola/25 bg-viola/[0.06] p-3.5">
              <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink"><KeyRound size={13} className="text-viola-h" /> Per cercare nuovi lead serve il token Apify</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink2">apify.com → Settings → Integrations → copia l'API token. Resta salvato solo su questo dispositivo. (I 475 lead qui sotto ci sono già senza token.)</p>
              <div className="mt-2.5 flex items-center gap-2">
                <input value={tok} onChange={(e) => setTok(e.target.value)} placeholder="apify_api_…" type="password"
                  className="w-full rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5 text-[12.5px] text-ink outline-none placeholder:text-ink2/50" />
                <button onClick={() => tok.trim() && saveToken(tok)} disabled={!tok.trim()}
                  className="shrink-0 rounded-lg bg-viola px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-viola-h disabled:opacity-40">Collega</button>
              </div>
            </div>
          )}
          <p className="section-label">Cosa cerchi</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DEFAULT_CATEGORIES.map((c) => (
              <button key={c} onClick={() => toggle(cats, setCats, c)}
                className={`rounded-full border px-2.5 py-1 text-[11.5px] transition ${cats.includes(c) ? "border-viola/40 bg-viola/12 text-viola-h" : "border-line text-ink2 hover:text-ink"}`}>{c}</button>
            ))}
          </div>
          <p className="section-label mt-4">Dove</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DEFAULT_CITIES.map((c) => (
              <button key={c} onClick={() => toggle(cities, setCities, c)}
                className={`rounded-full border px-2.5 py-1 text-[11.5px] transition ${cities.includes(c) ? "border-viola/40 bg-viola/12 text-viola-h" : "border-line text-ink2 hover:text-ink"}`}>{c}</button>
            ))}
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
                {progress.phase === "running" && `Scraping… ${progress.found || 0} trovati (${progress.searches} ricerche)`}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- singolo lead ---------- */
function LeadCard({ l, st }) {
  const key = leadKey(l);
  const status = st?.status || "nuovo";
  const meta = STATUS[status];
  const [closing, setClosing] = useState(false);
  const [amount, setAmount] = useState("97");
  const [noteOpen, setNoteOpen] = useState(!!st?.note);
  const [note, setNote] = useState(st?.note || "");
  const done = status === "chiuso" || status === "scartato";

  const set = (s) => actions.setLeadStatus(key, s);
  const interessato = () => { set("interessato"); if (l.phone) actions.addFollowup(l.name, `Ricontatta ${l.phone}`); };
  const confirmClose = () => { actions.closeLead(key, { client: l.name, amount }); setClosing(false); };

  return (
    <div className="glass p-4" style={{ borderLeft: `3px solid ${meta.dot}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-ink">{l.name}</p>
          <p className="truncate text-[12px] text-ink2">{[l.category, l.city].filter(Boolean).join(" · ") || "—"}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: `${meta.dot}22`, color: meta.dot }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} /> {meta.label}
        </span>
      </div>

      {l.phone && (
        <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="mt-2.5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink transition hover:text-viola-h">
          <PhoneCall size={13} className="text-viola-h" /> {l.phone}
          {l.mobile && <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-ink2">personale</span>}
        </a>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink2">
        {l.address && <span className="inline-flex items-center gap-1"><MapPin size={11} />{l.address}</span>}
        {l.score && <span className="inline-flex items-center gap-1"><Star size={11} />{l.score}</span>}
      </div>

      {noteOpen && (
        <textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => actions.setLeadNote(key, note)}
          placeholder="Note: esito chiamata, quando richiamare…" rows={2}
          className="mt-2.5 w-full resize-none rounded-lg border border-line bg-white/[0.02] px-2.5 py-2 text-[12px] text-ink outline-none placeholder:text-ink2/40" />
      )}

      {/* azioni */}
      {closing ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[12px] text-ink2">Importo €</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" autoFocus
            className="w-24 rounded-lg border border-line bg-white/[0.02] px-2 py-1.5 text-[12.5px] text-ink outline-none" />
          <button onClick={confirmClose} className="inline-flex items-center gap-1 rounded-lg bg-pos/20 px-2.5 py-1.5 text-[12px] font-semibold text-pos hover:bg-pos/30"><Check size={13} /> Conferma</button>
          <button onClick={() => setClosing(false)} className="text-ink2 hover:text-ink"><X size={15} /></button>
        </div>
      ) : done ? (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11.5px] text-ink2">{status === "chiuso" ? "🎉 Cliente — in Finance" : "Scartato"}</span>
          <button onClick={() => set("nuovo")} className="inline-flex items-center gap-1 text-[11.5px] text-ink2 hover:text-ink"><RotateCcw size={12} /> Riporta</button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <ActBtn onClick={() => set("richiama")} tone="warn" Icon={Clock}>Richiama</ActBtn>
          <ActBtn onClick={interessato} tone="pos" Icon={Flame}>Interessato</ActBtn>
          <ActBtn onClick={() => setClosing(true)} tone="viola" Icon={PartyPopper}>Chiusa</ActBtn>
          <ActBtn onClick={() => set("scartato")} tone="mute" Icon={PhoneOff}>Scarta</ActBtn>
          <button onClick={() => setNoteOpen(!noteOpen)} title="Note"
            className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line text-ink2 transition hover:text-ink"><StickyNote size={13} /></button>
        </div>
      )}
    </div>
  );
}

function ActBtn({ onClick, tone, Icon, children }) {
  const c = { warn: "#FF9F0A", pos: "#30D158", viola: "#A78BFA", mute: "#8E8E93" }[tone];
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-[11.5px] font-medium text-ink2 transition hover:text-ink"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = c + "66")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>
      <Icon size={12} style={{ color: c }} /> {children}
    </button>
  );
}

/* ---------- filtro/stat ---------- */
function Tab({ on, dot, children, onClick }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition ${on ? "border-viola/40 bg-viola/10 text-ink" : "border-line text-ink2 hover:text-ink"}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />} {children}
    </button>
  );
}

export default function Leads() {
  const [token, setTok] = useState(getToken());
  const statusMap = useStore((s) => s.leads_status);
  const [leads, setLeads] = useState(getCache());
  const [panelOpen, setPanelOpen] = useState(false);
  const [cities, setCities] = useState(DEFAULT_CITIES.slice(0, 4));
  const [cats, setCats] = useState(["parrucchiere", "estetista", "ristorante"]);
  const [maxPer, setMaxPer] = useState(20);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("da_chiamare");
  const [cat, setCat] = useState("");

  useEffect(() => { if (!leads.length) setPanelOpen(true); }, []); // eslint-disable-line

  const saveToken = (t) => { setToken(t); setTok(t.trim()); };
  const run = useCallback(async () => {
    if (!token) { setPanelOpen(true); setErr("Incolla prima il token Apify qui sopra per cercare nuovi lead."); return; }
    if (!cats.length || !cities.length) { setErr("Scegli almeno una categoria e una città."); return; }
    setBusy(true); setErr(""); setProgress({ phase: "start" });
    try {
      const { leads } = await runScrape(token, { categories: cats, cities, maxPerSearch: maxPer }, setProgress);
      setLeads(leads); setPanelOpen(false);
    } catch (e) { setErr(e.message || "Errore durante la ricerca."); }
    finally { setBusy(false); }
  }, [token, cats, cities, maxPer]);

  const stOf = (l) => statusMap[leadKey(l)]?.status || "nuovo";
  const counts = useMemo(() => {
    const c = { da_chiamare: 0, interessato: 0, chiuso: 0, scartato: 0 };
    leads.forEach((l) => {
      const s = stOf(l);
      if (s === "nuovo" || s === "richiama") c.da_chiamare++;
      else if (c[s] != null) c[s]++;
    });
    return c;
  }, [leads, statusMap]);
  const workedToday = useMemo(() =>
    Object.values(statusMap).filter((v) => v.ts?.slice(0, 10) === today() && v.status && v.status !== "nuovo").length,
    [statusMap]);
  const categories = useMemo(() => [...new Set(leads.map((l) => l.category).filter(Boolean))].sort(), [leads]);

  const filtered = leads.filter((l) => {
    const s = stOf(l);
    const inTab =
      tab === "tutti" ? true :
      tab === "da_chiamare" ? (s === "nuovo" || s === "richiama") :
      s === tab;
    return inTab &&
      (!cat || l.category === cat) &&
      (!q || (l.name + l.city + l.category).toLowerCase().includes(q.toLowerCase()));
  });

  const total = leads.length;
  const worked = counts.interessato + counts.chiuso + counts.scartato + leads.filter((l) => stOf(l) === "richiama").length;
  const pct = total ? Math.round((worked / total) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: "easeOut" }} className="mx-auto max-w-[1040px] px-8 py-9">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold tracking-tight text-ink">Banco chiamate</h1>
          <p className="mt-1 text-[13.5px] text-ink2">
            {total ? <>{counts.da_chiamare} da chiamare · {workedToday} lavorati oggi</> : "Attività senza sito nella zona di Cuneo, pronte da chiamare."}
          </p>
        </div>
        {token && <button onClick={() => { setTok(""); setToken(""); }} className="text-[11.5px] text-ink2 underline-offset-2 hover:text-ink hover:underline">Cambia token</button>}
      </div>

      {/* progresso */}
      {total > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11.5px] text-ink2">
            <span>Avanzamento lista</span><span className="tnum">{worked}/{total} · {pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-viola transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <SearchPanel {...{ open: panelOpen, setOpen: setPanelOpen, token, saveToken, cats, setCats, cities, setCities, maxPer, setMaxPer, busy, progress, run }} />

      {err && <p className="mt-5 rounded-xl border border-crit/30 bg-crit/5 px-4 py-3 text-[13px] text-crit">{err}</p>}

      {total > 0 && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Tab on={tab === "da_chiamare"} dot="#8B5CF6" onClick={() => setTab("da_chiamare")}>Da chiamare · {counts.da_chiamare}</Tab>
            <Tab on={tab === "interessato"} dot="#30D158" onClick={() => setTab("interessato")}>Interessati · {counts.interessato}</Tab>
            <Tab on={tab === "chiuso"} dot="#30D158" onClick={() => setTab("chiuso")}>Chiusi · {counts.chiuso}</Tab>
            <Tab on={tab === "scartato"} dot="#8E8E93" onClick={() => setTab("scartato")}>Scartati · {counts.scartato}</Tab>
            <Tab on={tab === "tutti"} onClick={() => setTab("tutti")}>Tutti · {total}</Tab>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.02] px-3">
              <Search size={14} className="text-ink2" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtra per nome…" className="w-48 bg-transparent py-2 text-[13px] text-ink outline-none placeholder:text-ink2/50" />
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value)}
              className="rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] text-ink2 outline-none">
              <option value="">Tutte le categorie</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </>
      )}

      {total === 0 && !busy && !err && (
        <p className="mt-10 text-center text-[13.5px] text-ink2">Apri <b className="text-ink">Cerca nuovi lead</b>, scegli categorie e città, poi premi Cerca.</p>
      )}
      {total > 0 && filtered.length === 0 && (
        <p className="mt-8 text-center text-[13px] text-ink2">Nessun lead in questa sezione.</p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((l) => <LeadCard key={leadKey(l)} l={l} st={statusMap[leadKey(l)]} />)}
      </div>
    </motion.div>
  );
}
