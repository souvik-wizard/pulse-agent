/**
 * worker-script.js
 * Bundled worker process. Prints a line every 2 seconds until killed.
 * This script is spawned by workerManager.js in the main process.
 */

let seq = 0;

function tick() {
  seq += 1;
  const line = JSON.stringify({ seq, timestamp: new Date().toISOString() });
  process.stdout.write(line + '\n');
}

// Emit first tick immediately, then every 2 seconds
tick();
const interval = setInterval(tick, 2000);

// Clean up on signals
process.on('SIGTERM', () => {
  clearInterval(interval);
  process.exit(0);
});

process.on('SIGINT', () => {
  clearInterval(interval);
  process.exit(0);
});
