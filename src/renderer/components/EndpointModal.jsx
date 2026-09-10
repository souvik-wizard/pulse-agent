import React, { useState } from 'react';

const api = window.electronAPI;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * EndpointModal — Modal dialog for adding or editing a TCP endpoint.
 *
 * @param {object|null} endpoint — Existing endpoint to edit, or null for adding new
 * @param {function} onSave — Callback with the saved endpoint object
 * @param {function} onClose — Callback to close the modal
 */
export default function EndpointModal({ endpoint, onSave, onClose }) {
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
