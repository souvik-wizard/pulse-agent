import React, { useState, useEffect, useCallback } from 'react';
import LogEntry from '../components/LogEntry';

const api = window.electronAPI;

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
          <LogEntry key={i} entry={entry} />
        ))}
      </div>
    </div>
  );
}
