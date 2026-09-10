import { useEffect, useState } from 'react';
import EndpointModal from '../components/EndpointModal';
import StatusBadge from '../components/StatusBadge';
import LatencyCell from '../components/LatencyCell';

const api = window.electronAPI;

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
