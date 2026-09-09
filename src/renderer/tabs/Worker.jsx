import React, { useState, useEffect, useRef, useCallback } from 'react';

const api = window.electronAPI;
const MAX_LINES = 50;

/**
 * Worker Tab — Start/stop the bundled worker, stream stdout, display last 50 lines.
 */
export default function Worker() {
  const [running, setRunning] = useState(false);
  const [pid, setPid] = useState(null);
  const [lines, setLines] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const consoleRef = useRef(null);

  // Sync scroll to bottom when new lines arrive
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [lines]);

  // On mount: fetch current worker status and set up event listeners
  useEffect(() => {
    api.getWorkerStatus().then((status) => {
      setRunning(status.running);
      setPid(status.pid);
      setLines(status.lines.slice(-MAX_LINES));
    });

    const removeLineListener = api.onWorkerLine((line) => {
      setLines((prev) => {
        const next = [...prev, line];
        return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
      });
    });

    const removeStopListener = api.onWorkerStopped(() => {
      setRunning(false);
      setPid(null);
    });

    return () => {
      removeLineListener();
      removeStopListener();
    };
  }, []);

  const handleStart = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.startWorker();
    if (result.success) {
      setRunning(true);
      setPid(result.pid);
      setLines([]);
    } else {
      setError(result.error || 'Failed to start worker.');
    }
    setLoading(false);
  }, []);

  const handleStop = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.stopWorker();
    if (!result.success) {
      setError(result.error || 'Failed to stop worker.');
    }
    setLoading(false);
  }, []);

  return (
    <div>
      <div className="toolbar">
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Worker Process
        </h2>
        <div className="toolbar-spacer" />
        <button
          id="btn-worker-start"
          className="btn btn-success"
          onClick={handleStart}
          disabled={running || loading}
        >
          {loading && !running ? <span className="spinner" /> : '▶'}
          Start
        </button>
        <button
          id="btn-worker-stop"
          className="btn btn-danger"
          onClick={handleStop}
          disabled={!running || loading}
        >
          {loading && running ? <span className="spinner" /> : '■'}
          Stop
        </button>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          fontSize: 13,
          color: 'var(--danger)',
          marginBottom: 14,
        }}>
          {error}
        </div>
      )}

      <div className="worker-status-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className={`online-dot ${running ? 'online' : 'offline'}`} />
          <span style={{ fontSize: 13, fontWeight: 600, color: running ? 'var(--success)' : 'var(--text-muted)' }}>
            {running ? 'Running' : 'Stopped'}
          </span>
        </div>
        {pid != null && (
          <div className="worker-pid-badge">PID: {pid}</div>
        )}
        <div className="toolbar-spacer" />
        <span className="text-muted" style={{ fontSize: 12 }}>
          Showing last {Math.min(lines.length, MAX_LINES)} / {MAX_LINES} lines
        </span>
      </div>

      <div className="section-title">stdout output</div>
      <div className="console-output" ref={consoleRef} id="worker-console">
        {lines.length === 0 ? (
          <div className="console-empty">
            {running ? 'Waiting for output…' : 'Start the worker to see output here.'}
          </div>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="console-line">{line}</div>
          ))
        )}
      </div>
    </div>
  );
}
