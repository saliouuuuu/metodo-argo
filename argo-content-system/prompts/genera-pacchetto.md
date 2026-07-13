# Prompt operativo — generazione pacchetto video (usato da Claude in sessione)

Quando l'utente dice «gestisci i contenuti di oggi» (o simili):

1. Esegui `python3 automation/argo.py plan-day` (se non già fatto per oggi):
   crea i 2 slot con categoria assegnata dal motore di rotazione.
2. Per ogni slot, leggi la cartella `content/<id>/package.json` e compila
   TUTTI i campi mancanti rispettando `brand/brand.md` e i vincoli di
   `config/config.json`. Prima di scrivere, esegui
   `python3 automation/argo.py history --category <cat>` e NON riutilizzare
   hook o angoli già usati.
3. Il pacchetto deve contenere:
   - **idea** (1 frase), **obiettivo**, **target specifico**
   - **hook** (prime parole pronunciate/mostrate, 1-2s, regole brand)
   - **script** completo con timestamp indicativi (15-45s totali)
   - **voiceover** (testo pulito da leggere/registrare)
   - **scene**: lista shot con inquadratura + durata + prompt AI (inglese,
     stile: candid smartphone, natural light, italian home/park, no text,
     no watermark, correct dog anatomy) oppure riferimento ad asset esistente
   - **testi_a_schermo** (max 6 parole a card) e **sottotitoli** (= voiceover)
   - **caption** (max 3 righe) + **cta** + **hashtag** (3-5)
   - **durata_prevista_s**, **orario_slot**
4. Valida e registra: `python3 automation/argo.py register <id>`
   (il comando blocca hook vietati, parole vietate, duplicati, caption lunghe).
5. Mostra all'utente il riepilogo dei 2 pacchetti e fermati: la produzione
   video (Higgsfield/riprese) e il voice-over sono passaggi umani finché
   gli adapter non sono collegati.

Dopo la produzione: `check-video <id> --file <mp4>` → se QC ok → `approve`
→ `publish-kit` → l'utente carica sullo scheduler TikTok → `mark-published
<id> --url <link>`.
