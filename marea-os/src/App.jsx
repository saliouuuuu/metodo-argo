/* ============================================================
   MAREA OS — Root
   ============================================================ */
import React, { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useStore } from "./data/store.js";
import Boot from "./components/Boot.jsx";
import Shell from "./components/Shell.jsx";
import QuickAdd from "./components/QuickAdd.jsx";
import Overview from "./views/Overview.jsx";
import Pipeline from "./views/Pipeline.jsx";
import Outreach from "./views/Outreach.jsx";
import Agents from "./views/Agents.jsx";
import Finance from "./views/Finance.jsx";
import Tasks from "./views/Tasks.jsx";

const VIEWS = { overview: Overview, pipeline: Pipeline, outreach: Outreach, agents: Agents, finance: Finance, tasks: Tasks };

/* Ping sonoro delicato (spento di default, si attiva dalle impostazioni) */
function useSoftPing() {
  const ctxRef = useRef(null);
  const pulse = useStore((s) => s.corePulse);
  const sound = useStore((s) => s.settings.sound);
  const last = useRef(0);
  useEffect(() => {
    if (!sound || pulse.n === 0 || pulse.n === last.current) return;
    last.current = pulse.n;
    if (pulse.cat !== "success") return; // solo eventi importanti
    try {
      ctxRef.current ||= new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ctxRef.current;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.type = "sine";
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.55);
    } catch {}
  }, [pulse, sound]);
}

export default function App() {
  const ready = useStore((s) => s.ready);
  const booted = useStore((s) => s.booted);
  const setBooted = useStore((s) => s.setBooted);
  const view = useStore((s) => s.view);
  const init = useStore((s) => s.init);
  const skipBoot = new URLSearchParams(location.search).get("boot") === "0";

  useEffect(() => { init(); }, [init]);
  useEffect(() => { if (skipBoot) setBooted(); }, [skipBoot, setBooted]);
  useSoftPing();

  const View = VIEWS[view] || Overview;

  return (
    <>
      <AnimatePresence>
        {ready && !booted && <Boot onDone={setBooted} />}
      </AnimatePresence>
      {ready && booted && (
        <Shell>
          <View />
        </Shell>
      )}
      <QuickAdd />
    </>
  );
}
