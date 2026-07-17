/* ============================================================
   MAREA OS — Shell: sidebar, header, impostazioni
   ============================================================ */
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, GitBranch, Send, Network, Wallet, CheckSquare,
  Settings, Command, Waves, Copy, Check, Bell, Menu, X,
} from "lucide-react";
import { useStore, useDerived } from "../data/store.js";
import { isElectron } from "../data/bridge.js";
import { useOutreach } from "../data/useOutreach.js";
import { Eyebrow, Btn, Pill } from "./ui/index.jsx";
import { fmtTime } from "../data/events.js";

const NAV_GROUPS = [
  { title: "OPERATIVO", items: [
    { id: "overview", label: "Overview", Icon: LayoutGrid },
    { id: "pipeline", label: "Pipeline", Icon: GitBranch },
    { id: "outreach", label: "Outreach", Icon: Send },
  ]},
  { title: "SISTEMA", items: [
    { id: "agents", label: "Agents", Icon: Network },
    { id: "finance", label: "Finance", Icon: Wallet },
    { id: "tasks", label: "Tasks", Icon: CheckSquare },
  ]},
];
const ALL = NAV_GROUPS.flatMap((g) => g.items);

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span className="num text-[11px] text-muted">{now.toLocaleTimeString("it-IT")}</span>;
}

function Sidebar({ onNavigate }) {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const openPalette = useStore((s) => s.openPalette);
  const openSettings = useStore((s) => s.openSettings);
  const go = (id) => { setView(id); onNavigate?.(); };
  return (
    <div className="flex h-full w-[210px] shrink-0 flex-col bg-bg2 px-3 py-4">
      <div className="mb-7 flex items-center gap-3 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(38,230,255,.3)] bg-[rgba(38,230,255,.08)] shadow-glow">
          <Waves size={17} className="text-cyan" strokeWidth={2} />
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight text-fg">Marea OS</p>
          <p className="num text-[9px] tracking-[0.22em] text-faint">MAREA CREATIVE</p>
        </div>
      </div>

      <nav className="flex flex-col gap-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-2.5 text-[9px] font-semibold tracking-[0.2em] text-faint">{group.title}</p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ id, label, Icon }) => {
                const on = view === id;
                return (
                  <button key={id} onClick={() => go(id)}
                    className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                      on ? "bg-[rgba(38,230,255,.08)] text-fg" : "text-muted hover:bg-white/[0.03] hover:text-fg"}`}>
                    {on && <motion.span layoutId="nav-active" className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-cyan shadow-glow" />}
                    <Icon size={16} strokeWidth={1.9} className={on ? "text-cyan" : "text-faint group-hover:text-muted"} />
                    <span className="text-[13px] font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1.5 pt-4">
        <button onClick={() => openPalette(true)}
          className="flex items-center justify-between rounded-xl border border-hair px-2.5 py-2 text-muted transition-colors hover:border-[rgba(38,230,255,.3)] hover:text-cyan">
          <span className="flex items-center gap-2 text-[12px] font-medium"><Command size={14} /> Registra</span>
          <kbd className="num rounded border border-hair px-1 text-[9px] text-faint">⌘K</kbd>
        </button>
        <button onClick={() => openSettings(true)}
          className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[12px] font-medium text-muted transition-colors hover:bg-white/[0.03] hover:text-fg">
          <Settings size={14} /> Impostazioni
        </button>
      </div>
    </div>
  );
}

function Header({ onMenu }) {
  const view = useStore((s) => s.view);
  const mode = useStore((s) => s.mode);
  const events = useStore((s) => (s.mode === "demo" ? s.demoEvents : s.realEvents));
  const { followupsOverdue, tasks } = useDerived();
  const overdueTasks = tasks.filter((t) => !t.done && t.due && new Date(t.due) < new Date(Date.now() - 86400000)).length;
  const notif = followupsOverdue.length + overdueTasks;
  const lastSync = events.length ? fmtTime(events[events.length - 1].ts) : "—";
  const section = ALL.find((n) => n.id === view)?.label || "";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-hair px-5">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="text-muted hover:text-fg lg:hidden"><Menu size={18} /></button>
        <h1 className="text-[15px] font-semibold text-fg">{section}</h1>
        <span className="hidden items-center gap-1.5 rounded-full border border-[rgba(65,245,162,.25)] bg-[rgba(65,245,162,.06)] px-2.5 py-1 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-green live-dot" />
          <span className="num text-[9.5px] font-medium tracking-wide text-green">CORE ONLINE</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 md:flex">
          <Eyebrow>SYNC</Eyebrow><span className="num text-[11px] text-muted">{lastSync}</span>
        </span>
        {mode === "demo" && <Pill tone="violet" dot>DEMO DATA</Pill>}
        <button className="relative text-muted transition-colors hover:text-fg">
          <Bell size={16} />
          {notif > 0 && <span className="num absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red px-1 text-[8px] font-bold text-white">{notif}</span>}
        </button>
        <Clock />
        <div className="flex items-center gap-2 border-l border-hair pl-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-blue text-[11px] font-bold text-[#04121a]">S</span>
          <div className="hidden leading-tight lg:block">
            <p className="text-[11.5px] font-semibold text-fg">Saliou</p>
            <p className="num text-[8.5px] tracking-wide text-faint">CEO · COMMAND</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function OutreachSettings() {
  const { status, refresh, api } = useOutreach();
  const [f, setF] = useState(null);
  const [verify, setVerify] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (status && !f) setF({ host: status.smtp?.host || "", port: status.smtp?.port || 587, user: status.smtp?.user || "", pass: "", senderName: status.senderName || "Marea Creative", fromEmail: status.fromEmail || "", dailyLimit: status.dailyLimit || 40, mode: status.mode || "approval", enabled: !!status.enabled }); }, [status, f]);
  if (!f) return <p className="mt-2 text-[11px] text-faint">Caricamento…</p>;
  const inp = "num rounded-lg border border-hair bg-bg px-2.5 py-1.5 text-[12px] text-fg outline-none focus:border-[rgba(38,230,255,.5)] w-full";
  const save = async () => {
    const patch = { senderName: f.senderName, fromEmail: f.fromEmail, dailyLimit: Number(f.dailyLimit) || 40, mode: f.mode, enabled: f.enabled, smtp: { host: f.host, port: Number(f.port) || 587, user: f.user } };
    if (f.pass) patch.smtp.pass = f.pass;
    await api.setConfig(patch); setSaved(true); setTimeout(() => setSaved(false), 1500); refresh();
  };
  const doVerify = async () => { setVerify("..."); await save(); const r = await api.verify(); setVerify(r.ok ? "ok" : r.error || "errore"); };
  return (
    <div className="grid gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <label className="grid gap-1"><Eyebrow>SMTP HOST</Eyebrow><input className={inp} placeholder="smtp.gmail.com" value={f.host} onChange={(e) => setF({ ...f, host: e.target.value })} /></label>
        <label className="grid gap-1"><Eyebrow>PORTA</Eyebrow><input className={inp} value={f.port} onChange={(e) => setF({ ...f, port: e.target.value })} /></label>
        <label className="grid gap-1"><Eyebrow>UTENTE</Eyebrow><input className={inp} placeholder="tu@gmail.com" value={f.user} onChange={(e) => setF({ ...f, user: e.target.value })} /></label>
        <label className="grid gap-1"><Eyebrow>PASSWORD / APP PASSWORD</Eyebrow><input type="password" className={inp} placeholder={status?.smtp?.pass ? "••••••" : "app password"} value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} /></label>
        <label className="grid gap-1"><Eyebrow>NOME MITTENTE</Eyebrow><input className={inp} value={f.senderName} onChange={(e) => setF({ ...f, senderName: e.target.value })} /></label>
        <label className="grid gap-1"><Eyebrow>EMAIL MITTENTE</Eyebrow><input className={inp} placeholder="tu@tuodominio.it" value={f.fromEmail} onChange={(e) => setF({ ...f, fromEmail: e.target.value })} /></label>
        <label className="grid gap-1"><Eyebrow>LIMITE GIORNALIERO</Eyebrow><input className={inp} value={f.dailyLimit} onChange={(e) => setF({ ...f, dailyLimit: e.target.value })} /></label>
        <label className="grid gap-1"><Eyebrow>MODALITÀ</Eyebrow><select className={inp} value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}><option value="manual">Manuale</option><option value="approval">Approvazione</option><option value="auto">Automatica</option></select></label>
      </div>
      <label className="flex items-center gap-2 text-[12px] text-muted">
        <input type="checkbox" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} className="accent-[#26E6FF]" />
        Motore attivo (invia/pianifica secondo la modalità)
      </label>
      <div className="flex items-center gap-2">
        <Btn tone="cyan" onClick={save}>{saved ? "Salvato ✓" : "Salva"}</Btn>
        <Btn onClick={doVerify}>Verifica connessione</Btn>
        {verify === "ok" && <span className="text-[11px] text-green">Connesso ✓</span>}
        {verify && verify !== "ok" && verify !== "..." && <span className="text-[11px] text-red">{verify}</span>}
        {verify === "..." && <span className="text-[11px] text-muted">verifica…</span>}
      </div>
      <p className="text-[10px] leading-relaxed text-faint">
        Gmail: crea una “App password” (con verifica in 2 passaggi) e usala qui. Oppure usa un provider SMTP (Brevo, Resend, Mailgun…).
        Rispetta GDPR e norme anti-spam: contatta solo attività pertinenti e onora le richieste di STOP.
      </p>
    </div>
  );
}

function SettingsModal() {
  const open = useStore((s) => s.settingsOpen);
  const setOpen = useStore((s) => s.openSettings);
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const settings = useStore((s) => s.settings);
  const setSetting = useStore((s) => s.setSetting);
  const api = useStore((s) => s.api);
  const [copied, setCopied] = useState("");
  const copy = async (what, text) => { try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(""), 1500); } catch {} };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <motion.div className="card w-[540px] max-w-full p-5"
            initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[15px] font-semibold text-fg">Impostazioni</p>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-fg"><X size={16} /></button>
            </div>
            <div className="grid gap-3.5">
              <div className="card-2 p-3.5">
                <Eyebrow>SORGENTE DATI</Eyebrow>
                <div className="mt-2 flex gap-2">
                  <Btn tone={mode === "real" ? "cyan" : "ghost"} onClick={() => setMode("real")}>Reali (persistiti)</Btn>
                  <Btn tone={mode === "demo" ? "cyan" : "ghost"} onClick={() => setMode("demo")}>Demo (volatili)</Btn>
                </div>
                <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
                  I dati demo sono generati e mai salvati. I reali si registrano con ⌘K o via API e restano sul tuo computer.
                </p>
              </div>
              <div className="card-2 p-3.5">
                <Eyebrow>API AGENTI (LOCALE)</Eyebrow>
                {isElectron && api ? (
                  <div className="mt-2 grid gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <code className="num truncate rounded bg-white/[0.04] px-2 py-1 text-[11px] text-cyan">POST http://127.0.0.1:{api.port}/v1/events</code>
                      <Btn onClick={() => copy("url", `http://127.0.0.1:${api.port}/v1/events`)}>{copied === "url" ? <Check size={13} /> : <Copy size={13} />}</Btn>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <code className="num truncate rounded bg-white/[0.04] px-2 py-1 text-[11px] text-muted">Bearer {api.token?.slice(0, 18)}…</code>
                      <Btn onClick={() => copy("tok", api.token)}>{copied === "tok" ? <Check size={13} /> : <Copy size={13} />}</Btn>
                    </div>
                  </div>
                ) : <p className="mt-2 text-[11px] text-faint">Disponibile nell'app desktop (Electron).</p>}
              </div>
              {isElectron && (
                <div className="card-2 p-3.5">
                  <Eyebrow>OUTREACH · EMAIL (SMTP)</Eyebrow>
                  <div className="mt-2"><OutreachSettings /></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="card-2 p-3.5">
                  <Eyebrow>AUDIO</Eyebrow>
                  <div className="mt-2"><Btn tone={settings.sound ? "cyan" : "ghost"} onClick={() => setSetting("sound", !settings.sound)}>{settings.sound ? "Suoni attivi" : "Silenzioso"}</Btn></div>
                </div>
                <div className="card-2 p-3.5">
                  <Eyebrow>OBIETTIVO MENSILE €</Eyebrow>
                  <input type="number" value={settings.revenueGoal} onChange={(e) => setSetting("revenueGoal", Number(e.target.value) || 0)}
                    className="num mt-2 w-full rounded-lg border border-hair bg-bg px-3 py-1.5 text-[13px] text-fg outline-none focus:border-[rgba(38,230,255,.5)]" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Shell({ children }) {
  const [drawer, setDrawer] = useState(false);
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-fg">
      <aside className="hidden shrink-0 border-r border-hair lg:block"><Sidebar /></aside>

      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-30 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
            <motion.aside className="absolute left-0 top-0 h-full border-r border-hair"
              initial={{ x: -220 }} animate={{ x: 0 }} exit={{ x: -220 }} transition={{ type: "spring", stiffness: 380, damping: 34 }}>
              <Sidebar onNavigate={() => setDrawer(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setDrawer(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
      <SettingsModal />
    </div>
  );
}
