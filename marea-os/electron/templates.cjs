// ============================================================
// MAREA OS — Template email outreach
// Segnaposto: {{name}} {{sector}} {{city}} {{issue}} {{sender}}
// Personalizzabili dalle Impostazioni. Firma + unsubscribe inclusi
// per rispetto delle norme (GDPR / anti-spam).
// ============================================================

const DEFAULT_TEMPLATES = {
  initial: {
    subject: "Un'idea per {{name}}",
    body:
`Ciao,

ho dato un'occhiata alla presenza online di {{name}} a {{city}} e ho notato una cosa: {{issue}}.

Mi occupo di siti e presenza digitale per attività come la vostra qui in zona. In pochi giorni potrei mostrarvi una versione moderna e ottimizzata per smartphone, senza impegno.

Vi va se vi mando un paio di esempi?

Un saluto,
{{sender}}`,
  },
  followup1: {
    subject: "Re: Un'idea per {{name}}",
    body:
`Ciao,

torno un attimo sul mio messaggio: so che siete impegnati con {{sector}}.

Se preferite, vi preparo direttamente una bozza gratuita così vedete il risultato concreto. Bastano due righe di risposta.

{{sender}}`,
  },
  followup2: {
    subject: "Re: Un'idea per {{name}}",
    body:
`Ciao,

ultimo pensiero: oggi la maggior parte dei clienti cerca su Google prima di venire. Una presenza curata fa davvero la differenza per {{name}}.

Se il momento non è giusto nessun problema, mi fermo qui. Se invece siete curiosi, rispondete pure.

{{sender}}`,
  },
  last: {
    subject: "Chiudo il cerchio — {{name}}",
    body:
`Ciao,

non voglio disturbare oltre: questo è il mio ultimo messaggio.

Se in futuro vorrete rivedere il sito o la presenza online di {{name}}, sapete dove trovarmi.

In bocca al lupo,
{{sender}}`,
  },
};

// Ordine della sequenza + ritardo (giorni) dal passo precedente
const SEQUENCE = [
  { key: "initial",   delayDays: 0 },
  { key: "followup1", delayDays: 2 },
  { key: "followup2", delayDays: 3 },
  { key: "last",      delayDays: 4 },
];

function render(str, vars) {
  return String(str || "").replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null && vars[k] !== "" ? vars[k] : "").toString());
}

function compose(templates, key, vars, senderName) {
  const t = (templates && templates[key]) || DEFAULT_TEMPLATES[key];
  const v = { ...vars, sender: senderName || vars.sender || "Marea Creative" };
  const bodyText = render(t.body, v);
  const footer = `\n\n—\nRicevi questa email perché la tua attività è un potenziale contatto commerciale. Se non vuoi più essere contattato, rispondi "STOP" e verrai rimosso.`;
  return { subject: render(t.subject, v), text: bodyText + footer };
}

module.exports = { DEFAULT_TEMPLATES, SEQUENCE, render, compose };
