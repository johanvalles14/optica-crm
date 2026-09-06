'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import type { FormEvent } from 'react';

const LENS_USAGES = [
  { id: 'lejos', label: 'Visión Lejana' },
  { id: 'cerca', label: 'Visión Cercana (Lectura)' },
  { id: 'bifocal', label: 'Bifocal' },
  { id: 'progresivo', label: 'Progresivo / Multifocal' },
  { id: 'contacto', label: 'Lentes de Contacto' },
] as const;

export default function IssuePrescriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const consultationId = resolvedParams.id;

  const [usage, setUsage] = useState<string>('lejos');
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);
  const [issuedFolio, setIssuedFolio] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const role = localStorage.getItem('demo-role') || 'clinical:optometrist';
      const res = await fetch(`/api/consultations/${consultationId}/prescription`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
          'x-actor-id': 'user-opt-001',
        },
        body: JSON.stringify({
          usage,
          observations: observations || undefined,
          expectedVersion: 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo emitir la prescripción');
      setIssuedFolio(data.prescription.folio);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al emitir prescripción');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell narrow">
      <p className="eyebrow">GABINETE / EMISIÓN DE PRESCRIPCIÓN</p>
      <h1>Prescripción Óptica</h1>
      <p className="lede">
        Al confirmar la prescripción se creará un snapshot inmutable de las refracciones OD/OI y la consulta pasará a estado cerrado.
      </p>

      {error && <p className="error" role="alert">{error}</p>}

      {issuedFolio ? (
        <section className="form-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <span className="status-pill" style={{ background: '#eaf5ea', color: '#186a3b', fontWeight: 'bold' }}>
            ✓ Prescripción emitida exitosamente
          </span>
          <h2 style={{ margin: '20px 0 10px' }}>Folio: {issuedFolio}</h2>
          <p className="lede" style={{ margin: '0 auto 24px' }}>
            La prescripción ha sido sellada y la consulta cerrada. El resumen ya está disponible para el mostrador de ventas.
          </p>
          <div className="actions" style={{ justifyContent: 'center' }}>
            <Link href={`/consultations/${consultationId}`} className="button secondary">
              Ver Consulta
            </Link>
            <Link href="/frontdesk/summary" className="button primary">
              Ir a Mostrador
            </Link>
          </div>
        </section>
      ) : (
        <form className="form-card" onSubmit={handleSubmit}>
          <label htmlFor="usage-select">
            Uso o tipo de lente recomendado:
            <select
              id="usage-select"
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              required
            >
              {LENS_USAGES.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Observaciones o recomendaciones clínicas:
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ej. Uso continuo en computadora, filtro antirreflejante sugerido..."
              rows={3}
              style={{
                border: '1px solid var(--line)',
                font: '16px Arial, sans-serif',
                padding: '12px',
                width: '100%',
              }}
            />
          </label>

          <div style={{ background: '#faf8f2', padding: '16px', border: '1px solid var(--line)', fontSize: '13px' }}>
            <strong>Garantía de Inmutabilidad (Principio P1):</strong>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
              Esta acción congela los valores de refracción registrados. Si posteriormente se detecta un error, no se sobrescribirá: se requerirá registrar una enmienda justificada.
            </p>
          </div>

          <div className="actions" style={{ marginTop: '16px' }}>
            <button className="button primary" type="submit" disabled={loading}>
              {loading ? 'Sellando prescripción...' : 'Emitir y Cerrar Consulta'}
            </button>
            <Link href={`/consultations/${consultationId}`} className="button secondary">
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}
