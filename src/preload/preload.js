/**
 * preload.js — Secure bridge between renderer and main process.
 *
 * Security model:
 *   - contextIsolation: true  → renderer cannot access Node.js directly.
 *   - Only whitelisted IPC channels are exposed.
 *   - No raw Node.js APIs (fs, net, child_process, etc.) are exposed.
 *   - Renderer calls window.electronAPI.xxx() which translates to
 *     ipcRenderer.invoke() / ipcRenderer.on() calls.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ─── System Info ──────────────────────────────────────────────────────────
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),

  // ─── Endpoints ────────────────────────────────────────────────────────────
  getAllEndpoints: () => ipcRenderer.invoke('endpoints:getAll'),
  saveEndpoints: (endpoints) => ipcRenderer.invoke('endpoints:save', endpoints),
  validateEndpoint: (endpoint) => ipcRenderer.invoke('endpoints:validate', endpoint),
  checkEndpoint: (endpoint) => ipcRenderer.invoke('endpoints:check', endpoint),
  checkAllEndpoints: (endpoints) => ipcRenderer.invoke('endpoints:checkAll', endpoints),

  // ─── Worker ───────────────────────────────────────────────────────────────
  startWorker: () => ipcRenderer.invoke('worker:start'),
  stopWorker: () => ipcRenderer.invoke('worker:stop'),
  getWorkerStatus: () => ipcRenderer.invoke('worker:status'),

  // Event listeners (renderer → receive push events from main)
  onWorkerLine: (callback) => {
    const listener = (_event, line) => callback(line);
    ipcRenderer.on('worker:line', listener);
    // Return cleanup function
    return () => ipcRenderer.removeListener('worker:line', listener);
  },
  onWorkerStopped: (callback) => {
    const listener = (_event, info) => callback(info);
    ipcRenderer.on('worker:stopped', listener);
    return () => ipcRenderer.removeListener('worker:stopped', listener);
  },

  // ─── Logs ─────────────────────────────────────────────────────────────────
  getAllLogs: () => ipcRenderer.invoke('logs:getAll'),
  openLogFolder: () => ipcRenderer.invoke('logs:openFolder'),

  // ─── Store (generic, limited) ─────────────────────────────────────────────
  storeGet: (key) => ipcRenderer.invoke('store:get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store:set', key, value),

  // ─── Updates ──────────────────────────────────────────────────────────────
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  applyUpdate: () => ipcRenderer.invoke('update:apply'),

  onUpdateProgress: (callback) => {
    const listener = (_event, percent) => callback(percent);
    ipcRenderer.on('update:progress', listener);
    return () => ipcRenderer.removeListener('update:progress', listener);
  },
  onUpdateApplied: (callback) => {
    const listener = (_event, version) => callback(version);
    ipcRenderer.on('update:applied', listener);
    return () => ipcRenderer.removeListener('update:applied', listener);
  },
});
