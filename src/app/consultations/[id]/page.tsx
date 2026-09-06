'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import type { FormEvent } from 'react';

type Refraction = {
  id: string;
  eye: 'OD' | 'OI';
  sphere?: number;
  cylinder?: number;
  axis?: number;
  addition?: number;
  visualAcuity?: string;
  pupillaryDistance?: number;
  isAmendment: boolean;
  amendmentReason?: string;
  createdAt: string;
};

type FullConsultation = {
  consultation: {
    id: string;
    patientId: string;
    status: 'in_progress' | 'closed' | 'abandoned';
    version: number;
    openedAt: string;
    openedBy: string;
  };
  patientFolio: string;
  patientName: string;
  refractions: Refraction[];
  prescriptions: Array<{
    id: string;
    folio: string;
    usage: string;
    version: number;
  }>;
};

export default function ConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const consultationId = resolvedParams.id;

  const [data, setData] = useState<FullConsultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form states for adding refraction
  const [eye, setEye] = useState<'OD' | 'OI'>('OD');
  const [sphere, setSphere] = useState('0.00');
  const [cylinder, setCylinder] = useState('0.00');
  const [axis, setAxis] = useState('');
  const [addition, setAddition] = useState('');
  const [visualAcuity, setVisualAcuity] = useState('20/20');
  const [pupillaryDistance, setPupillaryDistance] = useState('62');

  // Abandon reason
  const [abandonReason, setAbandonReason] = useState('');
  const [showAbandon, setShowAbandon] = useState(false);

  async function loadConsultation() {
    setLoading(true);
    setError('');
    try {
      const role = localStorage.getItem('demo-role') || 'clinical:optometrist';
      const res = await fetch(`/api/consultations/${consultationId}?view=full`, {
        headers: {
          'x-demo-role': role,
          'x-actor-id': 'user-opt-001',
        },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'No se pudo cargar la consulta');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar consulta');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConsultation();
  }, [consultationId]);

  async function handleAddRefraction(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const role = localStorage.getItem('demo-role') || 'clinical:optometrist';
      const res = await fetch(`/api/consultations/${consultationId}/refraction`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
          'x-actor-id': 'user-opt-001',
        },
        body: JSON.stringify({
          eye,
          sphere: sphere ? Number(sphere) : undefined,
          cylinder: cylinder ? Number(cylinder) : undefined,
          axis: axis ? Number(axis) : undefined,
          addition: addition ? Number(addition) : undefined,
          visualAcuity: visualAcuity || undefined,
          pupillaryDistance: pupillaryDistance ? Number(pupillaryDistance) : undefined,
          expectedVersion: data?.consultation.version ?? 1,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'No se pudo registrar la refracción');
      setMessage(`Refracción para ${eye} guardada correctamente.`);
      loadConsultation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  async function handleAbandon(e: FormEvent) {
    e.preventDefault();
    if (!abandonReason.trim()) return;
    try {
      const role = localStorage.getItem('demo-role') || 'clinical:optometrist';
      const res = await fetch(`/api/consultations/${consultationId}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
          'x-actor-id': data?.consultation.openedBy || 'user-opt-001',
        },
        body: JSON.stringify({
          action: 'abandon',
          reason: abandonReason,
          expectedVersion: data?.consultation.version ?? 1,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'No se pudo abandonar la consulta');
      setMessage('Consulta finalizada como abandonada.');
      setShowAbandon(false);
      loadConsultation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abandonar');
    }
  }

  if (loading) {
    return (
      <main className="shell narrow">
        <p>Cargando datos de consulta...</p>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="shell narrow">
        <p className="eyebrow">GABINETE / ERROR</p>
        <h1>Acceso a Consulta</h1>
        <p className="error" role="alert">{error}</p>
        <p className="lede">
          Recuerda que para acceder al expediente clínico completo debes tener rol de <strong>Optometrista</strong>.
        </p>
        <Link href="/" className="button secondary">Volver al inicio</Link>
      </main>
    );
  }

  const odRefraction = data?.refractions.filter((r) => r.eye === 'OD' && !r.isAmendment).pop();
  const oiRefraction = data?.refractions.filter((r) => r.eye === 'OI' && !r.isAmendment).pop();
  const canPrescribe = Boolean(odRefraction && oiRefraction && data?.consultation.status === 'in_progress');

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">GABINETE / CONSULTA CLÍNICA</p>
          <h1>Consulta Optométrica</h1>
          <p className="lede">
            Paciente: <strong>{data?.patientName}</strong> · Folio: <code>{data?.patientFolio}</code> · Estado:{' '}
            <span className="status-pill">{data?.consultation.status}</span>
          </p>
        </div>
        <div className="actions">
          {canPrescribe && (
            <Link
              href={`/consultations/${consultationId}/prescription`}
              className="button primary"
            >
              Emitir Prescripción
            </Link>
          )}
          {data?.consultation.status === 'in_progress' && (
            <button
              className="button secondary"
              onClick={() => setShowAbandon(!showAbandon)}
            >
              Abandonar Consulta
            </button>
          )}
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="form-message" role="status">{message}</p>}

      {showAbandon && (
        <form className="form-card" onSubmit={handleAbandon} style={{ marginBottom: '24px' }}>
          <h3>Motivo de abandono de consulta</h3>
          <p className="lede">Indica la causa por la que no se emitió prescripción (ej. paciente se retira, midriasis requerida):</p>
          <input
            value={abandonReason}
            onChange={(e) => setAbandonReason(e.target.value)}
            placeholder="Motivo obligatorio..."
            required
          />
          <div className="actions">
            <button className="button primary" type="submit">Confirmar Abandono</button>
            <button className="button secondary" type="button" onClick={() => setShowAbandon(false)}>Cancelar</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Panel de Refracción Vigente */}
        <section className="hero-card" aria-labelledby="refraction-title">
          <h2 id="refraction-title">Refracción Registrada</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div style={{ background: '#faf8f2', padding: '16px', border: '1px solid var(--line)' }}>
              <strong>OJO DERECHO (OD)</strong>
              {odRefraction ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0', fontSize: '14px', lineHeight: '1.8' }}>
                  <li>Esfera: <b>{odRefraction.sphere ?? '0.00'} D</b></li>
                  <li>Cilindro: <b>{odRefraction.cylinder ?? '0.00'} D</b></li>
                  <li>Eje: <b>{odRefraction.axis ? `${odRefraction.axis}°` : '—'}</b></li>
                  <li>Adición: <b>{odRefraction.addition ? `+${odRefraction.addition}` : '—'}</b></li>
                  <li>AV: <b>{odRefraction.visualAcuity || '—'}</b></li>
                  <li>DP: <b>{odRefraction.pupillaryDistance ? `${odRefraction.pupillaryDistance} mm` : '—'}</b></li>
                </ul>
              ) : (
                <p className="empty">Sin refracción OD</p>
              )}
            </div>

            <div style={{ background: '#faf8f2', padding: '16px', border: '1px solid var(--line)' }}>
              <strong>OJO IZQUIERDO (OI)</strong>
              {oiRefraction ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0', fontSize: '14px', lineHeight: '1.8' }}>
                  <li>Esfera: <b>{oiRefraction.sphere ?? '0.00'} D</b></li>
                  <li>Cilindro: <b>{oiRefraction.cylinder ?? '0.00'} D</b></li>
                  <li>Eje: <b>{oiRefraction.axis ? `${oiRefraction.axis}°` : '—'}</b></li>
                  <li>Adición: <b>{oiRefraction.addition ? `+${oiRefraction.addition}` : '—'}</b></li>
                  <li>AV: <b>{oiRefraction.visualAcuity || '—'}</b></li>
                  <li>DP: <b>{oiRefraction.pupillaryDistance ? `${oiRefraction.pupillaryDistance} mm` : '—'}</b></li>
                </ul>
              ) : (
                <p className="empty">Sin refracción OI</p>
              )}
            </div>
          </div>

          {data?.prescriptions && data.prescriptions.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3>Prescripción Emitida</h3>
              <p>Folio: <strong>{data.prescriptions[0].folio}</strong> · Uso: <strong>{data.prescriptions[0].usage}</strong></p>
            </div>
          )}
        </section>

        {/* Formulario de captura táctil */}
        {data?.consultation.status === 'in_progress' && (
          <section className="form-card" aria-labelledby="form-title">
            <h2 id="form-title" style={{ fontSize: '1.5rem', margin: 0 }}>Captura de Refracción</h2>
            <form onSubmit={handleAddRefraction}>
              <label>
                Ojo a registrar:
                <select value={eye} onChange={(e) => setEye(e.target.value as 'OD' | 'OI')}>
                  <option value="OD">Ojo Derecho (OD)</option>
                  <option value="OI">Ojo Izquierdo (OI)</option>
                </select>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Esfera (D):
                  <input
                    type="number"
                    step="0.25"
                    value={sphere}
                    onChange={(e) => setSphere(e.target.value)}
                    placeholder="-20.00 a +20.00"
                    required
                  />
                </label>

                <label>
                  Cilindro (conv. negativa):
                  <input
                    type="number"
                    step="0.25"
                    max="0"
                    value={cylinder}
                    onChange={(e) => setCylinder(e.target.value)}
                    placeholder="-10.00 a 0.00"
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Eje (grados 1-180):
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={axis}
                    onChange={(e) => setAxis(e.target.value)}
                    placeholder="Obligatorio si cil != 0"
                    required={Number(cylinder) !== 0}
                  />
                </label>

                <label>
                  Adición (+0.50 a +4.00):
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="4.00"
                    value={addition}
                    onChange={(e) => setAddition(e.target.value)}
                    placeholder="Opcional"
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Agudeza Visual:
                  <input
                    value={visualAcuity}
                    onChange={(e) => setVisualAcuity(e.target.value)}
                    placeholder="20/20, 20/40..."
                  />
                </label>

                <label>
                  Distancia Pupilar (mm):
                  <input
                    type="number"
                    value={pupillaryDistance}
                    onChange={(e) => setPupillaryDistance(e.target.value)}
                    placeholder="40 a 80"
                  />
                </label>
              </div>

              <button className="button primary" type="submit" style={{ marginTop: '16px' }}>
                Guardar Refracción {eye}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
