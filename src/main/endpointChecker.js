// TCP health checks using Node net.Socket module.

const net = require('net');

const TIMEOUT_MS = 2000;

function validateEndpoint(endpoint) {
  const errors = [];
  if (!endpoint.host || String(endpoint.host).trim() === '') {
    errors.push('Host is required.');
  }
  const port = Number(endpoint.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push('Port must be an integer between 1 and 65535.');
  }
  return { valid: errors.length === 0, errors };
}

function checkEndpoint(host, port) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let settled = false;

    function finish(status) {
      if (settled) return;
      settled = true;
      socket.destroy();
      const latency = status === 'online' ? Date.now() - start : null;
      resolve({ status, latency });
    }

    socket.setTimeout(TIMEOUT_MS);

    socket.connect(Number(port), String(host), () => {
      finish('online');
    });

    socket.on('error', () => {
      finish('unreachable');
    });

    socket.on('timeout', () => {
      finish('unreachable');
    });
  });
}

module.exports = { validateEndpoint, checkEndpoint };
