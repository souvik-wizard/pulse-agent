
export default function StatusBadge({ status }) {
  if (status === 'checking') {
    return (
      <span className="badge badge-checking">
        <span className="spinner" style={{ width: 10, height: 10 }} />
        Checking
      </span>
    );
  }
  const cls = status === 'online' ? 'badge-online'
    : status === 'unreachable' ? 'badge-unreachable'
      : 'badge-unknown';
  const label = status === 'online' ? '● Online'
    : status === 'unreachable' ? '✕ Unreachable'
      : '— Unknown';
  return <span className={`badge ${cls}`}>{label}</span>;
}
