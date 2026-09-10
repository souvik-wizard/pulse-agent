/**
 * updater.js — Fixture-based update flow.
 *
 * Check: reads update-manifest.json and compares against current version.
 * Download: simulates file copy with 0–100% progress events.
 * Apply: saves pendingVersion to store, relaunches the app.
 * After relaunch: detects pendingVersion and emits 'update:applied'.
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const store = require('./store');
const { log, ACTIONS } = require('./logger');

const MANIFEST_PATH = path.join(__dirname, '..', '..', 'update-manifest.json');

function readManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  return JSON.parse(raw);
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

/**
 * Check for updates.
 * @returns {{ hasUpdate: boolean, currentVersion: string, latestVersion: string, releaseNotes: string }}
 */
function checkForUpdate() {
  const manifest = readManifest();
  const currentVersion = app.getVersion();
  const hasUpdate = compareVersions(manifest.version, currentVersion) > 0;
  log(ACTIONS.UPDATE_CHECK, `Checked for updates. Current: ${currentVersion}, Latest: ${manifest.version}`, {
    hasUpdate,
    latestVersion: manifest.version,
  });
  return {
    hasUpdate,
    currentVersion,
    latestVersion: manifest.version,
    releaseNotes: manifest.releaseNotes,
  };
}

/**
 * Simulate downloading the update.
 * Sends progress events (0–100) via the provided callback.
 * Writes a dummy file to userData.
 */
function downloadUpdate(onProgress) {
  return new Promise((resolve, reject) => {
    const manifest = readManifest();
    const destDir = path.join(app.getPath('userData'), 'updates');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const destPath = path.join(destDir, `update-${manifest.version}.bin`);

    log(ACTIONS.UPDATE_DOWNLOAD, `Downloading update ${manifest.version}...`);

    let percent = 0;
    const STEPS = 20;
    const INTERVAL = 80; // ms per step → ~1.6s total

    const interval = setInterval(() => {
      percent = Math.min(100, percent + Math.floor(100 / STEPS));
      onProgress(percent);

      if (percent >= 100) {
        clearInterval(interval);
        // Write a dummy payload
        try {
          fs.writeFileSync(destPath, `Pulse Agent update payload v${manifest.version}\n`);
          log(ACTIONS.UPDATE_DOWNLOAD, `Update ${manifest.version} downloaded to ${destPath}`);
          resolve();
        } catch (err) {
          reject(err);
        }
      }
    }, INTERVAL);
  });
}

//Apply the update: save pendingVersion, relaunch the app.
function applyUpdate() {
  const manifest = readManifest();
  store.set('pendingVersion', manifest.version);
  log(ACTIONS.UPDATE_APPLY, `Applying update to ${manifest.version}. Relaunching...`);
  app.relaunch();
  app.quit();
}

/**
 * Check if the app just updated (pendingVersion in store).
 * Returns the applied version and clears the flag.
 */
function consumePendingVersion() {
  const pending = store.get('pendingVersion');
  if (pending) {
    store.set('pendingVersion', null);
    return pending;
  }
  return null;
}

module.exports = { checkForUpdate, downloadUpdate, applyUpdate, consumePendingVersion };
