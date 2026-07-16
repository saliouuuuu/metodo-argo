import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Niente StrictMode: i timer del motore demo e i loop del core 3D
// verrebbero montati due volte in sviluppo.
createRoot(document.getElementById("root")).render(<App />);
