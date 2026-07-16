// ============================================================
// MAREA OS — Preload: ponte sicuro renderer ↔ main
// Espone solo le API dati necessarie (contextIsolation attivo,
// nessun accesso Node dal renderer).
// ============================================================
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("marea", {
  bootstrap: () => ipcRenderer.invoke("marea:bootstrap"),
  addEvent: (evt) => ipcRenderer.invoke("marea:addEvent", evt),
  setAgent: (agentId, patch) => ipcRenderer.invoke("marea:setAgent", agentId, patch),
  setSetting: (key, value) => ipcRenderer.invoke("marea:setSetting", key, value),
  onEvent: (cb) => {
    const listener = (_e, evt) => cb(evt);
    ipcRenderer.on("marea:event", listener);
    return () => ipcRenderer.removeListener("marea:event", listener);
  },
});
