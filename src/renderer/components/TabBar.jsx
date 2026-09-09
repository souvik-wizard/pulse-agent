import React from 'react';

const TABS = [
  { id: 'overview',   label: 'Overview',   icon: '🖥️' },
  { id: 'endpoints',  label: 'Endpoints',  icon: '🔌' },
  { id: 'worker',     label: 'Worker',     icon: '⚙️' },
  { id: 'updates',    label: 'Updates',    icon: '🔄' },
  { id: 'logs',       label: 'Logs',       icon: '📋' },
];

/**
 * TabBar — Horizontal tab navigation strip.
 */
export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className="tab-bar" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
