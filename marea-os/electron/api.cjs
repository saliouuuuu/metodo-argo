// ============================================================
// MAREA OS — API locale per gli agenti
// Server HTTP solo su 127.0.0.1: gli agenti (n8n, Make, script)
// spingono eventi qui e Marea OS si aggiorna in tempo reale.
//   GET  /health              → stato
//   POST /v1/events           → { type, data, agent? }  (Bearer token)
// ============================================================
const http = require("http");

function startApi(store, onEvent) {
  const port = store.config.apiPort || 41100;
  const token = store.config.apiToken;

  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");

    if (req.method === "GET" && req.url === "/health") {
      res.end(JSON.stringify({ ok: true, app: "marea-os", version: 2 }));
      return;
    }

    if (req.method === "POST" && req.url === "/v1/events") {
      const auth = req.headers.authorization || "";
      if (auth !== `Bearer ${token}`) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: "Token mancante o non valido" }));
        return;
      }
      let body = "";
      req.on("data", (c) => { body += c; if (body.length > 256 * 1024) req.destroy(); });
      req.on("end", () => {
        try {
          const payload = JSON.parse(body || "{}");
          const items = Array.isArray(payload) ? payload : [payload];
          const saved = items.map((p) => {
            const evt = store.addEvent(p, p.agent || "api");
            onEvent(evt);
            return evt.id;
          });
          res.end(JSON.stringify({ ok: true, saved }));
        } catch (err) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Not found" }));
  });

  server.on("error", (err) => {
    console.error("marea-api:", err.message);
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Marea OS API → http://127.0.0.1:${port}`);
  });
  return server;
}

module.exports = { startApi };
