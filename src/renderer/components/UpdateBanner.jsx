
export default function UpdateBanner({ version }) {
  if (!version) return null;
  return (
    <div className="update-banner">
      <div className="update-banner-icon">🎉</div>
      <div className="update-banner-text">
        <div className="update-banner-title">Successfully updated to v{version}</div>
        <div className="update-banner-sub">Pulse Agent relaunched with the new version.</div>
      </div>
    </div>
  );
}
