'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Refraction = {
  eye: 'OD' | 'OI';
  sphere?: number;
  cylinder?: number;
  axis?: number;
  addition?: number;
  visualAcuity?: string;
  pupillaryDistance?: number;
};

type ReceptionQueueItem = {
  consultation: {
    id: string;
    status: string;
    openedAt: string;
    closedAt?: string;
    diagnosis?: string;
    clinicalNotes?: string;
  };
  patient: {
    id: string;
    folio: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
    allergies?: string;
    conditions?: string;
    emergencyContact?: { name: string; phone: string };
  };
  refractions: Refraction[];
  prescription: {
    id: string;
    folio: string;
    usage: string;
    observations?: string;
    rightEyeSnapshot: Refraction;
    leftEyeSnapshot: Refraction;
  };
};

function fullName(patient: ReceptionQueueItem['patient']): string {
  return [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
}

function lensUsageLabel(usage: string): string {
  return {
    lejos: 'Visión lejana',
    cerca: 'Visión cercana',
    bifocal: 'Bifocal',
    progresivo: 'Progresivo',
    contacto: 'Lentes de contacto',
  }[usage] || usage;
}

function refractionText(refraction: Refraction): string {
  return [
    `ESF ${refraction.sphere ?? '—'}`,
    `CIL ${refraction.cylinder ?? '—'}`,
    `EJE ${refraction.axis ?? '—'}`,
    `ADD ${refraction.addition ?? '—'}`,
    `DP ${refraction.pupillaryDistance ?? '—'}`,
  ].join(' · ');
}

export default function FrontdeskSummaryPage() {
  const [queue, setQueue] = useState<ReceptionQueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  async function loadQueue(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const role = localStorage.getItem('demo-role') || 'frontdesk:receptionist';
      const response = await fetch('/api/frontdesk/queue', {
        headers: { 'x-demo-role': role, 'x-actor-id': 'user-rec-001' },
      });
      const data = await response.json() as { queue?: ReceptionQueueItem[]; refreshedAt?: string; error?: string };
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar la cola');
      setQueue(data.queue ?? []);
      setRefreshedAt(data.refreshedAt ?? new Date().toISOString());
      setSelectedId((current) => current && data.queue?.some((item) => item.consultation.id === current) ? current : null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la cola');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue(true);
    const timer = window.setInterval(() => loadQueue(), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const selected = queue.find((item) => item.consultation.id === selectedId) ?? null;

  return (
    <main className="shell tablet-shell">
      <header className="topbar tablet-topbar">
        <div>
          <p className="eyebrow">RECEPCIÓN / ENTREGA CLÍNICA</p>
          <h1>Listos para cotizar</h1>
          <p className="lede">
            Las recetas emitidas en gabinete aparecen aquí automáticamente. La información clínica está visible temporalmente para preparar la cotización correcta.
          </p>
        </div>
        <div className="actions">
          <span className="status-pill">{queue.length} pendiente{queue.length === 1 ? '' : 's'}</span>
          <button className="button secondary" type="button" onClick={() => loadQueue(true)} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar ahora'}
          </button>
        </div>
      </header>

      <section className="queue-banner" aria-live="polite">
        <strong>Sincronización automática activa</strong>
        <span>{refreshedAt ? `Última actualización: ${new Date(refreshedAt).toLocaleTimeString('es-MX')}` : 'Conectando con gabinete...'}</span>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="handoff-list" aria-label="Cola de pacientes listos para cotizar">
        {queue.map((item) => {
          const isSelected = selectedId === item.consultation.id;
          return (
            <article className={`handoff-row${isSelected ? ' is-selected' : ''}`} key={item.consultation.id}>
              <div>
                <span className="status-pill">{item.patient.folio}</span>
                <span className="status-pill handoff-rx">{item.prescription.folio}</span>
                <h2>{fullName(item.patient)}</h2>
                <p>{lensUsageLabel(item.prescription.usage)} · {item.patient.phone} · Cerrada {item.consultation.closedAt ? new Date(item.consultation.closedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'recién'}</p>
                <p className="handoff-diagnosis"><strong>Diagnóstico:</strong> {item.consultation.diagnosis || 'Sin diagnóstico registrado'}</p>
              </div>
              <div className="handoff-actions">
                <button className="button secondary" type="button" onClick={() => setSelectedId(isSelected ? null : item.consultation.id)}>
                  {isSelected ? 'Ocultar expediente' : 'Ver expediente'}
                </button>
                <Link
                  className="button primary"
                  href={`/sales/pos?consultationId=${encodeURIComponent(item.consultation.id)}&patientId=${encodeURIComponent(item.patient.id)}&prescriptionId=${encodeURIComponent(item.prescription.id)}`}
                >
                  Abrir cotización
                </Link>
              </div>
            </article>
          );
        })}
        {!loading && queue.length === 0 && !error && (
          <p className="empty">No hay pacientes pendientes. Cuando el optometrista emita una receta, aparecerá aquí sin recargar la página.</p>
        )}
      </section>

      {selected && (
        <section className="workspace-panel reception-detail" aria-labelledby="reception-detail-title">
          <div className="workspace-heading">
            <div>
              <p className="eyebrow">EXPEDIENTE ENTREGADO</p>
              <h2 id="reception-detail-title">{fullName(selected.patient)}</h2>
              <p>Receta {selected.prescription.folio} · {lensUsageLabel(selected.prescription.usage)}</p>
            </div>
            <Link
              className="button primary"
              href={`/sales/pos?consultationId=${encodeURIComponent(selected.consultation.id)}&patientId=${encodeURIComponent(selected.patient.id)}&prescriptionId=${encodeURIComponent(selected.prescription.id)}`}
            >
              Cotizar con estos datos
            </Link>
          </div>

          <div className="reception-data-grid">
            <div>
              <h3>Contacto y expediente</h3>
              <p><strong>Folio:</strong> {selected.patient.folio}</p>
              <p><strong>Teléfono:</strong> {selected.patient.phone}</p>
              <p><strong>Correo:</strong> {selected.patient.email || 'Sin registro'}</p>
              <p><strong>Domicilio:</strong> {selected.patient.address || 'Sin registro'}</p>
              <p><strong>Antecedentes:</strong> {selected.patient.conditions || 'Sin registro'}</p>
              <p><strong>Alergias:</strong> {selected.patient.allergies || 'Sin registro'}</p>
              <p><strong>Contacto de emergencia:</strong> {selected.patient.emergencyContact ? `${selected.patient.emergencyContact.name} · ${selected.patient.emergencyContact.phone}` : 'Sin registro'}</p>
            </div>
            <div>
              <h3>Clínico y recomendación</h3>
              <p><strong>Diagnóstico:</strong> {selected.consultation.diagnosis || 'Sin diagnóstico registrado'}</p>
              <p><strong>Notas clínicas:</strong> {selected.consultation.clinicalNotes || 'Sin notas clínicas registradas'}</p>
              <p><strong>Uso recomendado:</strong> {lensUsageLabel(selected.prescription.usage)}</p>
              <p><strong>Observaciones de receta:</strong> {selected.prescription.observations || 'Sin observaciones adicionales'}</p>
            </div>
          </div>

          <div className="rx-grid" aria-label="Graduación de receta">
            <div>
              <h3>OD</h3>
              <p>{refractionText(selected.prescription.rightEyeSnapshot)}</p>
              <p>AV {selected.prescription.rightEyeSnapshot.visualAcuity || '—'}</p>
            </div>
            <div>
              <h3>OI</h3>
              <p>{refractionText(selected.prescription.leftEyeSnapshot)}</p>
              <p>AV {selected.prescription.leftEyeSnapshot.visualAcuity || '—'}</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
