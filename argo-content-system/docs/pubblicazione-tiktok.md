# Fase 1 — Analisi della pubblicazione automatica su TikTok

> Nota di metodo: la documentazione ufficiale TikTok (developers.tiktok.com)
> non è raggiungibile dall'ambiente di sviluppo. Questa analisi si basa sulla
> conoscenza consolidata delle policy e API TikTok (aggiornata a inizio 2026);
> i punti marcati **[VERIFICA]** vanno confermati da te sui link indicati
> prima di attivare la via corrispondente.

## Le opzioni sul tavolo

### A · TikTok Content Posting API (ufficiale)
- **Cosa fa:** pubblicazione diretta (Direct Post) o caricamento come bozza
  (Upload) via API. Supporta caption con hashtag, privacy, disattivazione
  commenti/duetti. È l'unica via di pubblicazione automatica "benedetta"
  da TikTok.
- **Requisiti:** creare un'app su developers.tiktok.com, ottenere le scope
  `video.publish`/`video.upload`, e — punto critico — **superare l'audit
  dell'app**: finché l'app non è verificata, i video pubblicati sono
  forzati a visibilità **SOLO PRIVATA** (SELF_ONLY). [VERIFICA: stato
  attuale del processo di audit e tempi]
- **Compatibilità account:** funziona con account personali/creator via
  OAuth (l'utente autorizza la propria app). Non serve account business
  per il Direct Post. [VERIFICA]
- **Pro:** conforme alle regole, affidabile, nessun rischio account.
- **Contro:** burocrazia dell'audit (pensata per aziende/tool, non per
  singoli creator); tempi non prevedibili; da rifare se cambiano le policy.
- **Verdetto:** la strada giusta *a regime*, non per partire domani.

### B · Scheduler partner ufficiali (Metricool, Buffer, Later, Publer)
- **Cosa fanno:** sono app già "auditate" da TikTok: colleghi il tuo
  account e pubblicano loro per te, ad orario programmato, senza che tu
  debba costruire nulla.
- **Requisiti:** account sul servizio (Metricool ha un piano gratuito che
  include TikTok con pubblicazione automatica). L'autopubblicazione
  richiede in alcuni casi il passaggio dell'account TikTok a
  **creator/business** [VERIFICA sul piano scelto]. Il passaggio a
  creator NON rende l'account "aziendale" agli occhi del pubblico.
- **Pro:** conforme, zero manutenzione, calendario visuale, parte in un
  pomeriggio. Metricool gratis per 1 brand.
- **Contro:** dipendenza da un servizio terzo; l'upload va fatto verso il
  loro sistema (via interfaccia o API a pagamento).
- **Verdetto:** **il miglior rapporto affidabilità/sforzo per iniziare
  con l'autopubblicazione.**

### C · Scheduler nativo di TikTok (web)
- **Cosa fa:** da TikTok web (upload da browser) puoi **programmare i
  post fino a 10 giorni in avanti**, con caption, cover e privacy.
  [VERIFICA: disponibilità sul tuo account — di norma serve attivare
  account creator/business nelle impostazioni]
- **Pro:** ufficiale al 100%, gratuito, zero terze parti. Con una seduta
  di 10 minuti ogni 2-3 giorni copri tutti gli slot.
- **Contro:** il gesto di upload resta manuale (2-3 minuti a video).
- **Verdetto:** **la via consigliata per la partenza** — vedi sotto.

### D · Automazione browser (Playwright/Puppeteer)
- **Cosa farebbe:** uno script che apre TikTok, fa login e carica il video.
- **Problemi:** viola lo spirito (e verosimilmente la lettera) dei ToS;
  TikTok ha rilevamento bot aggressivo; login automatizzato = CAPTCHA e
  verifiche che NON vanno aggirati (e tu stesso l'hai vietato); sessioni
  che scadono; e il tuo è **l'account personale principale** — il rischio
  di flag/ban ricade su di esso.
- **Verdetto:** **scartata.** Il rischio è tutto sul tuo asset più
  prezioso, per risparmiare 3 minuti al giorno.

### E · Zapier / Make
- Non hanno un'integrazione di pubblicazione TikTok organica affidabile
  (i loro moduli TikTok riguardano soprattutto Ads/Lead). Passerebbero
  comunque per l'API ufficiale con gli stessi vincoli di audit. **Scartata
  come via primaria.** [VERIFICA se nel frattempo è cambiato]

## Raccomandazione (criteri: affidabilità, conformità, costo, semplicità, quotidianità, rischio, manutenzione)

**Strategia a due stadi:**

1. **Da subito — Modalità semi-automatica "Publishing Kit" (opzione C):**
   il sistema produce tutto (video finale, caption+hashtag pronti da
   incollare, orario consigliato, checklist), tu fai solo il gesto di
   upload sullo scheduler nativo TikTok — 2-3 minuti a video, anche in
   batch ogni 2-3 giorni grazie alla programmazione a 10 giorni.
   Rischio zero, costo zero, account che resta "naturale".
2. **A regime — Metricool (opzione B):** quando la routine funziona,
   colleghi Metricool: il sistema esporta il kit e tu lo carichi sul suo
   calendario (o via API se passerai al piano a pagamento). Autopubblicazione
   conforme, tu solo in approvazione.
3. **Orizzonte — Content Posting API (opzione A):** se il progetto cresce,
   apriamo l'app developer e richiediamo l'audit. L'architettura del
   sistema prevede già l'adapter (`automation/publishers/`).

**Vincolo dichiarato:** questo ambiente di sviluppo è un container cloud
senza sessione browser tua: la pubblicazione fisica non può avvenire da
qui in nessun caso. Il confine uomo/macchina è: **il sistema prepara e
controlla tutto, l'ultimo miglio è tuo** (finché non colleghiamo B o A).

## Cosa serve da te per ogni stadio
- **Stadio 1 (oggi):** attivare account creator su TikTok (Impostazioni →
  Account) per avere lo scheduler web. Nient'altro.
- **Stadio 2:** account Metricool gratuito collegato al TikTok.
- **Stadio 3:** account developer TikTok + richiesta audit (ti guiderò).
