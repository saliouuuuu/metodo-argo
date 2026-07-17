// ============================================================
// MAREA OS — Motore Outreach (automazione reale)
// Invia email vere via SMTP, gestisce le sequenze di follow-up,
// si ferma quando arriva una risposta, rispetta il limite
// giornaliero e la modalità (manuale / approvazione / automatico).
// Ogni invio scrive un evento reale nello store → tutta la
// dashboard si aggiorna insieme.
// ============================================================
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mailer = require("./mailer.cjs");
const { SEQUENCE, compose } = require("./templates.cjs");

const DAY = 86400000;
const today = () => new Date().toISOString().slice(0, 10);

const DEFAULT_CONFIG = {
  enabled: false,          // interruttore generale del motore
  mode: "approval",        // manual | approval | auto
  dailyLimit: 40,
  senderName: "Marea Creative",
  fromEmail: "",
  smtp: { host: "", port: 587, user: "", pass: "" },
  templates: null,         // null = usa i default
};

class Outreach {
  constructor(store, broadcast) {
    this.store = store;
    this.broadcast = broadcast || (() => {});
    this.file = path.join(store.dir, "outreach-state.json");
    this.state = this._load();
    if (!store.config.outreach) { store.config.outreach = { ...DEFAULT_CONFIG }; store._saveConfig(); }
    this.timer = setInterval(() => this.tick().catch((e) => console.error("outreach tick:", e.message)), 60 * 1000);
    setTimeout(() => this.tick().catch(() => {}), 4000);
  }

  _load() {
    try { return JSON.parse(fs.readFileSync(this.file, "utf8")); }
    catch { return { seq: {}, drafts: [], sentDay: today(), sentToday: 0 }; }
  }
  _save() { try { fs.writeFileSync(this.file, JSON.stringify(this.state, null, 2)); } catch {} }

  config() { return { ...DEFAULT_CONFIG, ...(this.store.config.outreach || {}) }; }
  setConfig(patch) {
    this.store.config.outreach = { ...this.config(), ...patch,
      smtp: { ...this.config().smtp, ...(patch.smtp || {}) } };
    this.store._saveConfig();
    this.broadcast({ type: "outreach.status" });
    return this.status();
  }

  async verifySmtp() { return mailer.verify(this.config().smtp); }

  _rollDay() { const d = today(); if (this.state.sentDay !== d) { this.state.sentDay = d; this.state.sentToday = 0; } }
  _repliedSet() {
    const s = new Set();
    for (const e of this.store.readEvents()) if (e.type === "email.replied" && e.data?.leadId) s.add(e.data.leadId);
    return s;
  }
  _vars(lead) { return { name: lead.name, city: lead.location || lead.city || "", sector: lead.sector || "", issue: lead.issues || lead.issue || "l'assenza di un sito curato" }; }

  /* Avvia la sequenza su un lead (serve un'email). */
  startSequence(lead) {
    if (!lead || !lead.email) return { ok: false, error: "Il lead non ha un'email" };
    const id = lead.leadId || lead.id;
    if (this.state.seq[id] && this.state.seq[id].status === "active") return { ok: true, already: true };
    this.state.seq[id] = {
      leadId: id, name: lead.name, email: lead.email,
      sector: lead.sector || "", location: lead.location || "", issues: lead.issues || "",
      step: 0, nextDue: Date.now(), status: "active", startedAt: new Date().toISOString(),
    };
    this._save(); this.broadcast({ type: "outreach.status" });
    return { ok: true };
  }
  startBulk(leads) {
    let n = 0;
    for (const l of leads || []) if (l.email && this.startSequence(l).ok && !this.state.seq[l.leadId || l.id]?.already) n++;
    return { ok: true, started: n };
  }
  stopSequence(leadId) { if (this.state.seq[leadId]) { this.state.seq[leadId].status = "stopped"; this._save(); this.broadcast({ type: "outreach.status" }); } return { ok: true }; }

  /* Invio reale + evento nello store. */
  async _deliver(seqLead, stepKey) {
    const cfg = this.config();
    const from = cfg.fromEmail ? `${cfg.senderName} <${cfg.fromEmail}>` : cfg.smtp.user;
    const { subject, text } = compose(cfg.templates, stepKey, this._vars(seqLead), cfg.senderName);
    const emailId = "mail_" + crypto.randomBytes(4).toString("hex");
    try {
      await mailer.send(cfg.smtp, { from, to: seqLead.email, subject, text });
      this._rollDay(); this.state.sentToday++;
      const evt = this.store.addEvent({ type: "email.sent", data: { emailId, leadId: seqLead.leadId, leadName: seqLead.name, subject } }, "outreach");
      this.broadcast(evt);
      const del = this.store.addEvent({ type: "email.delivered", data: { emailId } }, "outreach");
      this.broadcast(del);
      return { ok: true, emailId };
    } catch (e) {
      const evt = this.store.addEvent({ type: "email.error", data: { emailId, leadId: seqLead.leadId, leadName: seqLead.name, error: e.message } }, "outreach");
      this.broadcast(evt);
      return { ok: false, error: e.message };
    }
  }

  _advance(seqLead) {
    seqLead.step++;
    if (seqLead.step >= SEQUENCE.length) { seqLead.status = "completed"; seqLead.nextDue = null; }
    else seqLead.nextDue = Date.now() + (SEQUENCE[seqLead.step].delayDays || 1) * DAY;
  }

  /* Invio manuale immediato a un lead (una email singola). */
  async sendNow(lead, custom) {
    const cfg = this.config();
    if (!mailer.available() || !cfg.smtp.host) return { ok: false, error: "Configura prima l'SMTP nelle Impostazioni" };
    const from = cfg.fromEmail ? `${cfg.senderName} <${cfg.fromEmail}>` : cfg.smtp.user;
    const composed = custom?.subject ? { subject: custom.subject, text: custom.body }
      : compose(cfg.templates, "initial", this._vars(lead), cfg.senderName);
    const emailId = "mail_" + crypto.randomBytes(4).toString("hex");
    try {
      await mailer.send(cfg.smtp, { from, to: lead.email, subject: composed.subject, text: composed.text });
      this._rollDay(); this.state.sentToday++; this._save();
      const evt = this.store.addEvent({ type: "email.sent", data: { emailId, leadId: lead.leadId || lead.id, leadName: lead.name, subject: composed.subject } }, "outreach");
      this.broadcast(evt);
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  /* Approvazione di una bozza in coda. */
  async approve(draftId) {
    const i = this.state.drafts.findIndex((d) => d.id === draftId);
    if (i < 0) return { ok: false };
    const d = this.state.drafts[i];
    const seqLead = this.state.seq[d.leadId];
    const res = await this._deliver(seqLead || d, SEQUENCE[d.step].key);
    this.state.drafts.splice(i, 1);
    if (res.ok && seqLead) this._advance(seqLead);
    this._save(); this.broadcast({ type: "outreach.status" });
    return res;
  }
  discard(draftId, stopSeq) {
    const d = this.state.drafts.find((x) => x.id === draftId);
    this.state.drafts = this.state.drafts.filter((x) => x.id !== draftId);
    if (d && stopSeq && this.state.seq[d.leadId]) this.state.seq[d.leadId].status = "stopped";
    else if (d && this.state.seq[d.leadId]) this._advance(this.state.seq[d.leadId]); // salta questo passo
    this._save(); this.broadcast({ type: "outreach.status" });
    return { ok: true };
  }

  async tick() {
    this._rollDay();
    const cfg = this.config();
    const replied = this._repliedSet();
    let changed = false;

    for (const id of Object.keys(this.state.seq)) {
      const s = this.state.seq[id];
      if (s.status !== "active") continue;
      if (replied.has(id)) { s.status = "replied"; changed = true; continue; } // stop-on-reply
      if (s.step >= SEQUENCE.length) { s.status = "completed"; changed = true; continue; }
      if (!s.nextDue || s.nextDue > Date.now()) continue;
      if (!cfg.enabled) continue;
      if (this.state.sentToday >= cfg.dailyLimit) continue;
      if (cfg.mode === "auto") {
        const res = await this._deliver(s, SEQUENCE[s.step].key);
        if (res.ok) this._advance(s);
        else s.nextDue = Date.now() + 6 * 3600000; // riprova tra 6h
        changed = true;
      } else if (cfg.mode === "approval") {
        const exists = this.state.drafts.some((d) => d.leadId === id && d.step === s.step);
        if (!exists) {
          const { subject, text } = compose(cfg.templates, SEQUENCE[s.step].key, this._vars(s), cfg.senderName);
          this.state.drafts.push({ id: "draft_" + crypto.randomBytes(4).toString("hex"), leadId: id, name: s.name, to: s.email, step: s.step, stepLabel: SEQUENCE[s.step].key, subject, body: text, ts: new Date().toISOString() });
          s.nextDue = null; // in attesa di approvazione
          changed = true;
        }
      }
      // mode 'manual' → nessuna azione automatica
    }
    if (changed) this._save();
    this.broadcast({ type: "outreach.status" });
  }

  status() {
    const cfg = this.config();
    const seq = Object.values(this.state.seq);
    return {
      enabled: cfg.enabled, mode: cfg.mode, dailyLimit: cfg.dailyLimit,
      sentToday: this.state.sentToday,
      smtpReady: mailer.available() && !!cfg.smtp.host && !!cfg.smtp.user,
      senderName: cfg.senderName, fromEmail: cfg.fromEmail, smtp: { ...cfg.smtp, pass: cfg.smtp.pass ? "••••••" : "" },
      active: seq.filter((s) => s.status === "active").length,
      replied: seq.filter((s) => s.status === "replied").length,
      completed: seq.filter((s) => s.status === "completed").length,
      drafts: this.state.drafts,
      sequences: seq.slice(-60).reverse(),
    };
  }
}

module.exports = { Outreach, DEFAULT_CONFIG };
