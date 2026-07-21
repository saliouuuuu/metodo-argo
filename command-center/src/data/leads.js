/* ============================================================
   Leads — sorgente dati dal Google Sheet popolato da n8n/Apify.
   Nessun terminale: il foglio va "Pubblicato sul web" come CSV,
   il browser lo legge direttamente. Config salvata in localStorage.
   ============================================================ */
const KEY = "cc_leads_sheet_url";

export const getSheetUrl = () => localStorage.getItem(KEY) || "";
export const setSheetUrl = (url) => localStorage.setItem(KEY, url.trim());

/* Parser CSV minimale ma robusto (gestisce virgolette e newline nei campi). */
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => x !== ""));
}

/* Mappa gli header comuni (n8n / Apify) verso i nostri campi. */
const MAP = {
  name: ["name", "nome", "title", "attivita", "attività", "business"],
  category: ["category", "categoria", "categoryname", "settore"],
  city: ["city", "citta", "città", "location", "località"],
  website: ["website", "sito", "url"],
  phone: ["phone", "telefono", "tel"],
  email: ["email", "mail", "e-mail"],
  status: ["status", "stato"],
  date: ["date", "data"],
};
function pick(headerRow) {
  const h = headerRow.map((x) => x.trim().toLowerCase());
  const idx = {};
  for (const [field, names] of Object.entries(MAP)) {
    const i = h.findIndex((x) => names.includes(x));
    if (i >= 0) idx[field] = i;
  }
  return idx;
}

/** Scarica e normalizza i lead dal foglio pubblicato come CSV. */
export async function fetchLeads(url) {
  if (!url) return { ok: false, error: "no-url", leads: [] };
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const rows = parseCSV(await res.text());
  if (rows.length < 2) return { ok: true, leads: [] };
  const idx = pick(rows[0]);
  const leads = rows.slice(1).map((r, i) => {
    const g = (f) => (idx[f] != null ? (r[idx[f]] || "").trim() : "");
    return {
      id: i,
      name: g("name") || "Attività senza nome",
      category: g("category"), city: g("city"),
      website: g("website"), phone: g("phone"), email: g("email"),
      status: g("status"), date: g("date"),
      hasSite: !!g("website"),
    };
  });
  return { ok: true, leads };
}
