import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Sidebar from "./components/Sidebar.jsx";
import Today from "./views/Today.jsx";
import Leads from "./views/Leads.jsx";
import Overview from "./views/Overview.jsx";

const VIEWS = { today: Today, leads: Leads, overview: Overview };

export default function App() {
  const [view, setView] = useState("today");
  const View = VIEWS[view] || Today;
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-ink">
      <Sidebar view={view} setView={setView} />
      <main className="min-h-0 flex-1 overflow-y-auto border-l border-line">
        <AnimatePresence mode="wait">
          <View key={view} />
        </AnimatePresence>
      </main>
    </div>
  );
}
