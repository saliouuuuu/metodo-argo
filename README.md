# Il Metodo Argo 🐾

Sito completo del **Metodo Argo**: landing pubblica con quiz, checkout Stripe con order bump, consegna automatica dell'accesso via email e area membri con i 21 giorni e checklist interattive.

**Stack** (deciso nel brief, non cambiare senza motivo forte): Netlify (hosting + funzioni serverless) · Supabase (auth + Postgres + storage) · Stripe (pagamenti). Budget a regime: 0–10 €/mese.

## Struttura del progetto

```
index.html                        Landing pubblica: hero, problema, 3 fasi,
                                  quiz interattivo, profili, pricing, FAQ
accedi.html                       Login, recupero password, prima impostazione
                                  password (da link di invito post-acquisto)
area.html                         Area membri: 21 giorni, sblocco progressivo,
                                  checklist salvate in `progress`, download PDF
grazie.html                       Pagina post-pagamento (success_url di Stripe)
assets/css/argo.css               Design system (palette e font del brief)
assets/js/supabase-client.js      Client Supabase condiviso (config da /api/config)
netlify/functions/
  config.js                       Espone al browser la sola config pubblica
  save-quiz.js                    Salva le risposte del quiz in `quiz_responses`
  create-checkout.js              Crea la sessione Stripe Checkout (€47 + bump €9)
  stripe-webhook.js               Pagamento completato → utente + profilo +
                                  acquisto + email di invito automatica
supabase/schema-database.sql      Tabelle, RLS e bucket storage privato
supabase/seed-course-days.sql     Contenuti dei 21 giorni (Fase 2 segnaposto)
```

Nessun build step: HTML/CSS/JS statici + funzioni Netlify. Le uniche dipendenze (`stripe`, `@supabase/supabase-js`) servono solo alle funzioni.

## Flusso di acquisto

1. Il visitatore fa il quiz → profilo assegnato → email salvata in `quiz_responses` (via `/api/save-quiz`).
2. «Sblocca il Metodo Argo» → modale con email + checkbox order bump → `/api/create-checkout` → redirect a Stripe Checkout.
3. Stripe chiama `/api/stripe-webhook`: crea l'utente Supabase (che **invia da solo l'email di invito** con il link per impostare la password), scrive `profiles` (col modulo del quiz) e `purchases`.
4. L'utente clicca il link, sceglie la password su `accedi.html` ed entra in `area.html`.

Sblocco dei giorni: **progressivo** (un giorno ogni 24 ore dall'acquisto). Per sbloccare tutto subito: in `area.html` cambia `UNLOCK_MODE` da `'progressive'` ad `'all'`.

## Setup (in ordine)

### 1. Supabase

1. Crea un progetto su [supabase.com](https://supabase.com) (piano Free).
2. SQL Editor → esegui **`supabase/schema-database.sql`**, poi **`supabase/seed-course-days.sql`**.
3. Storage → bucket `downloads` (creato dallo schema) → carica:
   `Metodo-Argo-ebook-v2.pdf`, `Tracker-21-giorni.pdf`, `Checklist-arrivo-cucciolo.pdf`.
   Il bucket è privato: i PDF si scaricano solo da loggati con acquisto (URL firmati).
4. Authentication → URL Configuration → **Site URL** = l'URL del sito; aggiungi `https://<sito>/accedi.html` ai **Redirect URLs**.
5. Authentication → Email Templates → personalizza **Invite user** in italiano con la voce di Argo (è l'email che il cliente riceve dopo l'acquisto).
6. Project Settings → API → copia `URL`, `anon key`, `service_role key`.

### 2. Stripe

1. Products → crea **Il Metodo Argo** a €47 (one-time) e **Checklist arrivo cucciolo** a €9 (one-time); copia i due `price_...`.
2. Developers → Webhooks → Add endpoint: `https://<sito>/api/stripe-webhook`, evento **`checkout.session.completed`**; copia il `whsec_...`.
3. Prova prima in test mode (chiavi `sk_test_`), passa alle chiavi live solo a fine collaudo.

### 3. Netlify

1. Collega il repo; nessun comando di build (config già in `netlify.toml`).
2. Site settings → Environment variables → imposta tutte le variabili di **`.env.example`**.
3. Deploy. Per lo sviluppo locale: `cp .env.example .env`, compila, poi `npm install && npx netlify dev`.

### Collaudo end-to-end (in test mode)

1. Apri il sito → fai il quiz → inserisci una tua email → checkout con carta di test `4242 4242 4242 4242`.
2. Arrivi su `grazie.html`; entro un minuto ricevi l'email di invito Supabase.
3. Imposta la password → entri in `area.html`: giorno 1 sbloccato, modulo del quiz assegnato, PDF scaricabili.
4. Spunta la checklist del giorno 1 → ricarica la pagina → le spunte restano (tabella `progress`).

## Contenuti

- Fase 1 (giorni 1–7) e Fase 3 (17–21) sono complete nel seed, in voce di Argo.
- I giorni 8–16 dei 5 moduli (Trattore, Squalo, Esploratore Sordo, Velcro, Tornado) hanno titoli definitivi e testo segnaposto: **sono il prossimo contenuto da scrivere**. Si aggiornano dalla dashboard Supabase (Table editor → `course_days` → colonna `content`, markdown leggero: `**grassetto**`, liste `1.`/`-`).
- Video: colonna `video_url` già pronta per Bunny.net, quando ci saranno i video.
- Immagini fotorealistiche (Higgsfield): rifinitura finale, non blocca nulla — oggi ci sono placeholder emoji.

## Landing premium (upgrade fiducia & conversione)

La landing è stata rifinita per trasmettere valore e ridurre le esitazioni, **senza cambiare palette, font o identità del brand**. Elementi aggiunti:

- **Hero** con sottotitolo di valore, rating e *trust bar* (accesso immediato · 21 giorni · multi-device · Stripe).
- **Offerta** con prezzo di listino barrato (€97 → €47), risparmio e badge «Offerta lancio».
- **Codice sconto dinamico**: ogni visita genera un codice `ARGO-####` (in `localStorage`) con countdown; alla scadenza se ne genera uno nuovo. Il codice è **realmente collegato a Stripe**: `create-checkout.js` crea al volo un coupon `percent_off` del 10% (monouso). La percentuale è **fissa lato server** — il valore inviato dal client non viene mai usato per calcolare lo sconto.
- **Recensioni** in carosello con autoplay lento (8 storie, avatar iniziali sostituibili).
- Sezioni **Cosa ricevi**, **Come funziona** (timeline), **Perché nasce**, **Immagina il risultato**, **Garanzia** dedicata, **FAQ** ampliata, **checkout reassurance**, footer completo con pagine legali.
- **Micro-animazioni** (scroll reveal, hover, sticky CTA mobile) rispettose di `prefers-reduced-motion`; fallback `<noscript>`.

File nuovi: `assets/css/landing.css`, `assets/js/landing.js`, `assets/favicon.svg`, le pagine `chi-siamo/contatti/privacy/cookie/termini/rimborso.html`.

### Sostituire i placeholder

- **Immagini**: in `assets/img/placeholders/*.svg` ci sono segnaposto brandizzati (proprietaria+border collie, esercizi, passeggiata, dare la zampa, casa, tablet/dettagli ebook, «immagina» ×4). Sostituisci il file mantenendo lo stesso nome, oppure cambia l'`src` (le dimensioni `width`/`height` evitano layout shift).
- **Video**: i blocchi in `#video` sono segnaposto. Aggiungi l'attributo `data-video="URL"` (es. Bunny.net) al blocco: al click viene montato un `<video>` con `preload="metadata"` e `playsinline`.
- **Dati legali/contatti**: nelle pagine legali i punti da compilare (denominazione, P. IVA, sede, titolare del trattamento) e l'email `assistenza@ilmetodoargo.it` sono segnalati con una nota; completa e fai verificare i testi a un professionista.

## Sicurezza

- Nessuna chiave nel codice: tutto in variabili d'ambiente (`.env` è in `.gitignore`).
- Row Level Security su tutte le tabelle: ognuno legge solo i propri dati; i contenuti del corso e i PDF sono visibili solo a chi ha un acquisto; `quiz_responses` si scrive solo dal server.
- Il webhook Stripe verifica la firma ed è idempotente (eventi duplicati non creano doppi acquisti).
