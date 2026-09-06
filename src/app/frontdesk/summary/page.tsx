'use client';

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';

type SafeSummary = {
  consultationId: string;
  patientName: string;
  folio: string;
  consultationDate: string;
  usage?: string;
  status: string;
  nonClinicalNote?: string;
  nonClinicalNoteKey?: string;
};

const NON_CLINICAL_NOTES = [
  { key: 'follow_up', label: 'Paciente solicita cita de seguimiento' },
  { key: 'external_rx', label: 'Paciente trae receta externa' },
  { key: 'contact_later', label: 'Requiere contacto posterior' },
  { key: 'prefer_phone', label: 'Preferencia de contacto por teléfono' },
  { key: 'prefer_email', label: 'Preferencia de contacto por correo' },
] as const;

export default function FrontdeskSummaryPage() {
  const [query, setQuery] = useState('PT000002');
  const [summary, setSummary] = useState<SafeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadSummary(searchFolio: string) {
    if (!searchFolio.trim()) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const role = localStorage.getItem('demo-role') || 'frontdesk:receptionist';
      const res = await fetch(`/api/frontdesk/summary?folio=${encodeURIComponent(searchFolio.trim())}`, {
        headers: { 'x-demo-role': role },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se encontró resumen');
      if (!data.summary) {
        setSummary(null);
        setError('No hay consultas registradas para este folio.');
      } else {
        setSummary(data.summary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar resumen');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary(query);
  }, []);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    loadSummary(query);
  }

  async function updateNonClinicalNote(newKey: string) {
    if (!summary) return;
    try {
      const role = localStorage.getItem('demo-role') || 'frontdesk:receptionist';
      const res = await fetch(`/api/consultations/${summary.consultationId}/non-clinical-note`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({
          noteKey: newKey || null,
          expectedVersion: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la nota');
      setMessage('Nota no clínica actualizada exitosamente.');
      loadSummary(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  }

  return (
    <main className="shell narrow">
      <p className="eyebrow">MOSTRADOR / RESUMEN SEGURO</p>
      <h1>Atención en Mostrador</h1>
      <p className="lede">
        Consulta el estado de atención y notas operativas sin exponer datos clínicos sensibles ni graduaciones.
      </p>

      <form className="search-row" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Folio del paciente (ej. PT000002)"
          aria-label="Folio del paciente"
          required
        />
        <button className="button primary" type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Consultar'}
        </button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="form-message" role="status">{message}</p>}

      {summary && (
        <section className="form-card" aria-labelledby="summary-title">
          <h2 id="summary-title" style={{ fontSize: '1.5rem', margin: 0 }}>
            Resumen de Atención
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '12px', color: 'var(--muted)' }}>PACIENTE</strong>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{summary.patientName}</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '12px', color: 'var(--muted)' }}>FOLIO</strong>
              <span className="status-pill">{summary.folio}</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '12px', color: 'var(--muted)' }}>ESTADO CONSULTA</strong>
              <span className="status-pill" style={{ textTransform: 'capitalize' }}>
                {summary.status === 'in_progress' ? 'En progreso' : summary.status === 'closed' ? 'Cerrada' : summary.status}
              </span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '12px', color: 'var(--muted)' }}>TIPO DE LENTE</strong>
              <span style={{ textTransform: 'capitalize' }}>{summary.usage || 'Pendiente de prescripción'}</span>
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--line)', margin: '16px 0' }} />

          <div>
            <label htmlFor="note-select">
              Nota operativa (catálogo cerrado para mostrador):
            </label>
            <select
              id="note-select"
              value={summary.nonClinicalNoteKey || ''}
              onChange={(e) => updateNonClinicalNote(e.target.value)}
              style={{ marginTop: '8px' }}
            >
              <option value="">-- Sin nota asignada --</option>
              {NON_CLINICAL_NOTES.map((n) => (
                <option key={n.key} value={n.key}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
            Nota: Este resumen cumple con la minimización de datos (P2 de la Constitución). No contiene esferas, cilindros, ejes ni diagnósticos.
          </p>
        </section>
      )}
    </main>
  );
}
