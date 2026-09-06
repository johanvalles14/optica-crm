'use client';

import { useEffect, useState, use } from 'react';
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
  createdAt: string;
};

type FullConsultation = {
  consultation: {
    id: string;
    patientId: string;
    status: 'in_progress' | 'closed' | 'abandoned';
    version: number;
    openedAt: string;
    diagnosis?: string;
    clinicalNotes?: string;
  };
  patient: {
    folio: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    phone: string;
    email?: string;
    allergies?: string;
    conditions?: string;
  };
  refractions: Refraction[];
  prescription?: {
    id: string;
    folio: string;
    usage: string;
    observations?: string;
  };
};

function patientName(patient: FullConsultation['patient']): string {
  return [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
}

export default function ConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const consultationId = resolvedParams.id;
  const [data, setData] = useState<FullConsultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingClinicalDetails, setSavingClinicalDetails] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [eye, setEye] = useState<'OD' | 'OI'>('OD');
  const [sphere, setSphere] = useState('0.00');
  const [cylinder, setCylinder] = useState('0.00');
  const [axis, setAxis] = useState('');
  const [addition, setAddition] = useState('');
  const [visualAcuity, setVisualAcuity] = useState('20/20');
  const [pupillaryDistance, setPupillaryDistance] = useState('62');
  const [abandonReason, setAbandonReason] = useState('');
  const [showAbandon, setShowAbandon] = useState(false);

  async function loadConsultation() {
    setLoading(true);
    setError('');
    try {
      const role = localStorage.getItem('demo-role') || 'clinical:optometrist';
      const response = await fetch(`/api/consultations/${consultationId}?view=full`, {
        headers: {
          'x-demo-role': role,
          'x-actor-id': 'user-opt-001',
        },
      });
      const result = await response.json() as FullConsultation & { error?: string };
      if (!response.ok) throw new Error(result.error || 'No se pudo cargar la consulta');
      setData(result);
      setDiagnosis(result.consultation.diagnosis || '');
      setClinicalNotes(result.consultation.clinicalNotes || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar consulta');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConsultation();
  }, [consultationId]);

  async function saveClinicalDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;
    setSavingClinicalDetails(true);
    setMessage('');
    setError('');
    try {
      const role = localStorage.getItem('demo-role') || 'clinical:optometrist';
      const response = await fetch(`/api/consultations/${consultationId}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
          'x-actor-id': 'user-opt-001',
        },
        body: JSON.stringify({
          action: 'clinical_details',
          diagnosis,
          clinicalNotes,
          expectedVersion: data.consultation.version,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar la información clínica');
      setMessage('Diagnóstico y notas clínicas guardados.');
      await loadConsultation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la información clínica');
    } finally {
      setSavingClinicalDetails(false);
    }
  }

  async function handleAddRefraction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const role = localStorage.getItem('demo-role') || 'clinical:optometrist';
      const response = await fetch(`/api/consultations/${consultationId}/refraction`, {
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
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'No se pudo registrar la refracción');
      setMessage(`Refracción para ${eye} guardada correctamente.`);
      await loadConsultation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la refracción');
    }
  }

  async function handleAbandon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!abandonReason.trim()) return;
    try {
      const role = localStorage.getItem('demo-role') || 'clinical:optometrist';
      const response = await fetch(`/api/consultations/${consultationId}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
          'x-actor-id': 'user-opt-001',
        },
        body: JSON.stringify({
          action: 'abandon',
          reason: abandonReason,
          expectedVersion: data?.consultation.version ?? 1,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'No se pudo abandonar la consulta');
      setMessage('Consulta finalizada como abandonada.');
      setShowAbandon(false);
      await loadConsultation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abandonar la consulta');
    }
  }

  if (loading) {
    return <main className="shell narrow"><p>Cargando datos de consulta...</p></main>;
  }

  if (error && !data) {
    return (
      <main className="shell narrow">
        <p className="eyebrow">GABINETE / ERROR</p>
        <h1>Acceso a consulta</h1>
        <p className="error" role="alert">{error}</p>
        <Link href="/consultations" className="button secondary">Volver al gabinete</Link>
      </main>
    );
  }

  const odRefraction = data?.refractions.filter((refraction) => refraction.eye === 'OD' && !refraction.isAmendment).pop();
  const oiRefraction = data?.refractions.filter((refraction) => refraction.eye === 'OI' && !refraction.isAmendment).pop();
  const eyeReadings: Array<{ eye: 'OD' | 'OI'; refraction?: Refraction }> = [
    { eye: 'OD', refraction: odRefraction },
    { eye: 'OI', refraction: oiRefraction },
  ];
  const canPrescribe = Boolean(odRefraction && oiRefraction && data?.consultation.status === 'in_progress');

  return (
    <main className="shell tablet-shell">
      <header className="topbar tablet-topbar">
        <div>
          <p className="eyebrow">GABINETE / CONSULTA CLÍNICA</p>
          <h1>Consulta optométrica</h1>
          <p className="lede">
            Paciente: <strong>{data ? patientName(data.patient) : ''}</strong> · Folio: <code>{data?.patient.folio}</code> · Estado:{' '}
            <span className="status-pill">{data?.consultation.status}</span>
          </p>
        </div>
        <div className="actions">
          {canPrescribe && <Link href={`/consultations/${consultationId}/prescription`} className="button primary">Emitir y enviar receta</Link>}
          {data?.consultation.status === 'in_progress' && (
            <button className="button secondary" type="button" onClick={() => setShowAbandon(!showAbandon)}>
              Abandonar consulta
            </button>
          )}
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="form-message" role="status">{message}</p>}

      {showAbandon && (
        <form className="form-card" onSubmit={handleAbandon}>
          <h2>Motivo de abandono</h2>
          <input value={abandonReason} onChange={(event) => setAbandonReason(event.target.value)} placeholder="Motivo obligatorio" required />
          <div className="actions">
            <button className="button primary" type="submit">Confirmar abandono</button>
            <button className="button secondary" type="button" onClick={() => setShowAbandon(false)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="clinical-layout">
        <section className="workspace-panel clinical-dossier" aria-labelledby="clinical-details-title">
          <div className="workspace-heading">
            <div>
              <h2 id="clinical-details-title">Expediente y diagnóstico</h2>
              <p>Estos datos viajarán completos a recepción al emitir la receta.</p>
            </div>
            <span className="status-pill">Versión {data?.consultation.version}</span>
          </div>

          <dl className="patient-facts">
            <div><dt>Teléfono</dt><dd>{data?.patient.phone || 'Sin registro'}</dd></div>
            <div><dt>Correo</dt><dd>{data?.patient.email || 'Sin registro'}</dd></div>
            <div><dt>Antecedentes</dt><dd>{data?.patient.conditions || 'Sin registro'}</dd></div>
            <div><dt>Alergias</dt><dd>{data?.patient.allergies || 'Sin registro'}</dd></div>
          </dl>

          {data?.consultation.status === 'in_progress' ? (
            <form className="clinical-form" onSubmit={saveClinicalDetails}>
              <label>
                Diagnóstico o impresión clínica
                <textarea value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} rows={3} placeholder="Ej. Miopía con astigmatismo leve" />
              </label>
              <label>
                Hallazgos y notas clínicas
                <textarea value={clinicalNotes} onChange={(event) => setClinicalNotes(event.target.value)} rows={4} placeholder="Hallazgos relevantes, recomendaciones o seguimiento" />
              </label>
              <button className="button secondary" type="submit" disabled={savingClinicalDetails}>
                {savingClinicalDetails ? 'Guardando...' : 'Guardar expediente'}
              </button>
            </form>
          ) : (
            <div className="clinical-readonly">
              <p><strong>Diagnóstico:</strong> {data?.consultation.diagnosis || 'Sin diagnóstico registrado'}</p>
              <p><strong>Notas:</strong> {data?.consultation.clinicalNotes || 'Sin notas clínicas registradas'}</p>
            </div>
          )}
        </section>

        <section className="workspace-panel" aria-labelledby="refraction-title">
          <div className="workspace-heading">
            <div>
              <h2 id="refraction-title">Refracción vigente</h2>
              <p>La receta se habilita cuando OD y OI estén registrados.</p>
            </div>
          </div>
          <div className="eye-grid">
            {eyeReadings.map(({ eye: eyeName, refraction }) => (
              <div className="eye-reading" key={eyeName}>
                <strong>Ojo {eyeName === 'OD' ? 'derecho' : 'izquierdo'} ({eyeName})</strong>
                {refraction ? (
                  <ul>
                    <li>Esfera: <b>{refraction.sphere ?? '0.00'} D</b></li>
                    <li>Cilindro: <b>{refraction.cylinder ?? '0.00'} D</b></li>
                    <li>Eje: <b>{refraction.axis ? `${refraction.axis}°` : '—'}</b></li>
                    <li>Adición: <b>{refraction.addition ? `+${refraction.addition}` : '—'}</b></li>
                    <li>AV: <b>{refraction.visualAcuity || '—'}</b></li>
                    <li>DP: <b>{refraction.pupillaryDistance ? `${refraction.pupillaryDistance} mm` : '—'}</b></li>
                  </ul>
                ) : <p className="empty">Sin refracción {eyeName}</p>}
              </div>
            ))}
          </div>
          {data?.prescription && (
            <p className="clinical-readonly"><strong>Receta emitida:</strong> {data.prescription.folio} · {data.prescription.usage}</p>
          )}
        </section>
      </div>

      {data?.consultation.status === 'in_progress' && (
        <section className="form-card tablet-capture" aria-labelledby="capture-title">
          <div className="workspace-heading">
            <div>
              <h2 id="capture-title">Captura de refracción</h2>
              <p>Campos amplios para toma táctil en tablet.</p>
            </div>
          </div>
          <form onSubmit={handleAddRefraction}>
            <div className="capture-grid">
              <label>
                Ojo a registrar
                <select value={eye} onChange={(event) => setEye(event.target.value as 'OD' | 'OI')}>
                  <option value="OD">Ojo derecho (OD)</option>
                  <option value="OI">Ojo izquierdo (OI)</option>
                </select>
              </label>
              <label>
                Esfera (D)
                <input type="number" step="0.25" value={sphere} onChange={(event) => setSphere(event.target.value)} required />
              </label>
              <label>
                Cilindro (conv. negativa)
                <input type="number" step="0.25" max="0" value={cylinder} onChange={(event) => setCylinder(event.target.value)} />
              </label>
              <label>
                Eje (1-180)
                <input type="number" min="1" max="180" value={axis} onChange={(event) => setAxis(event.target.value)} required={Number(cylinder) !== 0} />
              </label>
              <label>
                Adición
                <input type="number" step="0.25" min="0" max="4" value={addition} onChange={(event) => setAddition(event.target.value)} />
              </label>
              <label>
                Agudeza visual
                <input value={visualAcuity} onChange={(event) => setVisualAcuity(event.target.value)} placeholder="20/20" />
              </label>
              <label>
                Distancia pupilar (mm)
                <input type="number" value={pupillaryDistance} onChange={(event) => setPupillaryDistance(event.target.value)} />
              </label>
            </div>
            <button className="button primary" type="submit">Guardar refracción {eye}</button>
          </form>
        </section>
      )}
    </main>
  );
}
