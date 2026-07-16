# Marea OS — Il centro operativo di Marea Creative

App desktop (Electron + React + Three.js) che registra e mostra in tempo reale
tutta l'attività dell'agency: lead, outreach, chiamate, follow-up, appuntamenti,
preventivi, clienti, finanze e performance degli agenti AI.

Estetica: OLED nero puro, turchese/ciano, **Neural Core 3D** (WebGL) come
cervello visivo del sistema. Boot breve e saltabile. Interfaccia mix EN/IT.

## Viste

| Vista | Contenuto |
|---|---|
| **Overview** | Neural Core, attività di oggi, funnel, feed live, KPI money bar (Profit · Revenue · Expenses · Pipeline · Clients) |
| **Pipeline** | Kanban lead → verificato → contattato → in dialogo → appuntamento → preventivo → cliente/perso |
| **Outreach** | Email (inviate/consegnate/aperte/risposte/errori + open/reply rate), chiamate con esiti, follow-up con scadenze |
| **Agents** | I 5 agenti (Lead Intelligence, Outreach, Sales, Operations, Finance & Analytics): stato, modalità manuale/approvazione/automatica, task corrente, metriche, errori, cronologia, controlli |
| **Finance** | Entrate, spese, profitto, margine, obiettivo mensile, grafico 6 mesi, movimenti |
| **Tasks** | Attività personali/operative con priorità e scadenze |

## Dati: REAL vs DEMO (sempre separati)

- **REAL** — persistiti su disco (`userData/data/events.jsonl`), mai mescolati ai demo.
  Si registrano con **⌘K** (palette rapida) o arrivano dagli **agenti via API locale**.
- **DEMO** — generati dal motore di simulazione, volatili, mai salvati.
  Servono a vedere il sistema "vivo" durante lo sviluppo. Badge viola `DEMO DATA` sempre visibile.
- Cambio sorgente: Impostazioni → Sorgente dati.

## API locale per gli agenti

All'avvio l'app espone un server HTTP **solo su 127.0.0.1** (porta 41100,
token generato al primo avvio — entrambi in Impostazioni, con copia 1-click):

```bash
curl -X POST http://127.0.0.1:41100/v1/events \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "type": "lead.found", "agent": "lead-intel",
        "data": { "name": "Pizzeria La Brace", "sector": "Ristorazione",
                  "location": "Monza", "issues": "Sito non mobile" } }'
```

Accetta un evento singolo o un array (batch). Tipi validi: `lead.found`,
`lead.verified`, `lead.contacted`, `email.sent|delivered|opened|replied|error`,
`call.made`, `followup.created|done`, `meeting.scheduled`, `quote.sent`,
`client.won|lost`, `finance.income|expense`, `task.created|done`,
`agent.status|log|error`. Ogni evento aggiorna la dashboard in tempo reale.

Da n8n/Make: nodo HTTP Request → POST all'endpoint con header Bearer.

## Avvio

```bash
npm install      # una volta sola (serve Node.js 18+)
npm start        # build + finestra desktop
npm run dev      # sviluppo con hot-reload
```

## Installer

```bash
npm run dist:win     # Windows  → release/Marea OS Setup.exe
npm run dist:mac     # macOS    → release/Marea OS.dmg
npm run dist:linux   # Linux    → release/Marea OS.AppImage
```

Va lanciato sul sistema operativo di destinazione.

## Struttura

```
electron/main.cjs       Finestra + IPC + avvio store e API
electron/store.cjs      Persistenza eventi reali (JSONL) + config/token
electron/api.cjs        API HTTP locale per gli agenti
electron/preload.cjs    Ponte sicuro renderer ↔ main
src/data/events.js      Tipi evento + reducer (eventi → aggregati)
src/data/agents.js      Roster dei 5 agenti e modalità
src/data/demo.js        Motore demo (storico 35gg + eventi live)
src/data/store.js       Store zustand, binari real/demo separati
src/core3d/NeuralCore.jsx  Il core 3D (R3F + bloom, fallback 2D)
src/components/         Shell, Boot, QuickAdd (⌘K), kit UI
src/views/              Overview, Pipeline, Outreach, Agents, Finance, Tasks
```

Nel browser (senza Electron) l'app parte in modalità DEMO: utile per anteprime.
Parametri utili: `?boot=0` salta il boot, `?view=pipeline` apre una vista.
