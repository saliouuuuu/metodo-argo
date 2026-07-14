# Marea OS — Command Center

A single-file, self-contained React dashboard for **Marea OS**: a calm, living
command center for a founder running a digital agency. Architectural precision,
invisible glass, hairline borders, ambient motion — no neon, no gamer HUD, no
fake "Jarvis".

## What's inside

`MareaOS.jsx` is one component that renders the whole experience:

- **Startup sequence** — black screen → `MAREA SYSTEM` → simulated auth/boot log
  → the Core assembles from rings and points → `WELCOME BACK` → dissolves into
  the dashboard (wrapped in `AnimatePresence`).
- **Marea Core** — an SVG heart: concentric rings rotating in opposite
  directions, orbiting coordinate markers, a radial grid, a slow scan line, a
  breathing disc, and a cyan ripple on every event.
- **Live Activity feed** — events scroll in from the top with color-coded dots
  (blue info · green success · amber warning · violet AI decision).
- **Rolling numbers** — digits roll vertically with a brief glow on change.
- **Premium circular metrics** — segmented tick-mark rings with orbit
  indicators instead of plain donuts.
- **Simulation engine** — a `useEffect` loop dispatches a realistic agency event
  every 3–8s that feeds the feed, nudges the metrics, and pulses the Core.

## Requirements

```bash
npm install react react-dom framer-motion lucide-react
# Tailwind CSS must be configured in the host project (default palette only).
```

## Usage

```jsx
import MareaOS from "./MareaOS";

export default function App() {
  return <MareaOS />;
}
```

The component is Claude-Artifacts compatible and uses only default Tailwind
colors and standard Lucide icons. Motion is hardware-accelerated
(transform/opacity, `will-change`) and heavy subtrees are memoized so the
per-event state updates don't re-render the Core or the feed items needlessly.
