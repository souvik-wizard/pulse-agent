
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

export default function LogEntry({ entry }) {
  return (
    <div className="log-entry">
      <span className="log-time">{formatTime(entry.time)}</span>
      <span className={`log-action log-action-${entry.action}`}>{entry.action}</span>
      <span className="log-message">{entry.message}</span>
    </div>
  );
}
