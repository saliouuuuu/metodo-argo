/* ============================================================
   MAREA OS — Sequenza di avvio
   Breve (~2.2s) e saltabile con un click; la versione completa
   (~6s) solo al primissimo avvio.
   ============================================================ */
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FULL_LINES = [
  "Mounting event store",
  "Linking agent bus",
  "Calibrating neural core",
  "Syncing pipeline state",
  "Marea Creative — authenticated",
];

export default function Boot({ onDone }) {
  const firstRun = !localStorage.getItem("marea_boot_seen");
  const [phase, setPhase] = useState(0);
  const [line, setLine] = useState(0);

  const finish = useCallback(() => {
    localStorage.setItem("marea_boot_seen", "1");
    onDone();
  }, [onDone]);

  useEffect(() => {
    const T = [];
    if (firstRun) {
      T.push(setTimeout(() => setPhase(1), 900));
      FULL_LINES.forEach((_, i) => T.push(setTimeout(() => setLine(i + 1), 1200 + i * 420)));
      T.push(setTimeout(() => setPhase(2), 1200 + FULL_LINES.length * 420 + 300));
      T.push(setTimeout(finish, 1200 + FULL_LINES.length * 420 + 1900));
    } else {
      T.push(setTimeout(() => setPhase(2), 700));
      T.push(setTimeout(finish, 2100));
    }
    return () => T.forEach(clearTimeout);
  }, [firstRun, finish]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-black"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      onClick={finish}
      title="Clicca per saltare"
    >
      <motion.div
        className="mb-7 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent"
        initial={{ width: 0 }} animate={{ width: 240 }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      />
      <motion.p
        initial={{ opacity: 0, letterSpacing: "0.2em" }}
        animate={{ opacity: 1, letterSpacing: "0.55em" }}
        transition={{ duration: 1 }}
        className="pl-[0.55em] font-mono text-[13px] font-medium text-zinc-100"
      >
        MAREA SYSTEM
      </motion.p>

      <div className="mt-8 h-16 w-16">
        <motion.svg viewBox="0 0 64 64" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9 }}>
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(34,211,238,.35)" strokeWidth="1" strokeDasharray="2 7" />
          <motion.circle cx="32" cy="32" r="18" fill="none" stroke="rgba(103,232,249,.5)" strokeWidth="1"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.3 }} />
          <circle cx="32" cy="32" r="3.5" fill="#e0f2fe">
            <animate attributeName="opacity" values="1;.4;1" dur="1.6s" repeatCount="indefinite" />
          </circle>
        </motion.svg>
      </div>

      <div className="mt-8 h-24 w-[280px]">
        <AnimatePresence mode="wait">
          {firstRun && phase === 1 && (
            <motion.ul key="lines" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-1.5 font-mono text-[10.5px] text-zinc-500">
              {FULL_LINES.slice(0, line).map((l) => (
                <motion.li key={l} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> {l}
                </motion.li>
              ))}
            </motion.ul>
          )}
          {phase === 2 && (
            <motion.div key="wb" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <p className="font-mono text-[14px] tracking-[0.4em] text-zinc-100">BENTORNATO</p>
              <p className="mt-2 font-mono text-[9.5px] tracking-[0.3em] text-zinc-600">MAREA OS · CORE ONLINE</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="absolute bottom-6 font-mono text-[9px] tracking-[0.25em] text-zinc-700">CLICK PER SALTARE</p>
    </motion.div>
  );
}
