
export default function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <div className="info-label">{label}</div>
      <div className="info-value">{value ?? '—'}</div>
    </div>
  );
}
