/**
 * logger.js — Append-only JSON-lines logger for the main process.
 * Writes to: userData/logs/agent.log
 * Reads entries back for display in the Logs tab.
 */

const fs = require('fs');
const path = require('path');
const { app, shell } = require('electron');

let logFilePath = null;

function ensureLogDir() {
  if (!logFilePath) {
    const logDir = path.join(app.getPath('userData'), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    logFilePath = path.join(logDir, 'agent.log');
  }
  return logFilePath;
}

// Append a log entry.
function log(action, message, extra = {}) {
  const entry = {
    time: new Date().toISOString(),
    action,
    message,
    ...extra,
  };
  const filePath = ensureLogDir();
  fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf8');
}

// Read all log entries, newest first.
function readAll() {
  const filePath = ensureLogDir();
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.trim().split('\n').filter(Boolean);
  const entries = lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
  return entries.reverse();
}

// Open the log folder in the OS file explorer.
async function openLogFolder() {
  const filePath = ensureLogDir();
  await shell.openPath(path.dirname(filePath));
}

// Log action constants
const ACTIONS = {
  APP_START: 'APP_START',
  HEALTH_OK: 'HEALTH_OK',
  HEALTH_FAIL: 'HEALTH_FAIL',
  WORKER_START: 'WORKER_START',
  WORKER_STOP: 'WORKER_STOP',
  UPDATE_CHECK: 'UPDATE_CHECK',
  UPDATE_DOWNLOAD: 'UPDATE_DOWNLOAD',
  UPDATE_APPLY: 'UPDATE_APPLY',
};

module.exports = { log, readAll, openLogFolder, ACTIONS };
