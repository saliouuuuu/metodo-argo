import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" per far funzionare i percorsi degli asset quando Electron
// carica il file dal disco (file://) nella build di produzione.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: { outDir: "dist", emptyOutDir: true },
});
