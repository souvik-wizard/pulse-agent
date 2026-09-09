# ⚡ Pulse Agent

A small, clean Electron + React desktop application for monitoring TCP endpoints, managing a background worker process, and performing simple app updates — all while demonstrating secure Electron IPC architecture.

---

## ✨ Features

| Tab | Description |
|-----|-------------|
| **Overview** | Machine info (hostname, OS, CPU, memory) via Node.js `os` |
| **Endpoints** | TCP health checks with add / edit / delete / check-all |
| **Worker** | Spawn/stop a bundled worker process, stream its stdout (last 50 lines) |
| **Updates** | Fixture-based update flow: check → download → apply + relaunch |
| **Logs** | Append-only JSON-lines log with action badges |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Shell | Electron 33 |
| UI | React 18 + Vite 6 |
| Language | JavaScript (ES modules in renderer, CommonJS in main) |
| IPC Bridge | `contextBridge` + `ipcMain` / `ipcRenderer` |
| Persistence | `electron-store` |
| Networking | Node.js `net.Socket` (TCP checks, main process only) |
| Worker | Node.js `child_process.spawn` |
| Logging | Node.js `fs` — append-only JSON Lines |

---

## 📋 Prerequisites

- **Node.js** ≥ 18 (includes npm)
- **Windows / macOS / Linux** (tested on Windows)

---

## 🚀 Install & Run

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd pulse-agent

# 2. Install dependencies
npm install

# 3. Start in development mode
npm run dev
```

`npm run dev` concurrently starts:
1. **Vite dev server** on `http://localhost:5173` (React renderer)
2. **Electron** (waits for Vite to be ready, then opens the window)

> **Tip**: The first run may take a moment while Electron downloads. Subsequent starts are fast.

---

## 🗂 Project Structure

```
pulse-agent/
├── package.json              # Scripts, dependencies
├── vite.config.js            # Vite config (renderer, output → dist-renderer/)
├── worker-script.js          # Bundled worker — prints seq+timestamp every 2s
├── update-manifest.json      # Fixture: latest version 1.1.0 + release notes
│
├── src/
│   ├── main/                 # Electron main process (Node.js, CommonJS)
│   │   ├── main.js           # Entry: BrowserWindow, app lifecycle
│   │   ├── ipcHandlers.js    # All ipcMain.handle() registrations
│   │   ├── store.js          # electron-store wrapper
│   │   ├── systemInfo.js     # os module → machine info
│   │   ├── endpointChecker.js# net.Socket TCP checks + validation
│   │   ├── workerManager.js  # child_process.spawn + stdout streaming
│   │   ├── logger.js         # fs append-only JSON-lines logger
│   │   └── updater.js        # Fixture update: check / download / apply
│   │
│   ├── preload/
│   │   └── preload.js        # contextBridge — whitelisted API surface
│   │
│   └── renderer/             # React app (Vite, ES modules)
│       ├── index.html
│       ├── main.jsx          # React entry
│       ├── App.jsx           # Tab routing, header, update banner
│       ├── index.css         # Global dark theme styles
│       ├── components/
│       │   ├── Header.jsx    # App name, version, online indicator
│       │   └── TabBar.jsx    # Tab navigation
│       └── tabs/
│           ├── Overview.jsx  # Machine info
│           ├── Endpoints.jsx # TCP endpoint table
│           ├── Worker.jsx    # Worker process management
│           ├── Updates.jsx   # Update flow
│           └── Logs.jsx      # Log viewer
```

---

## 🔐 Security & IPC Architecture

```
┌─────────────────────────────────────────────┐
│  Renderer (React)  contextIsolation: true   │
│  nodeIntegration: false                      │
│                                              │
│  window.electronAPI.checkEndpoint(ep)  ──►  │
└────────────────────────────┬────────────────┘
                             │  contextBridge (preload.js)
                             │  ipcRenderer.invoke('endpoints:check', ep)
                             ▼
┌─────────────────────────────────────────────┐
│  Main Process (Node.js)                      │
│                                              │
│  ipcMain.handle('endpoints:check', ...)      │
│    → endpointChecker.js (net.Socket)         │
│    → logger.js (fs.appendFileSync)           │
│    → returns result to renderer              │
└─────────────────────────────────────────────┘
```

**Key rules:**
- **The renderer never touches `fs`, `net`, `child_process`, or `electron-store` directly.**
- `contextBridge` exposes only a named whitelist of functions.
- `worker-script.js` is spawned by path — never by user-provided input (`exec()` is not used).
- All validation (host, port range) runs in the main process.

---

## 🧪 Testing the Main Flows

### Endpoints
1. Open the **Endpoints** tab.
2. Three default endpoints are pre-loaded.
3. Click **Check All** — `example.com:443` and `1.1.1.1:443` should show **Online** with latency; `127.0.0.1:9` should show **Unreachable**.
4. Click **+ Add Endpoint**, enter a host and port, save.
5. Restart the app — your endpoints persist (stored via `electron-store`).

### Worker
1. Open the **Worker** tab.
2. Click **Start** — the PID appears and lines begin streaming every 2 seconds.
3. Click **Stop** — the process exits, PID clears.
4. The console shows the last 50 lines maximum.

### Logs
1. After performing endpoint checks and starting the worker, open **Logs**.
2. Entries appear newest-first with colour-coded action badges.
3. Click **Open Folder** to reveal `userData/logs/agent.log` in your file explorer.

### Update Flow
1. Open the **Updates** tab.
2. Click **Check for Update** — the app reports version `1.0.0` and a newer `1.1.0` is available.
3. Release notes are displayed.
4. Click **Download Update** — a progress bar animates 0 → 100%.
5. Click **Apply & Relaunch** — the app relaunches.
6. After relaunch, a green "Successfully updated to v1.1.0" banner appears once in the Updates tab.

> The app's `package.json` version stays `1.0.0`; the pending version is saved to `electron-store` and consumed once on the next launch.

---

## 📄 Log File Location

| Platform | Path |
|----------|------|
| Windows  | `%APPDATA%\pulse-agent\logs\agent.log` |
| macOS    | `~/Library/Application Support/pulse-agent/logs/agent.log` |
| Linux    | `~/.config/pulse-agent/logs/agent.log` |

Each line is a JSON object:
```json
{"time":"2026-01-01T00:00:00.000Z","action":"APP_START","message":"Pulse Agent started. Version 1.0.0"}
```

---

## 📦 Building for Production

```bash
npm run build
```

This runs `vite build` then `electron-builder` to produce a distributable in `dist/`.
