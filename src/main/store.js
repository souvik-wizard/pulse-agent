/**
 * store.js — Wraps electron-store for use across main process modules.
 * Only the main process accesses this. Renderer uses IPC.
 */

const Store = require('electron-store');

const store = new Store({
  name: 'pulse-agent-data',
  defaults: {
    endpoints: [
      { id: '1', name: 'Example HTTPS', host: 'example.com', port: 443, status: 'unknown', latency: null },
      { id: '2', name: 'Cloudflare DNS', host: '1.1.1.1', port: 443, status: 'unknown', latency: null },
      { id: '3', name: 'Localhost Echo', host: '127.0.0.1', port: 9, status: 'unknown', latency: null },
    ],
    pendingVersion: null,
  },
});

module.exports = {
  get: (key) => store.get(key),
  set: (key, value) => store.set(key, value),
  delete: (key) => store.delete(key),
};
