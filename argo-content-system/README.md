# Argo Content System 🎬🐾

Sistema semi-autonomo per i contenuti TikTok del Metodo Argo: 2 video al
giorno, dalla scelta dell'argomento al kit di pubblicazione, con controllo
qualità automatico, storico anti-duplicazione e ottimizzazione basata sulle
performance.

> **Analisi delle vie di pubblicazione e raccomandazione:** vedi
> `docs/pubblicazione-tiktok.md`. Strategia attuale: **semi-auto** — il
> sistema prepara e controlla tutto, tu carichi il kit sullo scheduler
> nativo di TikTok (2-3 minuti a video). A regime: Metricool o Content
> Posting API (adapter previsti).

## Il flusso quotidiano

```
Tu (in una sessione Claude): «Gestisci i contenuti di oggi»
        │
        ▼
1  plan-day      → il motore sceglie 2 categorie (mix 60/20/10/10,
                   rotazione anti-ripetizione, punteggi performance)
2  Claude compila i 2 package.json (idea, hook, script, voice-over,
   scene con prompt AI, caption, hashtag) usando prompts/ e lo storico
3  register      → validazione: hook vietati, parole vietate, durata,
                   caption, similarità con lo storico
4  Produzione    → [UMANO oggi] generi le scene con i prompt del pacchetto
                   (Higgsfield/riprese) e registri/generi il voice-over;
                   montaggio ffmpeg assistito da Claude
5  check-video   → QC automatico: 9:16, risoluzione, durata 15-45s,
                   audio, loudness −14 LUFS, frame neri, dimensione,
                   caption e hashtag presenti → qc-report.json
6  approve       → [UMANO] guardi l'anteprima e approvi
7  publish-kit   → cartella scheduled/<id>/ con final.mp4 + caption.txt
                   + checklist con orario
8  [UMANO] carichi su TikTok (scheduler web) → mark-published --url
9  import-analytics + weekly-report → i punteggi aggiornano plan-day
```

## Comandi

```bash
cd argo-content-system
python3 automation/argo.py init                       # prima volta
python3 automation/argo.py plan-day [--date AAAA-MM-GG]
python3 automation/argo.py register <id>
python3 automation/argo.py check-video <id> --file <mp4>
python3 automation/argo.py approve <id> | skip <id>
python3 automation/argo.py publish-kit <id>
python3 automation/argo.py mark-published <id> --url <link>
python3 automation/argo.py show [--date|--id] | queue | history [--category]
python3 automation/argo.py import-analytics <csv>
python3 automation/argo.py weekly-report
```

Stati: `ideation → ready_for_production → produced → qc_passed → approved
→ scheduled → published` (+ `failed`, `skipped`).

## Struttura

```
config/config.json     tutte le impostazioni (slot, mix, vincoli, percorsi)
.env.example           chiavi per adapter futuri (mai nel codice)
brand/brand.md         voce di Argo + guardrail non negoziabili
editorial/categories.json  27 categorie, pilastri, pesi, pattern di hook
prompts/               istruzioni operative per la generazione in sessione
content/<id>/          package.json + assets + qc-report per ogni video
scheduled/<id>/        publishing kit pronti per l'upload
analytics/             CSV di import + report settimanali
database/argo.db       storico completo (SQLite)
automation/argo.py     il CLI (solo stdlib + ffmpeg)
logs/                  log giornalieri
```

## Cosa richiede il tuo intervento (oggi)

1. **Attiva l'account creator** su TikTok (per lo scheduler web).
2. **Produzione scene**: generi i filmati con i prompt del pacchetto
   (Higgsfield) finché non colleghiamo un adapter API.
3. **Voice-over**: voce tua o TTS esterno (adapter ElevenLabs predisposto:
   basta la chiave in `.env` quando vorrai attivarlo — Milestone 3).
4. **Upload finale** su TikTok dal kit (finché non attiviamo Metricool/API).
5. **Analytics**: esporta/da TikTok o compila il CSV (modello incluso)
   una volta a settimana.

## Requisiti ambiente

Python 3.10+ e ffmpeg (`apt-get install -y ffmpeg`). In sessione cloud
l'installazione di ffmpeg va rifatta a ogni nuovo container (documentato
qui apposta).

## Stato milestone

- [x] **M1** — architettura, config, database, storico, motore editoriale,
      validazione, QC video, kit, analytics, report (testato end-to-end)
- [ ] M2 — generazione quotidiana dei 2 pacchetti a regime (già operativa
      via sessione Claude; da rodare 3-4 giorni)
- [ ] M3 — pipeline di montaggio demo completa (sottotitoli automatici,
      testi a schermo, TTS adapter)
- [ ] M4 — flusso di approvazione con anteprime (dashboard minimale)
- [ ] M5 — collegamento publisher (Metricool → API ufficiale)
- [ ] M6 — programmazione multi-giorno e promemoria
- [ ] M7 — analytics automatizzate e ottimizzazione continua

## Nota su scheduler e "computer acceso"

Questo ambiente è un container cloud effimero: non può restare acceso ad
aspettare gli orari di pubblicazione. Per questo la strategia è
**preparazione + programmazione** (lo scheduler di TikTok pubblica lui
all'orario giusto) invece di un demone che deve vivere 24/7. Quando
attiveremo Metricool/API, la programmazione multi-giorno renderà il
sistema ancora più autonomo senza alcuna macchina sempre accesa.
