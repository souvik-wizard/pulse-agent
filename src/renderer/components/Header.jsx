import React from 'react';

/**
 * Header — App name, version, and online/offline indicator.
 * Uses navigator.onLine for the initial value and listens for changes.
 */
export default function Header({ version }) {
  const [online, setOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline  = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="header">
      <div className="header-logo">
        <div className="header-logo-icon">⚡</div>
        <span className="header-app-name">Pulse Agent</span>
        <span className="header-version">v{version || '1.0.0'}</span>
      </div>

      <div className="header-spacer" />

      <div className="online-indicator">
        <div className={`online-dot ${online ? 'online' : 'offline'}`} />
        <span style={{ color: online ? 'var(--success)' : 'var(--danger)', fontSize: '12px', fontWeight: 500 }}>
          {online ? 'Online' : 'Offline'}
        </span>
      </div>
    </header>
  );
}
