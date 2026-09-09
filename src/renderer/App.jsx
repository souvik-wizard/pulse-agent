import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TabBar from './components/TabBar';
import Overview from './tabs/Overview';
import Endpoints from './tabs/Endpoints';
import Worker from './tabs/Worker';
import Updates from './tabs/Updates';
import Logs from './tabs/Logs';

const api = window.electronAPI;

/**
 * App — Root component. Handles tab routing and update-applied banner.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [appliedVersion, setAppliedVersion] = useState(null);

  useEffect(() => {
    // Fetch app version for the header
    api.getSystemInfo().then((info) => {
      if (info?.appVersion) setAppVersion(info.appVersion);
    }).catch(() => {});

    // Listen for the one-time post-update banner event
    const remove = api.onUpdateApplied((version) => {
      setAppliedVersion(version);
      // Navigate to Updates tab to show the banner
      setActiveTab('updates');
    });

    return remove;
  }, []);

  function renderTab() {
    switch (activeTab) {
      case 'overview':  return <Overview />;
      case 'endpoints': return <Endpoints />;
      case 'worker':    return <Worker />;
      case 'updates':   return <Updates appliedVersion={appliedVersion} />;
      case 'logs':      return <Logs />;
      default:          return <Overview />;
    }
  }

  return (
    <div className="app-shell">
      <Header version={appVersion} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="tab-content" role="main">
        {renderTab()}
      </main>
    </div>
  );
}
