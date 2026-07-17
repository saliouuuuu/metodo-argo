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
  outreach: {
    status: () => ipcRenderer.invoke("outreach:status"),
    setConfig: (p) => ipcRenderer.invoke("outreach:setConfig", p),
    verify: () => ipcRenderer.invoke("outreach:verify"),
    sendNow: (lead, custom) => ipcRenderer.invoke("outreach:sendNow", lead, custom),
    start: (lead) => ipcRenderer.invoke("outreach:start", lead),
    startBulk: (leads) => ipcRenderer.invoke("outreach:startBulk", leads),
    stop: (id) => ipcRenderer.invoke("outreach:stop", id),
    approve: (id) => ipcRenderer.invoke("outreach:approve", id),
    discard: (id, stop) => ipcRenderer.invoke("outreach:discard", id, stop),
    onStatus: (cb) => {
      const listener = (_e, st) => cb(st);
      ipcRenderer.on("marea:outreach", listener);
      return () => ipcRenderer.removeListener("marea:outreach", listener);
    },
  },
});
