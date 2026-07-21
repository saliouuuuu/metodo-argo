# CEO Command Center — V1

Cockpit personale di Saliou in stile **Apple** (nero neutro `#0B0B0F`, un solo
accento **viola** `#8B5CF6`, superfici in vetro/blur, Inter). Scope volutamente
ristretto: solo **Today / Focus** e **Business Overview**. Le altre sezioni
(Projects, Systems Map, Idea Vault, Tool Library, KPI/Finance, Opportunity Radar)
sono in sidebar come **"Soon"**, disattivate — si costruiranno in V2.

> Regola anti-distrazione: niente KPI/dashboard complesse in V1. Ciò che esce
> dai 2 moduli va nella **Quick Capture Inbox**.

## Pagine
- **Today / Focus** — data + saluto, **Main Focus** (un solo business in
  evidenza), Priority Tasks (max 5), Routine (2 video + outreach), Follow-up,
  Quick Capture Inbox. Niente grafici: qui si *decide*, non si analizza.
- **Business Overview** — una card per progetto (status dot, obiettivo in una
  riga, un KPI, ultimo aggiornamento), raggruppate per Attivo / In costruzione /
  Standby / Futuro.

## Dati
Stato basato sullo `state.json` della spec, persistito in `localStorage`
(`ceo_cc_v1`). Modificabile da UI (task, routine, follow-up, inbox).

## Avvio
```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # build statica in dist/
```

## Rapporto con Marea OS
Marea OS (la dashboard agenzia ricca) resta nel repo come **layer V2**: è la
sostanza dietro le voci "Soon" (KPI/Finance, Systems Map…). Il Command Center V1
è la porta d'ingresso minimale e quotidiana. L'integrazione n8n alimenta pochi
segnali di V1 (routine outreach, follow-up, un KPI per business) — vedi
`../marea-os/ARCHITECTURE.md`.
