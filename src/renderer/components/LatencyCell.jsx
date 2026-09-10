
export default function LatencyCell({ status, latency }) {
  if (status !== 'online' || latency == null) return <span className="text-muted">—</span>;
  const cls = latency < 80 ? 'fast' : latency < 200 ? 'med' : 'slow';
  return <span className={`latency ${cls}`}>{latency} ms</span>;
}
