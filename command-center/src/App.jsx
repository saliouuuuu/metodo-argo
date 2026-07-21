import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Sidebar from "./components/Sidebar.jsx";
import Today from "./views/Today.jsx";
import Overview from "./views/Overview.jsx";

export default function App() {
  const [view, setView] = useState("today");
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-ink">
      <Sidebar view={view} setView={setView} />
      <main className="min-h-0 flex-1 overflow-y-auto border-l border-line">
        <AnimatePresence mode="wait">
          {view === "today" ? <Today key="today" /> : <Overview key="overview" />}
        </AnimatePresence>
      </main>
    </div>
  );
}
