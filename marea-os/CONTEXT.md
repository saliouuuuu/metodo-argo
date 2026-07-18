# Marea OS — Briefing tecnico (handoff)

> Documento di contesto da dare a un altro assistente (es. Gemini). Descrive
> cos'è Marea OS, com'è costruito, cosa funziona davvero, a che fase siamo e
> cosa manca. Aggiornato al commit corrente.

## 1. Cos'è

**Marea OS** è il centro operativo (Agency Operating System) di **Marea Creative**,
l'agenzia di Saliou. Non è il sito del "Metodo Argo" (quello è un altro progetto
nello stesso repository, cartella radice). Marea OS vive in `marea-os/` ed è
un'**app desktop** che registra e mostra in tempo reale tutta l'attività
dell'agenzia (lead, outreach, chiamate, follow-up, appuntamenti, preventivi,
clienti, finanze, performance degli agenti AI) e ora **invia email reali** con
follow-up automatici.

Obiettivo: un vero "sistema operativo" dell'agenzia, non una dashboard estetica.

## 2. Stack tecnico

- **Electron** (app desktop) — processo principale in `electron/*.cjs`.
- **React 18 + Vite** — renderer (la UI).
- **Tailwind CSS** — design system (token palette in `tailwind.config.cjs`).
- **Zustand** — store applicativo.
- **Three.js + React Three Fiber + postprocessing** — il "Neural Core" 3D (WebGL).
- **Framer Motion** — animazioni.
- **nodemailer** — invio email SMTP reale (solo nel processo Electron).
- **lucide-react** — icone.
- Nessun backend cloud: tutto gira in locale sul PC. Persistenza su file in
  `userData` di Electron.

## 3. Architettura (il concetto chiave)

**Tutto è un evento.** Ogni cosa che accade in agenzia è un evento immutabile:

```
{ id, ts, type, source, demo, data }
```

- `type`: es. `lead.found`, `email.sent`, `email.replied`, `call.made`,
  `meeting.scheduled`, `quote.sent`, `client.won`, `finance.income`, ecc.
  (catalogo completo in `src/data/events.js` → `EVENT_TYPES`).
- `source`: `manual` | `api` | `demo` | id di un agente (`lead-intel`, `outreach`,
  `sales`, `ops`, `finance`).
- `demo`: `true` per i dati simulati, `false` per quelli reali.

**Una sola fonte di verità.** Tutti gli aggregati (pipeline, outreach, finanze,
task, metriche agenti) sono **derivati** dalla lista eventi con un reducer puro
`deriveState(events)` (`src/data/events.js`). Le analitiche più avanzate
(metriche pipeline, statistiche finanziarie, forecast) sono in
`src/data/analytics.js` e sono **deterministiche** (mai numeri casuali).

**Due binari sempre separati** (`src/data/store.js`):
- `realEvents` — persistiti su disco, la verità.
- `demoEvents` — generati dal motore demo (`src/data/demo.js`), volatili, mai
  salvati. Badge viola `DEMO DATA` sempre visibile quando attivi.
- Si cambia sorgente da Impostazioni → Sorgente dati.

**Il bridge** (`src/data/bridge.js`) astrae Electron vs browser:
- In Electron usa `window.marea.*` (IPC, definito in `electron/preload.cjs`).
- Nel browser (anteprima) non persiste e parte in modalità DEMO.

**Perché è "un'isola unica":** qualsiasi azione (un click su ⌘K, un'email
inviata dal motore, un evento spinto da un agente via API) scrive **un evento
nello stesso store**, e tutte le viste si aggiornano insieme. Nessuna vista ha
dati propri scollegati.

## 4. Struttura dei file (in `marea-os/`)

```
electron/
  main.cjs        Finestra + IPC + avvio store, API locale, motore Outreach
  store.cjs       Persistenza eventi reali (events.jsonl) + config/token
  api.cjs         API HTTP locale (127.0.0.1) per gli agenti esterni
  mailer.cjs      Invio SMTP reale (nodemailer)
  templates.cjs   Template email (iniziale + 3 follow-up) + sequenza
  outreach.cjs    Motore automazione outreach (sequenze, coda, stop-on-reply)
  preload.cjs     Ponte sicuro renderer <-> main (contextIsolation)
src/
  data/
    events.js     Tipi evento + reducer deriveState
    analytics.js  Metriche pipeline, statistiche finance, forecast
    agents.js     Roster dei 5 agenti + modalità
    demo.js       Motore demo (storico 35gg + eventi live 3-9s)
    store.js      Store zustand (binari real/demo)
    bridge.js     Astrazione Electron/browser
    useOutreach.js Hook stato live del motore email
  core3d/NeuralCore.jsx   Il Core 3D (R3F + bloom, fallback 2D)
  components/     Shell (sidebar+header+settings), Boot, QuickAdd (⌘K),
                  ui/ (kit), charts/ (TrendChart)
  views/          Overview, Pipeline, Outreach, Agents, Finance, Tasks
  App.jsx, main.jsx
```

## 5. Le viste

- **Overview (Command Center)** — 3 livelli: hero finanziario (valore generato,
  obiettivo, forecast, stile "wallet"); **Marea Core** al centro (integrato nello
  sfondo, senza riquadro) con stato del sistema; **Priorità di oggi** + **Live
  Activity**.
- **Pipeline** — kanban lead→cliente (Nuovi, Verificati, Contattati, In dialogo,
  Appuntamento, Preventivo, Clienti, Persi) con metriche per colonna (valore,
  conversione, tempo medio), card ricche (score, valore, agente, prossima
  azione), modalità **Board/Table**, filtri.
- **Outreach** — header KPI (inviate oggi, limite, open/reply rate, risposte
  positive, appuntamenti); tab **Motore** (coda approvazioni + sequenze),
  Campaigns, Sequences, Inbox, Leads, Analytics. **Qui vive il motore email.**
- **Agents** — organigramma a **nodi**: Saliou (CEO / Human Command) in cima, i
  5 agenti collegati, pulse sul nodo attivo; clic su un agente → pannello di
  dettaglio (Overview / Performance / Log / Comms / Config) dove stanno i
  controlli Pausa/Off/Modalità.
- **Finance** — stile wallet: profitto grande, selettori 7G→Tutto, grafico
  entrate/spese/profitto con **previsione tratteggiata**, box Forecast
  (conservativo/realistico/ottimistico + probabilità), statistiche, movimenti.
- **Tasks** — workspace Today / Board / All, header metriche, creazione completa.

**⌘K (Quick Add)** — palette rapida per registrare qualsiasi evento in pochi
secondi (lead, email, chiamata, entrata, task…). Aggiorna tutta la dashboard.

## 6. I 5 agenti AI (concetto, `src/data/agents.js`)

Pochi agenti, ognuno con più competenze:
1. **Lead Intelligence** — trova attività locali, verifica il sito, arricchisce i
   contatti.
2. **Outreach** — email personalizzate, invio programmato, sequenze follow-up,
   classificazione risposte. **(Oggi realmente implementato, vedi §7.)**
3. **Sales** — chiamate, appuntamenti, preventivi.
4. **Operations** — clienti, progetti, coordinamento.
5. **Finance & Analytics** — entrate, spese, analisi.

Gli agenti "esterni" (n8n, Make, script) possono spingere eventi nel sistema via
**API locale**: `POST http://127.0.0.1:<porta>/v1/events` con header
`Authorization: Bearer <token>` (porta e token in Impostazioni). Ogni evento
aggiorna Marea OS in tempo reale.

## 7. Il motore email — funzionalità REALE

Questo è l'unico agente già "reale" end-to-end (`electron/outreach.cjs`):

- Invia **email vere via SMTP** (`electron/mailer.cjs`, nodemailer). Funziona con
  Gmail (App password), Brevo, Resend, Mailgun, SMTP del dominio.
- **Sequenza automatica**: email iniziale → follow-up +2g → +3g → +4g
  (`electron/templates.cjs`), con segnaposto `{{name}} {{city}} {{sector}}
  {{issue}} {{sender}}`.
- **Stop-on-reply**: quando arriva un evento `email.replied` per quel lead, la
  sequenza si ferma da sola.
- **Rate limit** giornaliero + **3 modalità**: Manuale / Approvazione (coda da
  approvare nel tab Motore) / Automatica.
- Ogni invio scrive eventi reali (`email.sent`, `email.delivered`) nello store →
  il lead avanza a "contattato", il feed e i KPI si aggiornano.
- Configurazione in Impostazioni → Outreach · Email (SMTP + mittente + limite +
  modalità + "Verifica connessione").
- **Solo nell'app desktop** (serve Node/SMTP). Nel browser mostra badge
  DEMO/BROWSER e resta simulato.
- Testato con mock SMTP: invio, avanzamento sequenza, coda+approvazione,
  stop-on-reply, rate limit — tutti verificati.

## 8. Il Neural Core

Rappresentazione 3D dello stato del sistema (WebGL): toro di fibre organiche
turchesi, sfera con wireframe icosaedrico, costellazione di neuroni, particelle.
Pulsa brevemente al colore dell'evento quando un agente completa un'attività.
Canvas **trasparente**, integrato nello sfondo scuro (niente riquadro). Fallback
2D se manca la GPU.

## 9. A che fase siamo — FATTO

- ✅ Architettura event-driven completa (store, reducer, analytics, demo/real
  separati, persistenza su disco).
- ✅ Tutte le 6 viste ridisegnate ("Agency OS" premium, palette OLED, responsive
  desktop/tablet/mobile, no overflow).
- ✅ Marea Core 3D integrato nello sfondo.
- ✅ ⌘K per registrare eventi; API locale per gli agenti esterni.
- ✅ **Motore email reale** (SMTP) con sequenze, follow-up, stop-on-reply, coda
  approvazioni, rate limit.
- ✅ Impacchettamento desktop (Electron + electron-builder; `npm run dist:win/mac/linux`).

## 10. Cosa MANCA — prossimi passi

- ⏳ **Lettura risposte automatica (IMAP)**: oggi le risposte alle email si
  registrano a mano (⌘K) o via API; con IMAP l'Outreach classificherebbe da solo
  interessato/non interessato e la pipeline avanzerebbe automaticamente.
- ⏳ **Lead generation reale**: il Lead Intelligence Agent è un concetto; serve
  uno scraper (Google Maps/Places) che trovi attività, verifichi il sito e
  spinga `lead.found`/`lead.verified` via API. *(Consigliato come prossimo passo:
  è il "carburante" per l'outreach che ora funziona.)*
- ⏳ **Sales reale**: integrazione calendario (Google Calendar) per appuntamenti,
  eventuale dialer per le chiamate.
- ⏳ **Finance reale**: collegare pagamenti reali (es. Stripe) invece di
  registrarli a mano; il forecast userebbe contratti confermati e incassi attesi.
- ⏳ **Sincronizzazione multi-dispositivo / cloud** (oggi tutto è locale sul PC).
- ⏳ **Autenticazione/più utenti** (oggi single-user, Saliou).

## 11. Come farlo girare

```bash
cd marea-os
npm install
npm start        # build + finestra desktop
npm run dev      # sviluppo con hot-reload
npm run dist:win # (o :mac / :linux) crea l'installer
```

Anteprima nel browser (solo demo, senza invio reale): build Vite servita
staticamente, oppure `npm run dev` e apertura di `http://localhost:5173`.
Parametri utili: `?boot=0` salta il boot, `?view=finance` apre una vista.
