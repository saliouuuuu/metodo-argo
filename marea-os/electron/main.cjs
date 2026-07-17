// ============================================================
// MAREA OS — Processo principale Electron
// Finestra + store persistente + API locale per gli agenti.
// In sviluppo carica il dev server Vite (ELECTRON_START_URL),
// in produzione la build in dist/.
// ============================================================
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const { Store } = require("./store.cjs");
const { startApi } = require("./api.cjs");
const { Outreach } = require("./outreach.cjs");

let win = null;
let store = null;
let outreach = null;

function broadcast(evt) {
  if (!win || win.isDestroyed()) return;
  if (evt && evt.type === "outreach.status") {
    win.webContents.send("marea:outreach", outreach ? outreach.status() : null);
  } else {
    win.webContents.send("marea:event", evt);
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1120,
    minHeight: 700,
    backgroundColor: "#000000",
    title: "Marea OS",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(path.join(__dirname, "..", "dist", "index.html"));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  store = new Store(path.join(app.getPath("userData"), "data"));

  // ---- IPC verso il renderer ----
  ipcMain.handle("marea:bootstrap", () => ({
    events: store.readEvents(),
    agents: store.config.agents,
    settings: store.config.settings,
    api: { port: store.config.apiPort, token: store.config.apiToken },
  }));
  ipcMain.handle("marea:addEvent", (_e, evt) => store.addEvent(evt, evt?.source || "manual"));
  ipcMain.handle("marea:setAgent", (_e, agentId, patch) => store.setAgent(String(agentId), patch || {}));
  ipcMain.handle("marea:setSetting", (_e, key, value) => store.setSetting(String(key), value));

  // ---- Motore Outreach (email reali + automazione) ----
  outreach = new Outreach(store, broadcast);
  ipcMain.handle("outreach:status", () => outreach.status());
  ipcMain.handle("outreach:setConfig", (_e, p) => outreach.setConfig(p || {}));
  ipcMain.handle("outreach:verify", () => outreach.verifySmtp());
  ipcMain.handle("outreach:sendNow", (_e, lead, custom) => outreach.sendNow(lead, custom));
  ipcMain.handle("outreach:start", (_e, lead) => outreach.startSequence(lead));
  ipcMain.handle("outreach:startBulk", (_e, leads) => outreach.startBulk(leads));
  ipcMain.handle("outreach:stop", (_e, id) => outreach.stopSequence(id));
  ipcMain.handle("outreach:approve", (_e, id) => outreach.approve(id));
  ipcMain.handle("outreach:discard", (_e, id, stop) => outreach.discard(id, stop));

  // ---- API locale: gli eventi degli agenti arrivano qui ----
  startApi(store, broadcast);

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
