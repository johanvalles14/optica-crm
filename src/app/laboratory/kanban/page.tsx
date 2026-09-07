'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CircleCheck, Globe, House, Printer, RefreshCw, TriangleAlert } from 'lucide-react';

type EyeData = {
  sphere?: number;
  cylinder?: number;
  axis?: number;
  addition?: number;
  pupillaryDistance?: number;
};

type LabOrder = {
  id: string;
  folio: string;
  saleOrderFolio: string;
  patientName: string;
  destination: string;
  externalLabName?: string;
  status: string;
  frameCode: string;
  lensMaterial: string;
  treatments: string[];
  rightEye: EyeData;
  leftEye: EyeData;
  reworkReason?: string;
  version: number;
};

const COLUMNS = [
  { id: 'queued', label: '1. En Cola', color: '#f1f5f9' },
  { id: 'in_process', label: '2. En Biselado / Maquila', color: '#eff6ff' },
  { id: 'quality_control', label: '3. Control de Calidad', color: '#fffbeb' },
  { id: 'completed', label: '4. Terminado / Aprobado', color: '#ecfdf5' },
  { id: 'rework_needed', label: 'Repetición / Merma', color: '#fef2f2' },
];

export default function LabKanbanPage() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'warning'>('success');

  // Modal para reportar merma / rotura
  const [reworkTarget, setReworkTarget] = useState<LabOrder | null>(null);
  const [reworkReason, setReworkReason] = useState('');
  const [reworkDays, setReworkDays] = useState('2');
  const [reworkLoading, setReworkLoading] = useState(false);

  // Modal para asignar maquila externa
  const [maquilaTarget, setMaquilaTarget] = useState<LabOrder | null>(null);
  const [maquilaName, setMaquilaName] = useState('');
  const [maquilaGuide, setMaquilaGuide] = useState('');

  async function loadOrders() {
    setLoading(true);
    setError('');
    try {
      const role = localStorage.getItem('demo-role') || 'laboratory:technician';
      const res = await fetch('/api/laboratory/orders', {
        headers: { 'x-demo-role': role },
      });
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
      else throw new Error(data.error || 'Error al cargar órdenes de taller');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleApproveQuality(order: LabOrder) {
    setError('');
    setMessage('');
    try {
      const role = localStorage.getItem('demo-role') || 'laboratory:technician';
      const res = await fetch(`/api/laboratory/orders/${order.id}/approve`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({ expectedVersion: order.version }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al aprobar calidad');

      setMessageTone('success');
      setMessage(`${order.folio} aprobado. Mostrador ya puede entregar los lentes.`);
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar calidad');
    }
  }

  async function handleReportRework(e: React.FormEvent) {
    e.preventDefault();
    if (!reworkTarget) return;
    setReworkLoading(true);
    setError('');
    try {
      const role = localStorage.getItem('demo-role') || 'laboratory:technician';
      const res = await fetch(`/api/laboratory/orders/${reworkTarget.id}/rework`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({
          reason: reworkReason,
          additionalDeliveryDays: Number(reworkDays),
          expectedVersion: reworkTarget.version,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reportar repetición');

      setMessageTone('warning');
      setMessage(`Repetición registrada para ${reworkTarget.folio}. Alerta enviada a mostrador.`);
      setReworkTarget(null);
      setReworkReason('');
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar repetición');
    } finally {
      setReworkLoading(false);
    }
  }

  async function handleAssignMaquila(e: React.FormEvent) {
    e.preventDefault();
    if (!maquilaTarget) return;
    try {
      const role = localStorage.getItem('demo-role') || 'laboratory:technician';
      const res = await fetch(`/api/laboratory/orders/${maquilaTarget.id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({
          action: 'assignDestination',
          destination: 'external_lab',
          externalLabName: maquilaName,
          externalGuideNumber: maquilaGuide,
          expectedVersion: maquilaTarget.version,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al asignar maquila');

      setMessageTone('success');
      setMessage(`${maquilaTarget.folio} asignado a maquila externa (${maquilaName}).`);
      setMaquilaTarget(null);
      setMaquilaName('');
      setMaquilaGuide('');
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar maquila');
    }
  }

  return (
    <main className="shell" style={{ width: 'min(1400px, calc(100% - 32px))' }}>
      <header className="topbar">
        <div>
          <p className="eyebrow">TALLER & LABORATORIO / KANBAN</p>
          <h1>Tablero de Biselado y Montaje</h1>
          <p className="lede">
            Seguimiento de charolas de trabajo, asignación a maquila externa y control de calidad en 1 clic.
          </p>
        </div>
        <div className="actions">
          <button className="button secondary" onClick={loadOrders} disabled={loading}>
            {loading ? 'Actualizando...' : <><RefreshCw size={16} aria-hidden="true" /> Refrescar Tablero</>}
          </button>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}
      {message && (
        <p
          className={messageTone === 'warning' ? 'error' : 'form-message'}
          role="status"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {messageTone === 'warning'
            ? <TriangleAlert size={16} aria-hidden="true" />
            : <CircleCheck size={16} aria-hidden="true" />}
          {message}
        </p>
      )}

      {/* Modal Reportar Rotura / Merma */}
      {reworkTarget && (
        <div style={{ background: '#fff5f3', border: '2px solid var(--accent)', padding: '24px', marginBottom: '24px' }}>
          <h2>Reportar Rotura / Repetición en Taller: {reworkTarget.folio}</h2>
          <p className="lede">
            Trabajo para: <strong>{reworkTarget.patientName}</strong> · Armazón: <code>{reworkTarget.frameCode}</code>
          </p>
          <form onSubmit={handleReportRework} style={{ display: 'grid', gap: '12px' }}>
            <label>
              Motivo de la rotura o defecto (ej. mica astillada, eje desfasado):
              <input
                value={reworkReason}
                onChange={(e) => setReworkReason(e.target.value)}
                placeholder="Explicación detallada obligatoria..."
                required
              />
            </label>
            <label>
              Días adicionales que retrasará la entrega:
              <input
                type="number"
                min="1"
                max="10"
                value={reworkDays}
                onChange={(e) => setReworkDays(e.target.value)}
                required
              />
            </label>
            <div className="actions">
              <button className="button primary" type="submit" disabled={reworkLoading}>
                {reworkLoading ? 'Procesando...' : <><TriangleAlert size={16} aria-hidden="true" /> Confirmar Repetición y Alertar a Mostrador</>}
              </button>
              <button className="button secondary" type="button" onClick={() => setReworkTarget(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Asignar Maquila */}
      {maquilaTarget && (
        <div style={{ background: '#f0f7ff', border: '2px solid #0066cc', padding: '24px', marginBottom: '24px' }}>
          <h2>Enviar a Maquila Externa: {maquilaTarget.folio}</h2>
          <form onSubmit={handleAssignMaquila} style={{ display: 'grid', gap: '12px' }}>
            <label>
              Nombre del Laboratorio Maquilador:
              <input
                value={maquilaName}
                onChange={(e) => setMaquilaName(e.target.value)}
                placeholder="Ej. Laboratorio Azteca, Essilor, Lasa..."
                required
              />
            </label>
            <label>
              Número de Guía / Folio de Envío (opcional):
              <input
                value={maquilaGuide}
                onChange={(e) => setMaquilaGuide(e.target.value)}
                placeholder="Ej. GUIA-4499"
              />
            </label>
            <div className="actions">
              <button className="button primary" type="submit">
                <CircleCheck size={16} aria-hidden="true" /> Registrar Envío a Maquila
              </button>
              <button className="button secondary" type="button" onClick={() => setMaquilaTarget(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Columnas Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'start' }}>
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.id);
          return (
            <div
              key={col.id}
              style={{
                background: 'var(--card-subtle)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px',
                minHeight: '400px',
              }}
            >
              <div
                style={{
                  background: col.color,
                  border: '1px solid var(--line)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {col.id === 'rework_needed' && <TriangleAlert size={15} aria-hidden="true" />}
                  {col.label}
                </span>
                <span className="status-pill" style={{ background: 'white', padding: '2px 8px' }}>
                  {colOrders.length}
                </span>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {colOrders.map((ord) => (
                  <article
                    key={ord.id}
                    style={{
                      background: 'white',
                      border: '1px solid var(--line)',
                      padding: '12px',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{ord.folio}</strong>
                      <span className="status-pill" style={{ fontSize: '10px' }}>{ord.saleOrderFolio}</span>
                    </div>

                    <p style={{ margin: '6px 0', fontWeight: 'bold' }}>{ord.patientName}</p>

                    <div style={{ color: 'var(--muted)', fontSize: '12px', lineHeight: '1.4' }}>
                      Armazón: <code>{ord.frameCode}</code>
                      <br />
                      Mica: <strong>{ord.lensMaterial}</strong>
                      {ord.treatments?.length > 0 && <span style={{ display: 'block' }}>Trat: {ord.treatments.join(', ')}</span>}
                    </div>

                    <div style={{ background: '#f7f6f0', padding: '6px', margin: '8px 0', borderRadius: '3px', fontSize: '11px' }}>
                      <div>OD: {ord.rightEye.sphere ?? '0.00'} / {ord.rightEye.cylinder ?? '0.00'} × {ord.rightEye.axis ?? '0'}°</div>
                      <div>OI: {ord.leftEye.sphere ?? '0.00'} / {ord.leftEye.cylinder ?? '0.00'} × {ord.leftEye.axis ?? '0'}°</div>
                    </div>

                    {ord.destination === 'external_lab' ? (
                      <span style={{ fontSize: '11px', color: '#0066cc', display: 'flex', alignItems: 'center', gap: '5px', margin: '4px 0' }}>
                        <Globe size={14} aria-hidden="true" /> Maquila: {ord.externalLabName || 'Externa'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '5px', margin: '4px 0' }}>
                        <House size={14} aria-hidden="true" /> Taller Local
                      </span>
                    )}

                    {ord.reworkReason && (
                      <div style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 'bold', margin: '6px 0' }}>
                        Motivo: {ord.reworkReason}
                      </div>
                    )}

                    {/* Botones de acción rápida en la tarjeta */}
                    <div style={{ display: 'grid', gap: '6px', marginTop: '10px' }}>
                      {ord.status !== 'completed' && (
                        <button
                          className="button primary"
                          style={{ padding: '6px 8px', fontSize: '11px', width: '100%' }}
                          onClick={() => handleApproveQuality(ord)}
                        >
                          <CircleCheck size={14} aria-hidden="true" /> Calidad Aprobada
                        </button>
                      )}

                      {ord.status !== 'completed' && ord.status !== 'rework_needed' && (
                        <button
                          className="button secondary"
                          style={{ padding: '6px 8px', fontSize: '11px', width: '100%', color: 'var(--accent)' }}
                          onClick={() => setReworkTarget(ord)}
                        >
                          <TriangleAlert size={14} aria-hidden="true" /> Merma / Repetición
                        </button>
                      )}

                      {ord.destination === 'internal_workshop' && ord.status === 'queued' && (
                        <button
                          className="button secondary"
                          style={{ padding: '6px 8px', fontSize: '11px', width: '100%' }}
                          onClick={() => setMaquilaTarget(ord)}
                        >
                          Enviar a Maquila
                        </button>
                      )}

                      <Link
                        href={`/laboratory/orders/${ord.id}/slip`}
                        className="button secondary"
                        style={{ padding: '6px 8px', fontSize: '11px', textAlign: 'center' }}
                      >
                        <Printer size={14} aria-hidden="true" /> Boleta de Charola
                      </Link>
                    </div>
                  </article>
                ))}

                {colOrders.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '12px', margin: '20px 0' }}>
                    Sin trabajos
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
