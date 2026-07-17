// ============================================================
// MAREA OS — Mailer (SMTP reale via nodemailer)
// Funziona con qualsiasi provider SMTP: Gmail (app password),
// Brevo, Resend, Mailgun, SMTP del proprio dominio, ecc.
// ============================================================
let nodemailer = null;
try { nodemailer = require("nodemailer"); } catch { /* installato con le deps dell'app */ }

function transport(smtp) {
  if (!nodemailer) throw new Error("nodemailer non disponibile");
  if (!smtp || !smtp.host || !smtp.user) throw new Error("SMTP non configurato");
  const port = Number(smtp.port) || 587;
  return nodemailer.createTransport({
    host: smtp.host,
    port,
    secure: port === 465, // 465 = SSL, 587/25 = STARTTLS
    auth: { user: smtp.user, pass: smtp.pass },
  });
}

async function verify(smtp) {
  try { await transport(smtp).verify(); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
}

async function send(smtp, { from, to, subject, text, html }) {
  const info = await transport(smtp).sendMail({ from, to, subject, text, html });
  return { ok: true, messageId: info.messageId, accepted: info.accepted || [] };
}

module.exports = { verify, send, available: () => !!nodemailer };
