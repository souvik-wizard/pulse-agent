/**
 * systemInfo.js — Returns machine information using Node.js os module.
 * Called by the IPC handler for 'system:getInfo'.
 */

const os = require('os');
const { app } = require('electron');

function getSystemInfo() {
  const cpus = os.cpus();
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpuCount: cpus.length,
    cpuModel: cpus.length > 0 ? cpus[0].model : 'Unknown',
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    appVersion: app.getVersion(),
    uptime: os.uptime(),
  };
}

module.exports = { getSystemInfo };
