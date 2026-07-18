# Marea OS — Architettura Backend & Automazione (Enterprise)

> Progetto architetturale del backend event-driven di **Marea OS** (agenzia AI
> Marea Creative). Obiettivo: scalare da centinaia a decine di migliaia di lead
> **senza riscrivere il codice**. Nessun frontend/UI qui: solo backend, dati,
> eventi, code, moduli, errori. Il documento è coerente con l'app esistente
> (vedi §7 — migrazione dal modello locale attuale).

## 0. Principi architetturali (i vincoli, resi legge)

1. **Event-driven, non chiamate dirette.** I moduli non si chiamano tra loro:
   emettono **eventi** su un bus. Il disaccoppiamento è totale.
2. **Ogni modulo è un servizio indipendente e sostituibile.** Interfaccia
   standard: *consuma un evento → produce un evento*. Apify si sostituisce con
   un altro scraper cambiando un solo adapter, senza toccare il resto.
3. **Stateless + idempotente.** Ogni modulo è senza stato interno (lo stato vive
   in Supabase) e ogni operazione ha una **idempotency key**: rieseguirla non
   crea duplicati (né doppi invii, né doppi lead).
4. **Il DB è l'unica fonte di verità.** Supabase (Postgres) contiene lead,
   interazioni, code, log. n8n orchestra, non memorizza.
5. **Contratti versionati.** Ogni evento ha `schema_version`; i payload cambiano
   in modo retro-compatibile.
6. **Adapter pattern per i servizi esterni.** Scraper, email, AI, video: ognuno
   dietro un'interfaccia astratta (`Scraper`, `EmailProvider`, `LLM`,
   `VideoGen`), così il fornitore è intercambiabile.

## 1. Architettura di sistema

```
                         ┌───────────────────────────────────────────────┐
                         │                SUPABASE (Postgres)             │
                         │  leads · businesses · websites · audits ·      │
                         │  listings · interactions · campaigns ·         │
                         │  sequences · events(log) · job_queue ·         │
                         │  clients · invoices · logs · rate_counters     │
                         └───────▲───────────────┬───────────────▲────────┘
                                 │ (RLS)         │ triggers/         │
                    read/write   │               │ Realtime          │ data-layer
                                 │               ▼                   │ (viste/RPC)
   ┌─────────────┐        ┌──────┴───────────────────────┐    ┌─────┴───────────┐
   │  SCRAPERS   │ events │            n8n               │    │ DASHBOARD DATA  │
   │ Apify/Fire- ├───────▶│   (ORCHESTRATORE / CERVELLO) │◀──▶│   -LAYER API    │
   │ crawl/PW    │webhook │  - consumer del job_queue     │    │ (REST/RPC read) │
   └─────────────┘        │  - router di eventi           │    └─────────────────┘
                          │  - rate limiter / scheduler   │             ▲
   ┌─────────────┐        │  - retry / dead-letter        │             │ consuma
   │  AI SERVICES│◀──────▶│  - chiama gli adapter esterni │      ┌──────┴───────┐
   │ Claude/GPT  │        └───▲───────────────┬──────────┘      │  MAREA OS     │
   │ Higgsfield  │            │ webhook in     │ webhook out     │  (Command/UI) │
   └─────────────┘            │                ▼                 └──────────────┘
   ┌─────────────────────────────────────────────────────────────┐
   │ COMMS: Resend/Gmail (email) · Twilio/WhatsApp Business (msg) │
   └─────────────────────────────────────────────────────────────┘
```

**Ruoli**
- **Supabase** = stato + event log + coda durevole (`job_queue`) + auth/RLS +
  Realtime (push verso la dashboard). È il perno.
- **n8n** = orchestratore. Non è un DB: è un insieme di workflow che (a) fanno da
  **consumer** della coda, (b) **instradano** gli eventi, (c) applicano **rate
  limiting/scheduling**, (d) chiamano gli **adapter** dei servizi esterni, (e)
  gestiscono **retry/dead-letter**.
- **Moduli** (Lead Scout, Website Analyzer, …) = workflow n8n + eventuali micro-
  servizi, ognuno con un contratto evento-in / evento-out.
- **Dashboard Data-layer** = un set di **viste SQL + RPC** (function Postgres) e/o
  un piccolo servizio REST che espone SOLO dati aggregati in lettura. La UI
  (Marea OS desktop/web) consuma questo, mai le tabelle grezze.

**Il flusso è sempre lo stesso**: un modulo scrive un evento → `job_queue`
riceve i task derivati → n8n li consuma con i giusti limiti → il modulo
successivo produce il suo evento. Nessun modulo conosce il successivo per nome:
conosce solo i **tipi di evento** a cui reagisce.

## 2. Schema Database (Supabase / Postgres)

Tabelle principali (colonne chiave; PK `id uuid default gen_random_uuid()`,
`created_at`, `updated_at` ovunque). Enum come `text` con `check` o tipi enum.

### Anagrafiche
- **businesses** — l'attività trovata.
  `name, category, city, country, source(text: gmaps|airbnb|directory),
  source_ref(unique), website_url, phone, email, whatsapp, raw jsonb`.
  `unique(source, source_ref)` → dedup a monte.
- **leads** — il business nel funnel commerciale (1 business può generare 1 lead).
  `business_id fk, stage(enum: new|verified|contacted|replied|meeting|quote|won|lost),
  score int, potential_value numeric, owner_agent text, next_action text,
  consent_status(enum: unknown|opted_in|opted_out), last_contact_at, dedup_key unique`.
- **clients** — lead vinto → cliente.
  `lead_id fk, company, contact, plan, mrr numeric, status(active|paused|churned)`.

### Analisi
- **websites** — output del Website Analyzer.
  `business_id fk, has_site bool, mobile_score, seo_score, perf_score, a11y_score,
  issues jsonb, lighthouse jsonb, analyzed_at`.
- **listings** — annunci Airbnb (Airbnb Analyzer).
  `business_id fk, listing_url, host_name, photos_score, desc_score, price,
  ai_scoring jsonb`.
- **audits** — audit generato dall'AI Audit Agent.
  `lead_id fk, kind(web|airbnb), summary, findings jsonb, pdf_url,
  video_url, model_used, cost_tokens, generated_at`.

### Outreach & CRM
- **campaigns** — `name, channel(email|whatsapp), goal, status, agent`.
- **sequences** — sequenza di follow-up. `campaign_id fk, name, steps jsonb
  (o tabella sequence_steps: step_index, delay_hours, channel, template_key,
  condition)`.
- **interactions** — OGNI messaggio/tocco (append-only).
  `lead_id fk, channel, direction(out|in), template_key, subject, body,
  provider_message_id, status(queued|sent|delivered|opened|replied|bounced|error),
  step_index, campaign_id, meta jsonb, occurred_at`.
- **appointments** — `lead_id fk, when, source(calendar), status`.

### Finance
- **invoices** — `client_id fk, number, amount, tax, status(draft|sent|paid|overdue),
  due_date, paid_at, project`.
- **transactions** — `kind(income|expense), amount, category, ref, occurred_at`.

### Infrastruttura (il cuore scalabile)
- **events** — **event log immutabile** (append-only), la fonte di verità degli
  accadimenti. `type, source, entity_type, entity_id, payload jsonb,
  schema_version, occurred_at, dedup_key unique`.
- **job_queue** — la **coda durevole dei task** (vedi §3).
  `type, payload jsonb, status(pending|leased|done|failed|dead),
  priority int, run_after timestamptz, attempts int, max_attempts int,
  lease_until timestamptz, idempotency_key unique, rate_key text,
  last_error text`.
  Indici: `(status, run_after, priority)`, `(rate_key)`, `idempotency_key`.
- **rate_counters** — finestre di rate limiting per canale/account.
  `rate_key (es. email:gmail:acct1 / whatsapp:num1 / scrape:apify),
  window_start, count, limit_per_window`.
- **logs** — logging strutturato. `level, module, job_id, event_id, message,
  context jsonb, occurred_at`.
- **agents / agent_runs** — stato agenti e cronologia esecuzioni.

**Macchine a stati** (enforce via trigger/check):
- Lead: `new → verified → contacted → replied → meeting → quote → won|lost`
  (mai all'indietro, tranne `lost`).
- Job: `pending → leased → done | failed(→retry→pending) | dead`.
- Interaction: `queued → sent → delivered → opened → replied | bounced | error`.

**Scala**: indici sulle FK e sugli stati; partizionamento di `events` e
`interactions` per mese quando crescono; `job_queue` mantenuta piccola
(i job `done` archiviati). RLS attiva su tutto (single-tenant ora, multi-tenant
domani con `org_id`).

## 3. Eventi e Task Queue (il pezzo critico per non farsi bannare)

### Perché una coda in DB e non "n8n che chiama tutto"
Se n8n lanciasse le richieste in tempo reale, 100 lead → 100 email in pochi
secondi = ban Gmail/WhatsApp e IP scraper bloccati. Serve **disaccoppiare
l'intenzione dall'esecuzione**: i moduli **accodano** task, un **worker** li
esegue al ritmo consentito.

### Modello di coda (`job_queue` come queue transazionale)
Pattern **claim-based** su Postgres (robusto e semplice; in alternativa `pgmq`,
Redis+BullMQ o un broker — l'interfaccia resta identica):

```
-- CLAIM: un worker prende N job pronti, li "affitta" (lease) atomicamente
UPDATE job_queue SET status='leased', lease_until=now()+interval '2 min',
       attempts=attempts+1
WHERE id IN (
  SELECT id FROM job_queue
  WHERE status='pending' AND run_after<=now()
  ORDER BY priority DESC, run_after ASC
  FOR UPDATE SKIP LOCKED         -- niente due worker sullo stesso job
  LIMIT :batch
) RETURNING *;
```

- **`FOR UPDATE SKIP LOCKED`** → più worker n8n in parallelo senza conflitti.
- **Lease/visibility timeout** → se un worker muore, il job torna disponibile.
- **`run_after`** → **scheduling** dei follow-up (es. FU1 a +72h): basta accodare
  con `run_after = now()+72h`.
- **`idempotency_key`** → l'inserimento di un task duplicato viene ignorato
  (`on conflict do nothing`): niente doppi invii.

### Rate limiting (per canale/account, non globale)
Ogni job porta una **`rate_key`** (es. `email:gmail:acct1`, `whatsapp:num1`,
`scrape:apify`). Prima di eseguire, il worker fa un check **token-bucket** su
`rate_counters`:

```
-- consuma 1 token se disponibile nella finestra corrente; altrimenti rinvia
```
Se il bucket è pieno → il job **non** viene eseguito, viene **riprogrammato**
(`run_after = now()+backoff`) e il worker passa oltre. Limiti tipici:
Gmail ~gradуale (warm-up), WhatsApp secondo policy Meta, Apify secondo piano.
Il **warm-up** dei nuovi account è un rate limit crescente nel tempo.

### Trigger principali
- **Cron n8n** (es. ogni minuto): "poll della coda" → claim → esecuzione.
- **Supabase Realtime / DB webhook**: `INSERT` su `events` di un certo tipo →
  n8n reagisce (es. `lead.verified` → accoda job "genera audit").
- **Webhook esterni**: Resend/Twilio inviano callback (delivered/opened/replied)
  → n8n aggiorna `interactions` e, su `replied`, **ferma la sequenza**.
- **Scheduler**: i follow-up sono semplicemente job con `run_after` futuro.

### Concorrenza & backpressure
- Worker con **batch size** e **concorrenza** configurabili per tipo di job.
- Code separate logicamente per `type` (scraping vs email vs AI) così un picco di
  scraping non blocca gli invii.
- Priorità: `won`-follow-up > outreach nuovo > arricchimento.

## 4. API e comunicazione inter-modulo

**Contratto unico.** Ogni modulo espone un webhook `POST /modules/<name>/run`
che riceve un **envelope** standard e risponde accodando eventi/job, mai
chiamando direttamente il modulo dopo.

```json
{
  "event_id": "uuid",
  "type": "lead.verified",
  "schema_version": 1,
  "entity": { "type": "lead", "id": "uuid" },
  "payload": { "...campi del dominio..." },
  "idempotency_key": "lead.verified:uuid",
  "trace_id": "uuid"
}
```

**Catena d'esempio (B2B), tutta a eventi/coda — nessuna chiamata diretta:**
```
Lead Scout  --emette--> events(business.found)
   └─ trigger: accoda job {type: website.analyze, rate_key: scrape:firecrawl}
Website Analyzer --consuma job--> scrive websites{}, emette events(website.analyzed)
   └─ trigger: accoda job {type: audit.generate, rate_key: ai:claude}
AI Audit Agent --consuma job--> scrive audits{pdf_url}, emette events(audit.ready)
   └─ trigger: accoda job {type: outreach.enroll, sequence: web-audit}
Outreach Agent --consuma job--> crea interactions(queued), accoda invii con
   run_after e rate_key email/whatsapp; su reply-webhook ferma la sequenza.
```

**Sostituibilità (adapter).** Il Website Analyzer non "usa Firecrawl": usa
l'interfaccia `Scraper.analyze(url)`; l'implementazione è scelta da config
(`SCRAPER_PROVIDER=firecrawl|lighthouse|playwright`). Stesso per `EmailProvider`
(resend|gmail), `LLM` (claude|openai), `VideoGen` (higgsfield|veo|runway),
`Messenger` (twilio|whatsapp_cloud). Cambiare fornitore = cambiare una env +
un nodo n8n, zero impatto sugli altri moduli.

**Il Data-layer** espone solo lettura aggregata: viste SQL
(`v_pipeline`, `v_finance_kpi`, `v_outreach_stats`, `v_agent_perf`) e RPC
Postgres. La dashboard interroga quelle, con paginazione e cache, così regge
decine di migliaia di righe.

## 5. Gestione errori e logging

- **Retry con backoff esponenziale + jitter**: `attempts < max_attempts`,
  `run_after = now() + base * 2^attempts ± jitter`. Oltre il max → `status=dead`
  (**dead-letter**), niente loop infiniti.
- **Dead-letter queue**: i job `dead` restano ispezionabili e ritriggerabili a
  mano; un alert avvisa quando la DLQ cresce.
- **Circuit breaker per provider**: se un provider (es. Apify) fallisce N volte
  in una finestra, il breaker "apre" → i job di quel `rate_key` vengono rinviati
  invece di martellare il servizio; si richiude dopo un cooldown.
- **Idempotenza end-to-end**: `idempotency_key` sui job + `provider_message_id`
  sulle interazioni ⇒ un retry non manda due email.
- **Gestione scraper bloccati**: rotazione proxy/residential, gestione captcha,
  rilevazione "blocked/empty" → il job va in retry con provider alternativo
  (fallback adapter), non in errore secco.
- **Webhook mancanti**: i callback (delivered/opened) sono *best-effort*; lo stato
  non dipende solo da essi. Un job "reconcile" periodico ricontrolla gli invii
  senza callback dopo X ore.
- **Logging strutturato** in `logs` (level, module, job_id, event_id, trace_id,
  context) — ogni evento porta un `trace_id` che attraversa tutta la catena
  (Scout→Analyzer→Audit→Outreach) per il debug end-to-end.
- **Osservabilità/alert**: metriche dai contatori (job pending, DLQ size, tasso
  errori per provider, invii/giorno per account) → alert su soglie
  (es. bounce rate email > 3% ⇒ pausa automatica del canale).

## 6. Compliance & deliverability (non opzionale a questa scala)

- **Consenso e opt-out**: `leads.consent_status`, footer con STOP/unsubscribe,
  gestione automatica delle richieste di rimozione, soppressione globale.
- **WhatsApp**: richiede opt-in e template approvati Meta; il modulo Messenger
  rifiuta invii non conformi.
- **Deliverability email**: SPF/DKIM/DMARC sul dominio, warm-up progressivo,
  monitor bounce/spam, pausa automatica del canale oltre soglia.
- **GDPR**: base giuridica (legittimo interesse B2B), dati minimi, retention e
  cancellazione su richiesta.

## 7. Mapping sull'attuale Marea OS (come ci arriviamo dal codice esistente)

Oggi Marea OS (desktop) ha già: **modello a eventi** (`events.jsonl`), **store
derivato**, **API locale** (`/v1/events`) e un **motore Outreach reale** (SMTP +
sequenze + stop-on-reply + coda approvazioni). L'evoluzione enterprise è un
**re-hosting**, non una riscrittura:

| Oggi (locale, desktop) | Enterprise (scalabile) |
|---|---|
| `events.jsonl` su disco | tabella `events` in Supabase |
| store derivato in memoria | viste/RPC del Data-layer |
| API locale `/v1/events` | webhook + `job_queue` in Postgres |
| motore Outreach in Electron | modulo **Outreach Agent** in n8n + coda |
| agenti "concettuali" | moduli reali (Scout, Analyzer, Audit, …) |
| Marea OS = tutto | Marea OS = **Command/Dashboard layer** che legge il Data-layer |

Il modello di evento è **già** quello giusto (`type/source/payload`): basta
puntarlo a Supabase e spostare gli "agenti" da concetti a workflow n8n che
consumano la coda. La dashboard attuale diventa il pannello di comando che legge
le viste aggregate — e resta identica per l'utente.

## 8. Roadmap di implementazione consigliata

1. **Fondamenta**: schema Supabase (`events`, `job_queue`, `rate_counters`,
   `leads`, `interactions`) + worker n8n "claim/execute" con rate limiting.
2. **Lead Scout** (Apify/Google Maps) → popola `businesses`/`leads`. *(Primo
   modulo: è il carburante.)*
3. **Website Analyzer** (Firecrawl/Lighthouse) → `websites`.
4. **AI Audit Agent** (Claude) → `audits` + PDF.
5. **Outreach Agent** (Resend + WhatsApp) su coda con follow-up e stop-on-reply
   — porta qui la logica già scritta nel motore desktop.
6. **CRM/Finance/Data-layer**: viste e RPC per la dashboard.
7. **Airbnb Analyzer + Video AI**: secondo flusso, stessa spina dorsale.

Ogni modulo è indipendente e testabile da solo: si aggiunge senza toccare gli
altri, esattamente come richiesto.
