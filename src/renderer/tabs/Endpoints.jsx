import React, { useState, useEffect, useCallback } from 'react';

const api = window.electronAPI;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function StatusBadge({ status }) {
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

function LatencyCell({ status, latency }) {
  if (status !== 'online' || latency == null) return <span className="text-muted">—</span>;
  const cls = latency < 80 ? 'fast' : latency < 200 ? 'med' : 'slow';
  return <span className={`latency ${cls}`}>{latency} ms</span>;
}

function EndpointModal({ endpoint, onSave, onClose }) {
  const [form, setForm] = useState({
    name: endpoint?.name || '',
    host: endpoint?.host || '',
    port: endpoint?.port || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSave() {
    setSaving(true);
    const result = await api.validateEndpoint({ host: form.host, port: Number(form.port) });
    if (!result.valid) {
      const errs = {};
      result.errors.forEach((e) => {
        if (e.toLowerCase().includes('host')) errs.host = e;
        else if (e.toLowerCase().includes('port')) errs.port = e;
        else errs.general = e;
      });
      setErrors(errs);
      setSaving(false);
      return;
    }
    onSave({
      id: endpoint?.id || generateId(),
      name: form.name.trim() || `${form.host}:${form.port}`,
      host: form.host.trim(),
      port: Number(form.port),
      status: 'unknown',
      latency: null,
    });
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{endpoint ? 'Edit Endpoint' : 'Add Endpoint'}</h3>

        <div className="form-group">
          <label className="form-label" htmlFor="ep-name">Name (optional)</label>
          <input
            id="ep-name"
            className="form-input"
            placeholder="My Server"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="ep-host">Host *</label>
          <input
            id="ep-host"
            className="form-input"
            placeholder="example.com or 192.168.1.1"
            value={form.host}
            onChange={(e) => update('host', e.target.value)}
          />
          {errors.host && <div className="form-error">{errors.host}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="ep-port">Port *</label>
          <input
            id="ep-port"
            className="form-input"
            placeholder="443"
            type="number"
            min="1"
            max="65535"
            value={form.port}
            onChange={(e) => update('port', e.target.value)}
          />
          {errors.port && <div className="form-error">{errors.port}</div>}
        </div>

        {errors.general && <div className="form-error">{errors.general}</div>}

        <div className="modal-actions">
          <button id="btn-ep-cancel" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button id="btn-ep-save" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Endpoints Tab — TCP health check table with add/edit/delete/check actions.
 */
export default function Endpoints() {
  const [endpoints, setEndpoints] = useState([]);
  const [checkingIds, setCheckingIds] = useState(new Set());
  const [checkingAll, setCheckingAll] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from store on mount
  useEffect(() => {
    api.getAllEndpoints().then((eps) => {
      setEndpoints(eps || []);
      setLoading(false);
    });
  }, []);

  // Persist to store whenever endpoints change (except initial load)
  const saveEndpoints = useCallback((eps) => {
    setEndpoints(eps);
    api.saveEndpoints(eps);
  }, []);

  function openAdd() {
    setEditTarget(null);
    setModalOpen(true);
  }

  function openEdit(ep) {
    setEditTarget(ep);
    setModalOpen(true);
  }

  function handleSave(ep) {
    setEndpoints((prev) => {
      const exists = prev.find((e) => e.id === ep.id);
      const next = exists
        ? prev.map((e) => (e.id === ep.id ? ep : e))
        : [...prev, ep];
      api.saveEndpoints(next);
      return next;
    });
    setModalOpen(false);
  }

  function handleDelete(id) {
    setEndpoints((prev) => {
      const next = prev.filter((e) => e.id !== id);
      api.saveEndpoints(next);
      return next;
    });
  }

  async function checkOne(ep) {
    setCheckingIds((s) => new Set(s).add(ep.id));
    const result = await api.checkEndpoint(ep);
    setEndpoints((prev) => {
      const updated = prev.map((e) =>
        e.id === ep.id ? { ...e, status: result.status, latency: result.latency ?? null } : e
      );
      api.saveEndpoints(updated);
      return updated;
    });
    setCheckingIds((s) => {
      const next = new Set(s);
      next.delete(ep.id);
      return next;
    });
  }

  async function checkAll() {
    setCheckingAll(true);
    setCheckingIds(new Set(endpoints.map((e) => e.id)));
    const results = await api.checkAllEndpoints(endpoints);
    setEndpoints((prev) => {
      const updated = prev.map((ep) => {
        const r = results.find((x) => x.id === ep.id);
        if (!r) return ep;
        return { ...ep, status: r.status, latency: r.latency ?? null };
      });
      api.saveEndpoints(updated);
      return updated;
    });
    setCheckingIds(new Set());
    setCheckingAll(false);
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
        <div className="empty-state-text">Loading endpoints…</div>
      </div>
    );
  }

  return (
    <div>
      <div className="toolbar">
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Endpoints
        </h2>
        <div className="toolbar-spacer" />
        <button
          id="btn-check-all"
          className="btn btn-secondary"
          onClick={checkAll}
          disabled={checkingAll || endpoints.length === 0}
        >
          {checkingAll ? <span className="spinner" /> : '⚡'}
          Check All
        </button>
        <button
          id="btn-add-endpoint"
          className="btn btn-primary"
          onClick={openAdd}
        >
          + Add Endpoint
        </button>
      </div>

      {endpoints.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔌</div>
          <div className="empty-state-text">No endpoints yet. Add one to get started.</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Host</th>
                <th>Port</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep) => {
                const isChecking = checkingIds.has(ep.id);
                return (
                  <tr key={ep.id}>
                    <td style={{ fontWeight: 500 }}>{ep.name}</td>
                    <td className="font-mono" style={{ fontSize: 12 }}>{ep.host}</td>
                    <td className="font-mono" style={{ fontSize: 12 }}>{ep.port}</td>
                    <td>
                      <StatusBadge status={isChecking ? 'checking' : ep.status} />
                    </td>
                    <td>
                      <LatencyCell status={ep.status} latency={ep.latency} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          id={`btn-check-${ep.id}`}
                          className="btn btn-sm btn-secondary"
                          onClick={() => checkOne(ep)}
                          disabled={isChecking || checkingAll}
                          title="Check this endpoint"
                        >
                          {isChecking ? <span className="spinner" style={{ width: 10, height: 10 }} /> : '⚡'}
                        </button>
                        <button
                          id={`btn-edit-${ep.id}`}
                          className="btn btn-sm btn-secondary"
                          onClick={() => openEdit(ep)}
                          disabled={isChecking || checkingAll}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          id={`btn-delete-${ep.id}`}
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(ep.id)}
                          disabled={isChecking || checkingAll}
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <EndpointModal
          endpoint={editTarget}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
