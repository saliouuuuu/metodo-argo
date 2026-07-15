# Marea OS — App desktop (Electron)

**Marea OS** è una dashboard "command center": un centro di comando calmo e
vivo per un founder. Qui è impacchettata come **applicazione desktop** (Electron
+ React + Vite + Tailwind + Framer Motion), da eseguire sul tuo computer —
niente a che vedere con il sito web del Metodo Argo.

Il cuore visivo è il singolo componente [`MareaOS.jsx`](./MareaOS.jsx): sequenza
di avvio, Marea Core animato, feed attività live, numeri con rolling, metriche
circolari e un motore di simulazione che genera eventi ogni 3–8s.

## Requisiti

- [Node.js](https://nodejs.org) 18 o superiore (include `npm`).

## Avvio rapido

Dalla cartella `marea-os/`:

```bash
npm install      # scarica le dipendenze (una volta sola)
npm start        # compila e apre l'app in una finestra desktop
```

Per lo sviluppo con ricarica automatica:

```bash
npm run dev      # Vite + Electron con hot-reload
```

## Creare l'installer (per averla come programma)

L'installer si costruisce **sul sistema operativo di destinazione** (è il modo
più affidabile):

```bash
npm run dist         # installer per il TUO sistema operativo attuale
# oppure, esplicito:
npm run dist:win     # Windows  → release/Marea OS Setup x.y.z.exe
npm run dist:mac     # macOS    → release/Marea OS-x.y.z.dmg
npm run dist:linux   # Linux    → release/Marea OS-x.y.z.AppImage
```

Il risultato finisce nella cartella `release/`. Su Windows ottieni un `.exe` da
installare; su macOS un `.dmg`; su Linux un `.AppImage` eseguibile.

> Nota: costruire un installer Windows da Mac/Linux (o viceversa) è possibile ma
> richiede strumenti aggiuntivi. Per un risultato sicuro, lancia `npm run dist`
> direttamente sul PC su cui userai l'app.

## Struttura

```
marea-os/
  MareaOS.jsx            Il componente-esperienza (tutta la dashboard)
  index.html            Pagina del renderer
  src/main.jsx          Bootstrap React → monta MareaOS
  src/index.css         Direttive Tailwind
  electron/main.cjs     Processo principale Electron (apre la finestra)
  electron/preload.cjs  Preload minimale (nessuna API di sistema esposta)
  vite.config.mjs       Config Vite (base "./" per il caricamento file://)
  tailwind.config.cjs   Scansione classi Tailwind
  package.json          Script e configurazione electron-builder
```

## Usare il componente altrove

`MareaOS.jsx` resta un componente React autonomo: puoi importarlo in qualsiasi
progetto React (Vite, Next.js, Claude Artifacts) con le dipendenze `react`,
`framer-motion`, `lucide-react` e Tailwind configurato.

```jsx
import MareaOS from "./MareaOS";
export default function App() {
  return <MareaOS />;
}
```
