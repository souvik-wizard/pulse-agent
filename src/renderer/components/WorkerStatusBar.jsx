
export default function WorkerStatusBar({ running, pid, lineCount, maxLines }) {
  return (
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
        Showing last {Math.min(lineCount, maxLines)} / {maxLines} lines
      </span>
    </div>
  );
}
