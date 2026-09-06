'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type PatientData = {
  id: string;
  folio: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: string;
  sex: string;
  phone: string;
  email?: string;
  address?: string;
  allergies?: string;
  conditions?: string;
  status: string;
  consultations?: Array<{
    id: string;
    status: string;
    openedAt: string;
    closedAt?: string;
    diagnosis?: string;
    clinicalNotes?: string;
    refractions?: Array<{
      eye: 'OD' | 'OI';
      sphere?: number;
      cylinder?: number;
      axis?: number;
      addition?: number;
      visualAcuity?: string;
    }>;
    prescriptions?: Array<{
      id: string;
      folio: string;
      usage: string;
      issuedAt: string;
      observations?: string;
      rightEyeSnapshot?: any;
      leftEyeSnapshot?: any;
    }>;
  }>;
  saleOrders?: Array<{
    id: string;
    folio: string;
    status: string;
    total: number;
    paidAmount: number;
    balanceDue: number;
    createdAt: string;
    items?: Array<{ description: string; quantity: number }>;
  }>;
  consents?: Array<{
    id: string;
    grantedAt: string;
    source: string;
  }>;
};

function calculateAge(birthDateStr: string): string {
  try {
    const birth = new Date(birthDateStr);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age > 0 ? `${age} años` : 'Menor de 1 año';
  } catch {
    return '';
  }
}

function sexLabel(sex: string): string {
  switch (sex) {
    case 'female': return 'Femenino';
    case 'male': return 'Masculino';
    case 'other': return 'Otro';
    default: return 'No especificado';
  }
}

function orderStatusBadge(status: string) {
  switch (status) {
    case 'delivered_paid':
      return <span className="status-pill success">Entregado</span>;
    case 'confirmed_in_process':
      return <span className="status-pill process">En preparación</span>;
    case 'ready_for_delivery':
      return <span className="status-pill warning">Listo para entrega</span>;
    case 'pending_deposit':
      return <span className="status-pill warning">Pendiente anticipo</span>;
    case 'quote':
      return <span className="status-pill">Cotización</span>;
    case 'cancelled':
      return <span className="status-pill danger">Cancelado</span>;
    default:
      return <span className="status-pill">{status}</span>;
  }
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'consultas' | 'pedidos' | 'salud'>('consultas');

  useEffect(() => {
    async function fetchPatient() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const role = localStorage.getItem('demo-role') || 'frontdesk:receptionist';
        const res = await fetch(`/api/patients/${id}`, {
          headers: { 'x-demo-role': role },
        });
        const data = await res.json();
        if (!res.ok || !data.patient) {
          throw new Error(data.error || 'No se encontró el expediente');
        }
        setPatient(data.patient);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setLoading(false);
      }
    }
    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <main className="shell">
        <div className="empty">
          <p>Cargando ficha del paciente...</p>
        </div>
      </main>
    );
  }

  if (error || !patient) {
    return (
      <main className="shell narrow">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <span style={{ fontSize: '32px' }}>⚠️</span>
          <h2>Expediente no localizado</h2>
          <p className="lede">{error || 'El folio o ID ingresado no corresponde a ningún paciente.'}</p>
          <div className="actions" style={{ justifyContent: 'center' }}>
            <Link href="/patients/search" className="button primary">
              ← Buscar otros pacientes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const fullName = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
  const latestConsultation = patient.consultations?.[0];
  const latestPrescription = latestConsultation?.prescriptions?.[0];
  const activeOrder = patient.saleOrders?.find((o) => o.status !== 'delivered_paid' && o.status !== 'cancelled');

  // Obtener la graduación más reciente
  const rightEye = latestConsultation?.refractions?.find((r) => r.eye === 'OD');
  const leftEye = latestConsultation?.refractions?.find((r) => r.eye === 'OI');

  return (
    <main className="shell">
      {/* Cabecera Principal de la Ficha */}
      <header className="card" style={{ marginBottom: '24px', padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 700,
              }}
            >
              {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.65rem', margin: 0 }}>{fullName}</h1>
                <span className="status-pill" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  Folio: {patient.folio}
                </span>
                <span className="status-pill success">Expediente Activo</span>
              </div>

              <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
                {calculateAge(patient.birthDate)} · Sexo: {sexLabel(patient.sex)} · Tel: <strong>{patient.phone}</strong>
                {patient.email && ` · Email: ${patient.email}`}
              </p>
            </div>
          </div>

          {/* Botones de Acción Inmediata */}
          <div className="actions">
            <Link
              href={`/sales/pos?patientId=${patient.id}&patientName=${encodeURIComponent(fullName)}`}
              className="button primary"
            >
              👓 Nueva Venta / Lentes
            </Link>

            <Link
              href={`/consultations`}
              className="button secondary"
            >
              🔬 Iniciar Consulta
            </Link>
          </div>
        </div>
      </header>

      {/* Grid de Resumen Rápido (Graduación + Pedido Activo) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Tarjeta de Graduación */}
        <div className="card">
          <div className="card-header">
            <h3>👁️ Última Graduación Registrada</h3>
            {latestPrescription && (
              <span className="status-pill process" style={{ fontSize: '11px' }}>
                Receta {latestPrescription.folio}
              </span>
            )}
          </div>

          {rightEye || leftEye ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ background: 'var(--card-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center', fontSize: '12px' }}>
                  <span style={{ fontWeight: 700, textAlign: 'left' }}>Ojo</span>
                  <span style={{ color: 'var(--muted)' }}>Esfera</span>
                  <span style={{ color: 'var(--muted)' }}>Cilindro</span>
                  <span style={{ color: 'var(--muted)' }}>Eje</span>
                  <span style={{ color: 'var(--muted)' }}>Adición</span>

                  <strong style={{ textAlign: 'left', color: 'var(--accent)' }}>OD (Der)</strong>
                  <span>{rightEye?.sphere !== undefined ? `${rightEye.sphere > 0 ? '+' : ''}${rightEye.sphere}` : '-'}</span>
                  <span>{rightEye?.cylinder !== undefined ? rightEye.cylinder : '-'}</span>
                  <span>{rightEye?.axis !== undefined ? `${rightEye.axis}°` : '-'}</span>
                  <span>{rightEye?.addition !== undefined ? `+${rightEye.addition}` : '-'}</span>

                  <strong style={{ textAlign: 'left', color: 'var(--accent)' }}>OI (Izq)</strong>
                  <span>{leftEye?.sphere !== undefined ? `${leftEye.sphere > 0 ? '+' : ''}${leftEye.sphere}` : '-'}</span>
                  <span>{leftEye?.cylinder !== undefined ? leftEye.cylinder : '-'}</span>
                  <span>{leftEye?.axis !== undefined ? `${leftEye.axis}°` : '-'}</span>
                  <span>{leftEye?.addition !== undefined ? `+${leftEye.addition}` : '-'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--muted)' }}>
                <span>Fecha examen: {latestConsultation ? new Date(latestConsultation.openedAt).toLocaleDateString() : '-'}</span>
                <Link
                  href={`/sales/pos?patientId=${patient.id}&patientName=${encodeURIComponent(fullName)}${latestPrescription ? `&prescriptionId=${latestPrescription.id}` : ''}`}
                  style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
                >
                  Usar graduación en cotizador →
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 10px' }}>
                Este paciente aún no cuenta con graduación registrada.
              </p>
              <Link href="/consultations" className="button secondary" style={{ fontSize: '12px', minHeight: '32px' }}>
                Realizar examen de refracción
              </Link>
            </div>
          )}
        </div>

        {/* Tarjeta de Pedido en Curso */}
        <div className="card">
          <div className="card-header">
            <h3>📦 Pedido Óptico en Mostrador</h3>
            {activeOrder && orderStatusBadge(activeOrder.status)}
          </div>

          {activeOrder ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '15px' }}>
                    {activeOrder.folio}
                  </span>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted)' }}>
                    Fecha: {new Date(activeOrder.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total: ${activeOrder.total} MXN</span>
                  <strong style={{ display: 'block', fontSize: '16px', color: activeOrder.balanceDue > 0 ? 'var(--accent)' : 'var(--success)' }}>
                    {activeOrder.balanceDue > 0 ? `Resta: $${activeOrder.balanceDue} MXN` : 'Liquidado'}
                  </strong>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                  Artículos: {activeOrder.items?.map((it) => it.description).join(' + ') || 'Lentes graduados'}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <Link href="/sales/orders" className="button secondary" style={{ fontSize: '12px', minHeight: '32px' }}>
                  Ver en seguimiento de entregas →
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 10px' }}>
                No hay pedidos de lentes pendientes en taller o mostrador.
              </p>
              <Link
                href={`/sales/pos?patientId=${patient.id}&patientName=${encodeURIComponent(fullName)}`}
                className="button primary"
                style={{ fontSize: '12px', minHeight: '32px' }}
              >
                + Cotizar y Crear Pedido
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Pestañas de Historial */}
      <section className="card">
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '20px' }}>
          <button
            type="button"
            className={`button ${activeTab === 'consultas' ? 'primary' : 'subtle'}`}
            onClick={() => setActiveTab('consultas')}
            style={{ minHeight: '34px', padding: '6px 14px' }}
          >
            Historial Clínico ({patient.consultations?.length || 0})
          </button>

          <button
            type="button"
            className={`button ${activeTab === 'pedidos' ? 'primary' : 'subtle'}`}
            onClick={() => setActiveTab('pedidos')}
            style={{ minHeight: '34px', padding: '6px 14px' }}
          >
            Pedidos y Ventas ({patient.saleOrders?.length || 0})
          </button>

          <button
            type="button"
            className={`button ${activeTab === 'salud' ? 'primary' : 'subtle'}`}
            onClick={() => setActiveTab('salud')}
            style={{ minHeight: '34px', padding: '6px 14px' }}
          >
            Datos de Salud y Domicilio
          </button>
        </div>

        {/* Contenido Pestaña 1: Consultas */}
        {activeTab === 'consultas' && (
          <div>
            {patient.consultations && patient.consultations.length > 0 ? (
              <div className="results">
                {patient.consultations.map((c) => (
                  <article key={c.id} className="result" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                        <span className="status-pill" style={{ textTransform: 'capitalize' }}>
                          Estado: {c.status}
                        </span>
                        <strong style={{ fontSize: '13px' }}>
                          Fecha: {new Date(c.openedAt).toLocaleDateString()}
                        </strong>
                      </div>

                      {c.diagnosis && (
                        <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--ink)' }}>
                          <strong>Diagnóstico:</strong> {c.diagnosis}
                        </p>
                      )}

                      {c.clinicalNotes && (
                        <p style={{ margin: '4px 0', fontSize: '12px', color: 'var(--muted)' }}>
                          Notas: {c.clinicalNotes}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/consultations/${c.id}`}
                      className="button secondary"
                      style={{ fontSize: '12px', minHeight: '32px' }}
                    >
                      Ver Consulta
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty">No hay consultas previas registradas para este paciente.</p>
            )}
          </div>
        )}

        {/* Contenido Pestaña 2: Pedidos */}
        {activeTab === 'pedidos' && (
          <div>
            {patient.saleOrders && patient.saleOrders.length > 0 ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Folio</th>
                      <th>Fecha</th>
                      <th>Artículos</th>
                      <th>Total</th>
                      <th>Saldo Restante</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.saleOrders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{o.folio}</span>
                        </td>
                        <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td>{o.items?.map((it) => it.description).join(', ') || 'Venta de óptica'}</td>
                        <td>${o.total} MXN</td>
                        <td>
                          <strong style={{ color: o.balanceDue > 0 ? 'var(--accent)' : 'var(--success)' }}>
                            ${o.balanceDue} MXN
                          </strong>
                        </td>
                        <td>{orderStatusBadge(o.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty">No hay compras o pedidos registrados a este expediente.</p>
            )}
          </div>
        )}

        {/* Contenido Pestaña 3: Salud & Domicilio */}
        {activeTab === 'salud' && (
          <div className="form-grid two-cols">
            <div style={{ background: 'var(--card-subtle)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Domicilio y Contacto
              </span>
              <p style={{ margin: '8px 0 4px', fontSize: '14px' }}>
                <strong>Dirección:</strong> {patient.address || 'No registrada'}
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                <strong>Correo:</strong> {patient.email || 'No registrado'}
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                <strong>Teléfono:</strong> {patient.phone}
              </p>
            </div>

            <div style={{ background: 'var(--card-subtle)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Salud & Alergias
              </span>
              <p style={{ margin: '8px 0 4px', fontSize: '14px' }}>
                <strong>Alergias:</strong> {patient.allergies || 'Ninguna reportada'}
              </p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>
                <strong>Condiciones Médicas:</strong> {patient.conditions || 'Sin condiciones crónicas reportadas'}
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
