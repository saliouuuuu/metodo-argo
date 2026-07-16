/* ============================================================
   MAREA OS — Shell: sidebar, topbar, impostazioni
   ============================================================ */
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, GitBranch, Send, Bot, Wallet, CheckSquare,
  Settings, Command, Waves, Copy, Check,
} from "lucide-react";
import { useStore } from "../data/store.js";
import { isElectron } from "../data/bridge.js";
import { SysLabel, Btn } from "./ui.jsx";

const NAV = [
  { id: "overview", label: "OVERVIEW", Icon: LayoutGrid },
  { id: "pipeline", label: "PIPELINE", Icon: GitBranch },
  { id: "outreach", label: "OUTREACH", Icon: Send },
  { id: "agents", label: "AGENTS", Icon: Bot },
  { id: "finance", label: "FINANCE", Icon: Wallet },
  { id: "tasks", label: "TASKS", Icon: CheckSquare },
];

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span className="num text-[11px] text-zinc-500">{now.toLocaleTimeString("it-IT")}</span>;
}

function ModeBadge() {
  const mode = useStore((s) => s.mode);
  const demo = mode === "demo";
  return (
    <span className={`num rounded-md px-2 py-1 text-[9.5px] font-bold tracking-[0.18em] ${
      demo ? "border border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300"
           : "border border-emerald-400/40 bg-emerald-400/10 text-emerald-300"}`}>
      {demo ? "DEMO DATA" : "REAL DATA"}
    </span>
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

  const copy = async (what, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(""), 1500); } catch {}
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-[2px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <motion.div className="w-[520px] max-w-[92vw] rounded-2xl border border-white/10 bg-[#0a0a0c] p-5"
            initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.97, opacity: 0 }}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[14px] font-semibold text-zinc-100">Impostazioni</p>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-200">✕</button>
            </div>

            <div className="grid gap-4">
              <div className="rounded-xl border border-white/[0.06] p-3.5">
                <SysLabel>SORGENTE DATI</SysLabel>
                <div className="mt-2 flex gap-2">
                  <Btn tone={mode === "real" ? "cyan" : "ghost"} onClick={() => setMode("real")}>Dati reali (persistiti)</Btn>
                  <Btn tone={mode === "demo" ? "cyan" : "ghost"} onClick={() => setMode("demo")}>Demo (volatili)</Btn>
                </div>
                <p className="mt-2 text-[10.5px] leading-relaxed text-zinc-600">
                  I dati demo sono generati e non vengono mai salvati. I dati reali si registrano con ⌘K,
                  dagli agenti via API, e restano sul tuo computer.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] p-3.5">
                <SysLabel>API AGENTI (LOCALE)</SysLabel>
                {isElectron && api ? (
                  <div className="mt-2 grid gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <code className="num truncate rounded bg-white/[0.04] px-2 py-1 text-[11px] text-cyan-200">
                        POST http://127.0.0.1:{api.port}/v1/events
                      </code>
                      <Btn onClick={() => copy("url", `http://127.0.0.1:${api.port}/v1/events`)}>
                        {copied === "url" ? <Check size={13} /> : <Copy size={13} />}
                      </Btn>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <code className="num truncate rounded bg-white/[0.04] px-2 py-1 text-[11px] text-zinc-400">
                        Bearer {api.token?.slice(0, 18)}…
                      </code>
                      <Btn onClick={() => copy("tok", api.token)}>
                        {copied === "tok" ? <Check size={13} /> : <Copy size={13} />}
                      </Btn>
                    </div>
                    <p className="text-[10.5px] leading-relaxed text-zinc-600">
                      Gli agenti (n8n, Make, script) spingono eventi qui: {"{"} type, data, agent {"}"}.
                      Ogni evento aggiorna Marea OS in tempo reale.
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-zinc-600">Disponibile nell'app desktop (Electron).</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/[0.06] p-3.5">
                  <SysLabel>AUDIO</SysLabel>
                  <div className="mt-2">
                    <Btn tone={settings.sound ? "cyan" : "ghost"} onClick={() => setSetting("sound", !settings.sound)}>
                      {settings.sound ? "Suoni attivi" : "Silenzioso"}
                    </Btn>
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.06] p-3.5">
                  <SysLabel>OBIETTIVO MENSILE €</SysLabel>
                  <input type="number" value={settings.revenueGoal}
                    onChange={(e) => setSetting("revenueGoal", Number(e.target.value) || 0)}
                    className="num mt-2 w-full rounded-lg border border-white/10 bg-black px-3 py-1.5 text-[13px] text-zinc-100 outline-none focus:border-cyan-400/50" />
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
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const openPalette = useStore((s) => s.openPalette);
  const openSettings = useStore((s) => s.openSettings);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-zinc-200">
      {/* sidebar */}
      <aside className="flex w-[196px] shrink-0 flex-col border-r border-white/[0.06] px-3 py-4">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/[0.07]">
            <Waves size={15} className="text-cyan-300" strokeWidth={1.75} />
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold tracking-wide text-zinc-100">MAREA OS</p>
            <p className="num text-[8.5px] tracking-[0.25em] text-zinc-600">MAREA CREATIVE</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setView(id)}
              className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                view === id ? "bg-cyan-400/[0.08] text-cyan-100" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"}`}>
              <Icon size={14} strokeWidth={1.75} className={view === id ? "text-cyan-300" : "text-zinc-600 group-hover:text-zinc-400"} />
              <span className="num text-[10.5px] font-medium tracking-[0.14em]">{label}</span>
              {view === id && <span className="ml-auto h-1 w-1 rounded-full bg-cyan-300 dot-live" />}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 px-1">
          <button onClick={() => openPalette(true)}
            className="flex items-center justify-between rounded-lg border border-white/[0.08] px-2.5 py-2 text-zinc-400 transition-colors hover:border-cyan-400/30 hover:text-cyan-200">
            <span className="flex items-center gap-2 text-[11.5px]"><Command size={13} /> Registra</span>
            <kbd className="num text-[9px] text-zinc-600">⌘K</kbd>
          </button>
          <button onClick={() => openSettings(true)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11.5px] text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300">
            <Settings size={13} /> Impostazioni
          </button>
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
          <div className="flex items-center gap-3">
            <SysLabel>{NAV.find((n) => n.id === view)?.label}</SysLabel>
            <span className="flex items-center gap-1.5 text-[10px] text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 dot-live" /> CORE ONLINE
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ModeBadge />
            <Clock />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      <SettingsModal />
    </div>
  );
}
