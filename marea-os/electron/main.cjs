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

let win = null;
let store = null;

function broadcast(evt) {
  if (win && !win.isDestroyed()) win.webContents.send("marea:event", evt);
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
