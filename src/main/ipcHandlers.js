/**
 * ipcHandlers.js — All IPC handler registrations for the main process.
 * Keeps main.js clean by centralising all handle() and on() calls here.
 */

const { ipcMain } = require('electron');
const { getSystemInfo } = require('./systemInfo');
const { validateEndpoint, checkEndpoint } = require('./endpointChecker');
const { startWorker, stopWorker, getStatus: getWorkerStatus } = require('./workerManager');
const { log, readAll: readLogs, openLogFolder, ACTIONS } = require('./logger');
const store = require('./store');
const { checkForUpdate, downloadUpdate, applyUpdate } = require('./updater');

let mainWindowRef = null;

function setWindow(win) {
  mainWindowRef = win;
}

function registerHandlers() {
  // ─── System Info ──────────────────────────────────────────────────────────
  ipcMain.handle('system:getInfo', async () => {
    return getSystemInfo();
  });

  // ─── Endpoints ────────────────────────────────────────────────────────────
  ipcMain.handle('endpoints:getAll', async () => {
    return store.get('endpoints') || [];
  });

  ipcMain.handle('endpoints:save', async (_event, endpoints) => {
    store.set('endpoints', endpoints);
    return { success: true };
  });

  ipcMain.handle('endpoints:validate', async (_event, endpoint) => {
    return validateEndpoint(endpoint);
  });

  ipcMain.handle('endpoints:check', async (_event, endpoint) => {
    const validation = validateEndpoint(endpoint);
    if (!validation.valid) {
      return { error: validation.errors.join(' ') };
    }
    const result = await checkEndpoint(endpoint.host, endpoint.port);
    const action = result.status === 'online' ? ACTIONS.HEALTH_OK : ACTIONS.HEALTH_FAIL;
    log(action, `${endpoint.name || endpoint.host}:${endpoint.port} → ${result.status}`, {
      host: endpoint.host,
      port: endpoint.port,
      latency: result.latency,
    });
    return result;
  });

  ipcMain.handle('endpoints:checkAll', async (_event, endpoints) => {
    const results = await Promise.all(
      endpoints.map(async (ep) => {
        const validation = validateEndpoint(ep);
        if (!validation.valid) {
          return { id: ep.id, status: 'error', latency: null, error: validation.errors.join(' ') };
        }
        const result = await checkEndpoint(ep.host, ep.port);
        const action = result.status === 'online' ? ACTIONS.HEALTH_OK : ACTIONS.HEALTH_FAIL;
        log(action, `${ep.name || ep.host}:${ep.port} → ${result.status}`, {
          host: ep.host,
          port: ep.port,
          latency: result.latency,
        });
        return { id: ep.id, ...result };
      })
    );
    return results;
  });

  // ─── Worker ───────────────────────────────────────────────────────────────
  ipcMain.handle('worker:start', async () => {
    const result = startWorker();
    if (result.success) {
      log(ACTIONS.WORKER_START, `Worker started with PID ${result.pid}`);
    }
    return result;
  });

  ipcMain.handle('worker:stop', async () => {
    const result = stopWorker();
    if (result.success) {
      log(ACTIONS.WORKER_STOP, 'Worker stopped by user.');
    }
    return result;
  });

  ipcMain.handle('worker:status', async () => {
    return getWorkerStatus();
  });

  // ─── Logs ─────────────────────────────────────────────────────────────────
  ipcMain.handle('logs:getAll', async () => {
    return readLogs();
  });

  ipcMain.handle('logs:openFolder', async () => {
    await openLogFolder();
    return { success: true };
  });

  // ─── Updates ──────────────────────────────────────────────────────────────
  ipcMain.handle('update:check', async () => {
    return checkForUpdate();
  });

  ipcMain.handle('update:download', async () => {
    return new Promise((resolve, reject) => {
      downloadUpdate((percent) => {
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
          mainWindowRef.webContents.send('update:progress', percent);
        }
      })
        .then(() => resolve({ success: true }))
        .catch((err) => reject(err));
    });
  });

  ipcMain.handle('update:apply', async () => {
    applyUpdate();
    return { success: true };
  });
}

module.exports = { registerHandlers, setWindow };
