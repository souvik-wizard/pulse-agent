/**
 * workerManager.js — Manages the lifecycle of the bundled worker-script.js.
 * Only one worker can run at a time.
 * stdout lines are streamed to the renderer via IPC.
 */

const { spawn } = require('child_process');
const path = require('path');
const { app } = require('electron');

const MAX_LINES = 50;

let workerProcess = null;
let outputLines = [];
let mainWindow = null;

/**
 * Set the main window reference so we can push events to the renderer.
 * @param {Electron.BrowserWindow} win
 */
function setMainWindow(win) {
  mainWindow = win;
}

/**
 * Get the path to the bundled worker script.
 * Works in both dev and production (packaged) contexts.
 */
function getWorkerScriptPath() {
  if (app && app.isPackaged) {
    return path.join(process.resourcesPath, 'worker-script.js');
  }
  return path.join(__dirname, '..', '..', 'worker-script.js');
}

function pushLine(line) {
  outputLines.push(line);
  if (outputLines.length > MAX_LINES) {
    outputLines = outputLines.slice(outputLines.length - MAX_LINES);
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('worker:line', line);
  }
}

/**
 * Start the worker process.
 * @returns {{ success: boolean, pid?: number, error?: string }}
 */
function startWorker() {
  if (workerProcess) {
    return { success: false, error: 'Worker is already running.' };
  }

  const scriptPath = getWorkerScriptPath();

  try {
    // Spawn with only the specific bundled script — never user-provided input
    workerProcess = spawn(process.execPath, [scriptPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    });
  } catch (err) {
    workerProcess = null;
    return { success: false, error: `Failed to spawn worker: ${err.message}` };
  }

  const pid = workerProcess.pid;
  outputLines = [];

  workerProcess.stdout.setEncoding('utf8');
  workerProcess.stdout.on('data', (chunk) => {
    const lines = chunk.split('\n').filter((l) => l.trim() !== '');
    lines.forEach(pushLine);
  });

  workerProcess.stderr.setEncoding('utf8');
  workerProcess.stderr.on('data', (chunk) => {
    const lines = chunk.split('\n').filter((l) => l.trim() !== '');
    lines.forEach((l) => pushLine(`[stderr] ${l}`));
  });

  workerProcess.on('exit', (code) => {
    workerProcess = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('worker:stopped', { code });
    }
  });

  return { success: true, pid };
}

/**
 * Stop the worker process gracefully.
 * @returns {{ success: boolean, error?: string }}
 */
function stopWorker() {
  if (!workerProcess) {
    return { success: false, error: 'No worker is running.' };
  }
  try {
    workerProcess.kill('SIGTERM');
    // Force kill after 2s if still alive
    setTimeout(() => {
      if (workerProcess) {
        try { workerProcess.kill('SIGKILL'); } catch (_) {}
      }
    }, 2000);
  } catch (err) {
    return { success: false, error: `Failed to stop worker: ${err.message}` };
  }
  return { success: true };
}

/**
 * Get current worker status.
 * @returns {{ running: boolean, pid: number|null, lines: string[] }}
 */
function getStatus() {
  return {
    running: workerProcess !== null,
    pid: workerProcess ? workerProcess.pid : null,
    lines: [...outputLines],
  };
}

/**
 * Kill the worker unconditionally (called on app quit).
 */
function killWorker() {
  if (workerProcess) {
    try { workerProcess.kill('SIGKILL'); } catch (_) {}
    workerProcess = null;
  }
}

module.exports = { setMainWindow, startWorker, stopWorker, getStatus, killWorker };
