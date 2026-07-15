import React from "react";
import { createRoot } from "react-dom/client";
import MareaOS from "../MareaOS.jsx";
import "./index.css";

// Niente StrictMode: il motore di simulazione usa timer che verrebbero
// avviati due volte in sviluppo. In produzione non cambierebbe nulla.
createRoot(document.getElementById("root")).render(<MareaOS />);
