/* ============================================================
   Apify — motore di lead scraping REALE, direttamente dal browser.
   Nessun n8n, nessun Google Sheet. Il browser parla con Apify:
     1. avvia il run dell'attore Google Maps
     2. fa polling dello stato
     3. legge i risultati dal dataset
   Apify espone CORS (*), quindi funziona da localhost e da sito.
   Il token si salva in locale (solo sul tuo dispositivo).
   ============================================================ */
import SEED from "./seed_leads.json";

const TOKEN_KEY = "cc_apify_token";
const CACHE_KEY = "cc_leads_cache";
const ACTOR = "compass~crawler-google-places";
const API = "https://api.apify.com/v2";

export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, (t || "").trim());

/* 475 lead veri della zona di Cuneo già inclusi: appaiono al primo
   avvio anche senza token. Il token serve solo per cercarne di nuovi. */
export { SEED };
export const getCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) || [];
  } catch {}
  return SEED;
};
export const setCache = (leads) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(leads)); } catch {} };

/* Zona Cuneo di default — modificabili dall'utente. */
export const DEFAULT_CITIES = ["Cuneo", "Fossano", "Alba", "Savigliano", "Bra", "Mondovì", "Saluzzo", "Cherasco"];
export const DEFAULT_CATEGORIES = ["parrucchiere", "estetista", "ristorante", "bar", "idraulico", "elettricista", "officina", "palestra"];

/* Numero di cellulare italiano = probabile numero personale/diretto. */
export function isMobileIT(phone = "") {
  const d = phone.replace(/[^\d]/g, "").replace(/^0039/, "").replace(/^39/, "");
  return /^3\d{8,9}$/.test(d);
}

function normalize(item, i) {
  const phone = (item.phone || item.phoneUnformatted || "").trim();
  const website = (item.website || "").trim();
  const hasSite = !!website && !/facebook\.com|instagram\.com/i.test(website);
  return {
    id: item.placeId || item.url || `${item.title}-${i}`,
    name: item.title || "Attività senza nome",
    category: item.categoryName || "",
    city: item.city || "",
    address: item.street || item.address || "",
    phone,
    website,
    maps: item.url || "",
    score: item.totalScore || null,
    hasSite,
    mobile: isMobileIT(phone),
    hot: !hasSite && !!phone,        // senza sito + telefono = da chiamare
  };
}

async function jsonFetch(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) {
    let msg = "HTTP " + r.status;
    try { const e = await r.json(); if (e?.error?.message) msg = e.error.message; } catch {}
    if (r.status === 401) msg = "Token Apify non valido. Controlla e reincollalo.";
    throw new Error(msg);
  }
  return r.json();
}

/* Avvia il run. searchStringsArray = ogni categoria × ogni città. */
async function startRun(token, { categories, cities, maxPerSearch }) {
  const searchStringsArray = [];
  for (const cat of categories) for (const city of cities) searchStringsArray.push(`${cat} ${city}`);
  const body = {
    searchStringsArray,
    maxCrawledPlacesPerSearch: Math.max(1, Math.min(50, maxPerSearch || 20)),
    language: "it",
    skipClosedPlaces: true,
  };
  const data = await jsonFetch(`${API}/acts/${ACTOR}/runs?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { runId: data.data.id, datasetId: data.data.defaultDatasetId, searches: searchStringsArray.length };
}

const FIELDS = "title,categoryName,city,street,address,phone,phoneUnformatted,website,url,placeId,totalScore";

async function fetchItems(token, datasetId) {
  const data = await jsonFetch(`${API}/datasets/${datasetId}/items?token=${encodeURIComponent(token)}&clean=true&fields=${FIELDS}`);
  return Array.isArray(data) ? data : [];
}

async function getRunStatus(token, runId) {
  const data = await jsonFetch(`${API}/actor-runs/${runId}?token=${encodeURIComponent(token)}`);
  return data.data.status; // READY, RUNNING, SUCCEEDED, FAILED, ...
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Esegue lo scraping completo con progressi.
 * onProgress({ phase, found, searches, done, total }) viene chiamato durante.
 * Ritorna { leads } normalizzati e deduplicati.
 */
export async function runScrape(token, opts, onProgress = () => {}) {
  onProgress({ phase: "start" });
  const { runId, datasetId, searches } = await startRun(token, opts);
  onProgress({ phase: "running", found: 0, searches });

  const started = Date.now();
  const MAX_MS = 6 * 60 * 1000; // stop di sicurezza a 6 min
  let status = "RUNNING";
  while (Date.now() - started < MAX_MS) {
    await sleep(3000);
    status = await getRunStatus(token, runId);
    let found = 0;
    try { found = (await fetchItems(token, datasetId)).length; } catch {}
    onProgress({ phase: "running", found, searches });
    if (status === "SUCCEEDED" || status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") break;
  }

  const items = await fetchItems(token, datasetId);
  const seen = new Set();
  const leads = [];
  items.map(normalize).forEach((l) => {
    const key = (l.name + l.city + l.phone).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key); leads.push(l);
  });
  // hot prima, poi senza sito, poi il resto
  leads.sort((a, b) => (b.hot - a.hot) || (!a.hasSite - !b.hasSite) || (b.score || 0) - (a.score || 0));
  setCache(leads);
  onProgress({ phase: "done", found: leads.length, status });
  return { leads, status };
}
