# Marea OS — Automazioni n8n

Workflow di automazione per i due flussi di Marea Creative:
**A) Marea B2B** (agenzia web: attività locali senza sito) e
**B) Airbnb** (host con annunci migliorabili). Coerenti con
[`../ARCHITECTURE.md`](../ARCHITECTURE.md): ogni modulo è indipendente e
comunica per dati/eventi.

> ⚠️ **Trial n8n**: hai 1000 esecuzioni. Ogni lead consuma più esecuzioni
> (scrape + AI + email). Parti con **query piccole** (10–20 attività) e
> `dailyLimit` basso, o le finisci subito.

---

## 0. Credenziali da collegare in n8n (Settings → Credentials)

| Servizio | A cosa serve | Come |
|---|---|---|
| **Apify** (token API) | Scraping Google Maps / Airbnb | apify.com → Settings → API token |
| **Anthropic** (Claude) | Scrivere audit ed email | console.anthropic.com → API key |
| **Gmail** (OAuth) | Inviare email | già collegato nell'esempio n8n |
| **Google Sheets** (OAuth) | Salvare i lead (storage MVP) | stesso account Google |
| *(opzionale)* **Supabase** | Storage scalabile (vedi ARCHITECTURE) | quando passi in produzione |

Per l'MVP uso **Google Sheets** come storage (semplice, come nel tuo esempio).
Il passaggio a **Supabase** è la via "enterprise" descritta in ARCHITECTURE.md.

---

## A) FLUSSO MAREA B2B — prompt per "Build with AI"

Incolla **questo** nella casella *What do you want to automate?* → Build with AI:

```
Trova attività locali senza sito web e mandagli un'email di audit personalizzata.
1. Trigger manuale (poi giornaliero) con un input "query" tipo "elettricisti Cuneo".
2. Usa Apify (actor Google Maps Scraper) per estrarre fino a 20 attività per la query:
   nome, categoria, città, telefono, email, sito web.
3. Filtra: tieni SOLO le attività che NON hanno un sito web.
4. Per ognuna, usa Claude (Anthropic) per scrivere in italiano un'email breve e
   personalizzata: 3 motivi per cui senza un sito moderno perdono clienti, tono
   umano, CTA leggera ("vi mando due esempi?"). Includi una riga di STOP/opt-out.
5. Salva ogni lead su Google Sheets (nome, categoria, città, telefono, email,
   testo audit, stato "contattato", data).
6. Invia l'email via Gmail.
7. Limita a 30 invii al giorno.
```

Dopo la generazione, aggiungi a mano il **follow-up** (vedi §C) perché il builder
AI spesso non lo mette.

### Ricetta manuale (nodo per nodo) — più affidabile del builder

1. **Manual Trigger** (poi sostituibile con *Schedule Trigger*, ogni mattina).
2. **Set** → campo `query` = `elettricisti Cuneo` (poi lo parametrizzi).
3. **HTTP Request** → Apify, POST
   `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=YOUR_TOKEN`
   Body JSON: `{ "searchStringsArray": ["{{$json.query}}"], "maxCrawledPlaces": 20 }`
4. **Filter** → tieni dove il sito è vuoto:
   condizione `{{ $json.website }}` **is empty**.
5. **HTTP Request** → Claude, POST `https://api.anthropic.com/v1/messages`
   Header: `x-api-key: YOUR_KEY`, `anthropic-version: 2023-06-01`.
   Body: modello `claude-sonnet-5`, `max_tokens: 500`, un messaggio con i dati
   dell'attività e l'istruzione di scrivere l'email (vedi prompt sopra).
   L'email è in `{{$json.content[0].text}}`.
6. **Gmail → Send** → A: `{{$json.email}}` · Oggetto: `Un'idea per {{$json.title}}`
   · Testo: l'output di Claude.
7. **Google Sheets → Append** → una riga per lead con nome, città, telefono,
   email, audit, stato, data.

---

## B) FLUSSO AIRBNB — prompt per "Build with AI"

```
Trova host Airbnb con annunci migliorabili e proponigli un miglioramento.
1. Trigger manuale con input "city" (es. "Torino").
2. Usa Apify (actor Airbnb Scraper) per estrarre fino a 15 annunci: titolo, host,
   prezzo, numero foto, descrizione, rating, url.
3. Filtra gli annunci deboli: poche foto (<8) o descrizione corta (<300 caratteri)
   o rating basso.
4. Usa Claude per generare uno "scoring" dell'annuncio (foto, descrizione, prezzo)
   e un'email in italiano all'host con 3 miglioramenti concreti + proposta di
   rifacimento foto/descrizione (e, in futuro, un video AI generato).
5. Salva su Google Sheets (host, annuncio, score, note, url, stato).
6. Invia via Gmail (se disponibile l'email host) e/o prepara un messaggio da
   inviare tramite la piattaforma.
```

Il video AI (Higgsfield/Veo/Runway) è uno step successivo: si aggancia dopo lo
scoring, generando un video dall'immagine dell'annuncio.

---

## C) Follow-up automatico (da aggiungere a entrambi)

Aggiungi dopo l'invio:
1. **Wait** → 3 giorni.
2. **IF** → il lead ha risposto? (controlla Gmail / colonna "risposta" su Sheets).
   - **No** → secondo invio (Claude genera un follow-up più breve) → Gmail.
   - **Sì** → **stop** (nessun altro invio) e aggiorna stato a "risposto".

Questo replica lo **stop-on-reply** già presente nel motore desktop di Marea OS.

---

## D) Come si collega a Marea OS

- **Ora (MVP)**: n8n scrive su **Google Sheets**; Marea OS può leggere lo stesso
  foglio, oppure importi i lead a mano. n8n Cloud **non** può raggiungere l'API
  locale di Marea OS (è su `127.0.0.1` del tuo PC).
- **Produzione (consigliato)**: n8n e Marea OS condividono **Supabase**. n8n fa
  `INSERT` nelle tabelle `leads`/`events`; Marea OS legge le viste. È l'isola
  unica descritta in ARCHITECTURE.md, §7.

---

## E) Compliance & anti-ban (non saltarli)

- **Opt-out**: includi sempre una riga STOP; rimuovi chi chiede di non essere
  contattato.
- **Rate limit**: max ~30 email/giorno all'inizio, warm-up progressivo. Gmail
  banna gli invii massivi improvvisi.
- **Scraping**: rispetta i piani Apify e i limiti dei siti; usa dati B2B pubblici.
- **GDPR**: base giuridica (interesse legittimo B2B), dati minimi, cancellazione
  su richiesta.
```
