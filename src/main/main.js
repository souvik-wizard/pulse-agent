/**
 * main.js — Electron main process entry point.
 *
 * Security:
 *   - contextIsolation: true
 *   - nodeIntegration: false
 *   - Renderer is loaded from Vite dev server (dev) or dist-renderer (prod).
 *   - All Node.js operations happen here, exposed via IPC + preload only.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

const { registerHandlers, setWindow } = require('./ipcHandlers');
const { setMainWindow, killWorker } = require('./workerManager');
const { log, ACTIONS } = require('./logger');
const { consumePendingVersion } = require('./updater');

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 560,
    title: 'Pulse Agent',
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // must be false for preload to use require()
    },
    autoHideMenuBar: true,
    show: false,
  });

  // Pass window reference to modules that need to push events
  setMainWindow(win);
  setWindow(win);

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', '..', 'dist-renderer', 'index.html'));
  }

  win.once('ready-to-show', () => {
    win.show();

    // Check if the app just relaunched after an update
    const appliedVersion = consumePendingVersion();
    if (appliedVersion) {
      win.webContents.send('update:applied', appliedVersion);
    }
  });

  win.on('closed', () => {
    killWorker();
  });

  return win;
}

app.whenReady().then(() => {
  registerHandlers();
  createWindow();

  log(ACTIONS.APP_START, `Pulse Agent started. Version ${app.getVersion()}`);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  killWorker();
});

app.on('window-all-closed', () => {
  killWorker();
  if (process.platform !== 'darwin') app.quit();
});
