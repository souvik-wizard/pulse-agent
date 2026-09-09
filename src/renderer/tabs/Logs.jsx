import React, { useState, useEffect, useCallback } from 'react';

const api = window.electronAPI;

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Logs Tab — Reads JSON-lines log file and displays entries newest-first.
 */
export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const entries = await api.getAllLogs();
      setLogs(entries || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function handleOpenFolder() {
    await api.openLogFolder();
  }

  return (
    <div>
      <div className="toolbar">
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Logs
        </h2>
        <div className="toolbar-spacer" />
        <button
          id="btn-refresh-logs"
          className="btn btn-secondary"
          onClick={fetchLogs}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : '↻'}
          Refresh
        </button>
        <button
          id="btn-open-log-folder"
          className="btn btn-secondary"
          onClick={handleOpenFolder}
        >
          📂 Open Folder
        </button>
      </div>

      {logs.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">No log entries yet. Perform actions to generate logs.</div>
        </div>
      )}

      {loading && logs.length === 0 && (
        <div className="empty-state">
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
          <div className="empty-state-text">Loading logs…</div>
        </div>
      )}

      <div className="log-list" id="log-list">
        {logs.map((entry, i) => (
          <div key={i} className="log-entry">
            <span className="log-time">{formatTime(entry.time)}</span>
            <span className={`log-action log-action-${entry.action}`}>{entry.action}</span>
            <span className="log-message">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
