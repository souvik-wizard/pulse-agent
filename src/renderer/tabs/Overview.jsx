import React, { useState, useEffect, useCallback } from 'react';

const api = window.electronAPI;

function formatBytes(bytes) {
  if (bytes == null) return '—';
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 ** 2);
  return `${mb.toFixed(0)} MB`;
}

function formatUptime(seconds) {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <div className="info-label">{label}</div>
      <div className="info-value">{value ?? '—'}</div>
    </div>
  );
}

/**
 * Overview Tab — Displays machine info fetched via IPC.
 */
export default function Overview() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getSystemInfo();
      setInfo(data);
    } catch (err) {
      console.error('Failed to fetch system info:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInfo(); }, [fetchInfo]);

  const memUsedPct = info
    ? Math.round(((info.totalMemory - info.freeMemory) / info.totalMemory) * 100)
    : null;

  return (
    <div>
      <div className="toolbar">
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
          System Overview
        </h2>
        <div className="toolbar-spacer" />
        <button
          id="btn-refresh-overview"
          className="btn btn-secondary"
          onClick={fetchInfo}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : '↻'}
          Refresh
        </button>
      </div>

      {!info && loading && (
        <div className="empty-state">
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
          <div className="empty-state-text">Loading system info…</div>
        </div>
      )}

      {info && (
        <>
          <div className="section-title">Machine</div>
          <div className="info-grid mb-16" style={{ marginBottom: 20 }}>
            <InfoItem label="Hostname"    value={info.hostname} />
            <InfoItem label="Platform"   value={info.platform} />
            <InfoItem label="OS Release" value={info.release} />
            <InfoItem label="Architecture" value={info.arch} />
          </div>

          <div className="section-title">Hardware</div>
          <div className="info-grid mb-16" style={{ marginBottom: 20 }}>
            <InfoItem label="CPU Count"   value={info.cpuCount} />
            <InfoItem label="CPU Model"   value={info.cpuModel} />
            <InfoItem label="Total Memory" value={formatBytes(info.totalMemory)} />
            <InfoItem label="Free Memory" value={formatBytes(info.freeMemory)} />
            <InfoItem label="Memory Used" value={memUsedPct != null ? `${memUsedPct}%` : '—'} />
            <InfoItem label="System Uptime" value={formatUptime(info.uptime)} />
          </div>

          <div className="section-title">Application</div>
          <div className="info-grid">
            <InfoItem label="App Version" value={`v${info.appVersion}`} />
          </div>
        </>
      )}
    </div>
  );
}
