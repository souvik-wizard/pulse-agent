import React, { useState, useCallback } from 'react';

const api = window.electronAPI;

// Update flow states
const STATE = {
  IDLE: 'idle',
  CHECKING: 'checking',
  UP_TO_DATE: 'up-to-date',
  UPDATE_AVAILABLE: 'update-available',
  DOWNLOADING: 'downloading',
  READY: 'ready',
  APPLYING: 'applying',
};

/**
 * Updates Tab — Fixture-based update flow with progress simulation.
 */
export default function Updates({ appliedVersion }) {
  const [state, setState] = useState(STATE.IDLE);
  const [checkResult, setCheckResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  // Listen for download progress pushed from main process
  React.useEffect(() => {
    const remove = api.onUpdateProgress((percent) => {
      setProgress(percent);
      if (percent >= 100) {
        setState(STATE.READY);
      }
    });
    return remove;
  }, []);

  const handleCheck = useCallback(async () => {
    setState(STATE.CHECKING);
    setError(null);
    setCheckResult(null);
    setProgress(0);
    try {
      const result = await api.checkUpdate();
      setCheckResult(result);
      setState(result.hasUpdate ? STATE.UPDATE_AVAILABLE : STATE.UP_TO_DATE);
    } catch (err) {
      setError(`Failed to check for updates: ${err.message}`);
      setState(STATE.IDLE);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    setState(STATE.DOWNLOADING);
    setProgress(0);
    setError(null);
    try {
      await api.downloadUpdate();
      // progress events drive state transition to READY
    } catch (err) {
      setError(`Download failed: ${err.message}`);
      setState(STATE.UPDATE_AVAILABLE);
    }
  }, []);

  const handleApply = useCallback(async () => {
    setState(STATE.APPLYING);
    try {
      await api.applyUpdate();
      // App will relaunch; this point may not be reached.
    } catch (err) {
      setError(`Apply failed: ${err.message}`);
      setState(STATE.READY);
    }
  }, []);

  return (
    <div>
      <div className="toolbar">
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Updates
        </h2>
      </div>

      {/* One-time "Updated!" banner after relaunch */}
      {appliedVersion && (
        <div className="update-banner">
          <div className="update-banner-icon">🎉</div>
          <div className="update-banner-text">
            <div className="update-banner-title">Successfully updated to v{appliedVersion}</div>
            <div className="update-banner-sub">Pulse Agent relaunched with the new version.</div>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: 13,
          color: 'var(--danger)',
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-title">🔄 Update Status</div>

        {/* Current version */}
        {checkResult && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 24, marginBottom: 8 }}>
              <div>
                <div className="info-label">Current Version</div>
                <div className="info-value" style={{ fontSize: 15 }}>v{checkResult.currentVersion}</div>
              </div>
              {checkResult.hasUpdate && (
                <div>
                  <div className="info-label">Latest Version</div>
                  <div className="info-value" style={{ fontSize: 15, color: 'var(--accent-light)' }}>
                    v{checkResult.latestVersion}
                  </div>
                </div>
              )}
            </div>

            {!checkResult.hasUpdate && (
              <div style={{
                background: 'var(--success-bg)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                fontSize: 13,
                color: 'var(--success)',
              }}>
                ✓ Pulse Agent is up to date.
              </div>
            )}

            {checkResult.hasUpdate && checkResult.releaseNotes && (
              <div>
                <div className="info-label" style={{ marginTop: 12 }}>Release Notes</div>
                <div className="release-notes">{checkResult.releaseNotes}</div>
              </div>
            )}
          </div>
        )}

        {/* Progress bar */}
        {(state === STATE.DOWNLOADING) && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span>Downloading update…</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            id="btn-check-update"
            className="btn btn-secondary"
            onClick={handleCheck}
            disabled={state === STATE.CHECKING || state === STATE.DOWNLOADING || state === STATE.APPLYING}
          >
            {state === STATE.CHECKING ? <span className="spinner" /> : '🔍'}
            Check for Update
          </button>

          {(state === STATE.UPDATE_AVAILABLE) && (
            <button
              id="btn-download-update"
              className="btn btn-primary"
              onClick={handleDownload}
            >
              ⬇ Download Update
            </button>
          )}

          {state === STATE.READY && (
            <button
              id="btn-apply-update"
              className="btn btn-success"
              onClick={handleApply}
              disabled={state === STATE.APPLYING}
            >
              {state === STATE.APPLYING ? <span className="spinner" /> : '🚀'}
              Apply &amp; Relaunch
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
