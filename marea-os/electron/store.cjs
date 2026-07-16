// ============================================================
// MAREA OS — Store persistente (processo principale)
// Gli eventi REALI si accodano in events.jsonl (append-only);
// config e stato agenti in config.json. Tutto in userData:
// i dati restano sul computer dell'utente.
// I dati DEMO non passano mai di qui.
// ============================================================
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const VALID_TYPES = new Set([
  "lead.found", "lead.verified", "lead.contacted",
  "email.sent", "email.delivered", "email.opened", "email.replied", "email.error",
  "call.made", "followup.created", "followup.done",
  "meeting.scheduled", "quote.sent", "client.won", "client.lost",
  "finance.income", "finance.expense",
  "task.created", "task.done",
  "agent.status", "agent.log", "agent.error",
]);

class Store {
  constructor(dir) {
    this.dir = dir;
    fs.mkdirSync(dir, { recursive: true });
    this.eventsFile = path.join(dir, "events.jsonl");
    this.configFile = path.join(dir, "config.json");
    this.config = this._loadConfig();
  }

  _loadConfig() {
    try {
      return JSON.parse(fs.readFileSync(this.configFile, "utf8"));
    } catch {
      const cfg = {
        apiPort: 41100,
        apiToken: crypto.randomBytes(24).toString("hex"),
        agents: {},
        settings: { sound: false, revenueGoal: 5000 },
      };
      this._saveConfig(cfg);
      return cfg;
    }
  }
  _saveConfig(cfg = this.config) {
    fs.writeFileSync(this.configFile, JSON.stringify(cfg, null, 2));
  }

  readEvents() {
    try {
      return fs.readFileSync(this.eventsFile, "utf8")
        .split("\n").filter(Boolean)
        .map((l) => { try { return JSON.parse(l); } catch { return null; } })
        .filter(Boolean);
    } catch { return []; }
  }

  /** Valida, arricchisce e persiste un evento reale. */
  addEvent(raw, source) {
    const type = String(raw?.type || "");
    if (!VALID_TYPES.has(type)) throw new Error(`Tipo evento non valido: ${type}`);
    const evt = {
      id: raw.id || `evt_${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`,
      ts: raw.ts && !Number.isNaN(Date.parse(raw.ts)) ? new Date(raw.ts).toISOString() : new Date().toISOString(),
      type,
      source: source || raw.source || "api",
      demo: false, // qui passano SOLO dati reali
      data: raw.data && typeof raw.data === "object" ? raw.data : {},
    };
    fs.appendFileSync(this.eventsFile, JSON.stringify(evt) + "\n");
    return evt;
  }

  setAgent(agentId, patch) {
    this.config.agents[agentId] = { ...(this.config.agents[agentId] || {}), ...patch };
    this._saveConfig();
    return this.config.agents[agentId];
  }

  setSetting(key, value) {
    this.config.settings[key] = value;
    this._saveConfig();
  }
}

module.exports = { Store, VALID_TYPES };
