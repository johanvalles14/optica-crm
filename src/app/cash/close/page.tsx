'use client';

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';

type ClosedReport = {
  id: string;
  initialFloat: number;
  expensesTotal: number;
  expectedCash: number;
  declaredCash: number;
  cashDifference: number;
  cardTotal: number;
  transferTotal: number;
  totalCollected: number;
  notes?: string;
  closedAt: string;
};

export default function CashClosePage() {
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [shiftVersion, setShiftVersion] = useState<number>(1);
  const [declaredCash, setDeclaredCash] = useState('');
  const [notes, setNotes] = useState('');

  const [report, setReport] = useState<ClosedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkActiveShift() {
      try {
        const res = await fetch('/api/cash/shift?branchId=branch-001');
        const data = await res.json();
        if (res.ok && data.shift) {
          setShiftId(data.shift.id);
          setShiftVersion(data.shift.version);
        } else {
          setError('No hay un turno abierto actualmente para cerrar.');
        }
      } catch (err) {
        setError('Error al consultar turno activo');
      } finally {
        setLoading(false);
      }
    }
    checkActiveShift();
  }, []);

  async function handleCloseShift(e: FormEvent) {
    e.preventDefault();
    if (!shiftId) return;
    setSubmitting(true);
    setError('');

    try {
      const role = localStorage.getItem('demo-role') || 'frontdesk:receptionist';
      const res = await fetch(`/api/cash/shift/${shiftId}/close`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({
          declaredCash: Number(declaredCash),
          notes: notes || undefined,
          expectedVersion: shiftVersion,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cerrar el turno');

      setReport(data.shift);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el arqueo');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="shell narrow"><p>Cargando información de caja...</p></main>;

  return (
    <main className="shell narrow">
      <header className="topbar">
        <div>
          <p className="eyebrow">CAJA / ARQUEO CIEGO & CORTE DIARIO</p>
          <h1>Cierre de Turno de Caja</h1>
          <p className="lede">
            Cuenta físicamente los billetes y monedas del cajón sin sesgo para auditar el cuadre exacto.
          </p>
        </div>
        <div className="actions">
          <Link href="/cash/shift" className="button secondary">
            ← Volver a Caja
          </Link>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      {report ? (
        /* Reporte Final de Arqueo Revelado */
        <section className="form-card" style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span
              className="status-pill"
              style={{
                background: report.cashDifference === 0 ? '#eaf5ea' : report.cashDifference < 0 ? '#fff5f3' : '#eef6fc',
                color: report.cashDifference === 0 ? '#186a3b' : report.cashDifference < 0 ? 'var(--accent)' : '#0066cc',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              {report.cashDifference === 0
                ? '✓ Turno Cuadrado al Centavo'
                : report.cashDifference < 0
                ? `⚠️ Faltante en Caja de -$${Math.abs(report.cashDifference)} MXN`
                : `ℹ️ Sobrante en Caja de +$${report.cashDifference} MXN`}
            </span>
            <h2 style={{ margin: '16px 0 6px' }}>Comprobante de Corte Diario</h2>
            <small style={{ color: 'var(--muted)' }}>Cerrado: {new Date(report.closedAt).toLocaleString()}</small>
          </div>

          <div style={{ background: '#faf8f2', border: '1px solid var(--line)', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--muted)' }}>ARQUEO DE EFECTIVO</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
              <span>Fondo de cambio inicial:</span>
              <strong>${report.initialFloat} MXN</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
              <span>Gastos menores de caja chica:</span>
              <strong style={{ color: 'var(--accent)' }}>-${report.expensesTotal} MXN</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', borderTop: '1px dashed #ccc', paddingTop: '6px' }}>
              <span>Efectivo esperado por el sistema:</span>
              <strong>${report.expectedCash} MXN</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
              <span>Efectivo físico contado (declarado):</span>
              <strong>${report.declaredCash} MXN</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span>DIFERENCIA:</span>
              <span style={{ color: report.cashDifference === 0 ? '#186a3b' : 'var(--accent)' }}>
                ${report.cashDifference} MXN
              </span>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--muted)' }}>RESUMEN POR FORMA DE PAGO</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
              <span>Ventas en Efectivo:</span>
              <strong>${(report.expectedCash || 0) + (report.expensesTotal || 0) - (report.initialFloat || 0)} MXN</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
              <span>Ventas con Tarjeta (Débito/Crédito):</span>
              <strong>${report.cardTotal || 0} MXN</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
              <span>Ventas por Transferencia (SPEI):</span>
              <strong>${report.transferTotal || 0} MXN</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', borderTop: '1px solid var(--line)', paddingTop: '6px', fontSize: '1.1rem', fontWeight: 'bold' }}>
              <span>TOTAL COBRADO EN EL TURNO:</span>
              <span style={{ color: '#186a3b' }}>${report.totalCollected || 0} MXN</span>
            </div>
          </div>

          {report.notes && (
            <p style={{ fontSize: '13px', background: '#f7f6f0', padding: '12px', borderRadius: '4px' }}>
              <strong>Comentarios del cajero:</strong> {report.notes}
            </p>
          )}

          <div className="actions" style={{ justifyContent: 'center', marginTop: '24px' }}>
            <button className="button primary" onClick={() => window.print()}>
              🖨 Imprimir Corte de Caja
            </button>
            <Link href="/cash/shift" className="button secondary">
              Listo (Volver a Caja)
            </Link>
          </div>
        </section>
      ) : (
        /* Formulario de Arqueo Ciego */
        <section className="form-card">
          <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Captura de Efectivo Contado (Arqueo Ciego)</h2>
          <p className="lede" style={{ fontSize: '13px', margin: '8px 0 16px' }}>
            Por seguridad contable, el sistema no te muestra el saldo esperado. Cuenta los billetes y monedas físicos en el cajón e ingresa la suma total:
          </p>

          <form onSubmit={handleCloseShift} style={{ display: 'grid', gap: '16px' }}>
            <label>
              Total de efectivo físico contado en el cajón ($ MXN):
              <input
                type="number"
                min="0"
                step="1"
                value={declaredCash}
                onChange={(e) => setDeclaredCash(e.target.value)}
                placeholder="Ej. 2450"
                required
                style={{ fontSize: '1.4rem', fontWeight: 'bold' }}
              />
            </label>

            <label>
              Observaciones o justificación de incidencias (opcional):
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Error en cambio de $20 en venta de la mañana..."
                rows={2}
                style={{ border: '1px solid var(--line)', padding: '10px', font: '14px Arial, sans-serif' }}
              />
            </label>

            <button className="button primary" type="submit" disabled={submitting || !declaredCash}>
              {submitting ? 'Auditando y cerrando...' : 'Cerrar Turno y Revelar Arqueo'}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
