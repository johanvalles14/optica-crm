'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Invoice = {
  id: string;
  uuid: string;
  folio: string;
  saleOrderFolio: string;
  rfc: string;
  legalName: string;
  total: number;
  status: string;
  issuedAt: string;
  cancellationMotive?: string;
  version: number;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Cancelación
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);
  const [motive, setMotive] = useState<'01' | '02' | '03' | '04'>('02');
  const [cancelLoading, setCancelLoading] = useState(false);

  async function loadInvoices() {
    setLoading(true);
    setError('');
    try {
      const role = localStorage.getItem('demo-role') || 'frontdesk:receptionist';
      const res = await fetch('/api/billing/invoices', {
        headers: { 'x-demo-role': role },
      });
      const data = await res.json();
      if (res.ok) setInvoices(data.invoices || []);
      else throw new Error(data.error || 'Error al cargar facturas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  async function handleCancelInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelTarget) return;
    setCancelLoading(true);
    setError('');
    setMessage('');
    try {
      const role = localStorage.getItem('demo-role') || 'admin';
      const res = await fetch(`/api/billing/invoices/${cancelTarget.id}`, {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({
          motive,
          expectedVersion: cancelTarget.version,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cancelar la factura');

      setMessage(`✓ Factura ${cancelTarget.folio} cancelada formalmente ante el SAT (Motivo ${motive}).`);
      setCancelTarget(null);
      loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar');
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">FISCAL & SAT / FACTURACIÓN ELECTRÓNICA</p>
          <h1>Comprobantes Fiscales CFDI 4.0</h1>
          <p className="lede">
            Facturas timbradas con PAC (FacturAPI) para deducción de lentes ópticos graduados (Uso D07).
          </p>
        </div>
        <div className="actions">
          <Link href="/sales/orders" className="button secondary">
            Ir a Entregas / Mostrador
          </Link>
          <button className="button primary" onClick={loadInvoices} disabled={loading}>
            {loading ? 'Cargando...' : '🔄 Refrescar'}
          </button>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="form-message" role="status">{message}</p>}

      {/* Modal Cancelación SAT */}
      {cancelTarget && (
        <div style={{ background: '#fff5f3', border: '2px solid var(--accent)', padding: '24px', marginBottom: '24px' }}>
          <h2>Cancelar Factura ante el SAT: {cancelTarget.folio}</h2>
          <p className="lede">
            UUID: <code>{cancelTarget.uuid}</code> · Receptor: <strong>{cancelTarget.legalName} ({cancelTarget.rfc})</strong>
          </p>

          <form onSubmit={handleCancelInvoice} style={{ display: 'grid', gap: '12px' }}>
            <label>
              Motivo de cancelación oficial del SAT:
              <select value={motive} onChange={(e) => setMotive(e.target.value as any)}>
                <option value="02">02 - Comprobante emitido con errores sin relación</option>
                <option value="01">01 - Comprobante emitido con errores con relación</option>
                <option value="03">03 - No se llevó a cabo la operación</option>
                <option value="04">04 - Operación nominativa relacionada en la factura global</option>
              </select>
            </label>

            <div className="actions">
              <button className="button primary" type="submit" disabled={cancelLoading}>
                {cancelLoading ? 'Cancelando en el SAT...' : 'Confirmar Cancelación Fiscal'}
              </button>
              <button className="button secondary" type="button" onClick={() => setCancelTarget(null)}>
                Regresar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de facturas emitidas */}
      <div className="results">
        {invoices.map((inv) => (
          <article key={inv.id} className="result" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="status-pill" style={{ fontWeight: 'bold' }}>{inv.folio}</span>
                <span className="status-pill" style={{ fontSize: '11px' }}>Venta: {inv.saleOrderFolio}</span>
                <span
                  className="status-pill"
                  style={{
                    background: inv.status === 'issued' ? '#eaf5ea' : '#fff5f3',
                    color: inv.status === 'issued' ? '#186a3b' : 'var(--accent)',
                    fontWeight: 'bold',
                  }}
                >
                  {inv.status === 'issued' ? '✓ Vigente SAT' : 'Cancelada'}
                </span>
              </div>

              <strong style={{ display: 'block', margin: '6px 0 2px', fontSize: '1.1rem' }}>
                {inv.legalName}
              </strong>
              <small style={{ color: 'var(--muted)', display: 'block' }}>
                RFC: <code>{inv.rfc}</code> · UUID: <code>{inv.uuid}</code>
              </small>
              <small style={{ color: '#666', display: 'block' }}>
                Timbrada el: {new Date(inv.issuedAt).toLocaleString()}
              </small>
            </div>

            <div style={{ textAlign: 'right' }}>
              <strong style={{ fontSize: '1.4rem', display: 'block', color: '#186a3b' }}>
                ${inv.total} MXN
              </strong>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <a
                  href={`/api/billing/invoices/${inv.id}/xml`}
                  download
                  className="button secondary"
                  style={{ padding: '6px 10px', fontSize: '11px' }}
                >
                  📥 Descargar XML
                </a>

                {inv.status === 'issued' && (
                  <button
                    className="button secondary"
                    style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--accent)' }}
                    onClick={() => setCancelTarget(inv)}
                  >
                    Cancelar SAT
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}

        {invoices.length === 0 && !loading && (
          <p className="empty">No se han emitido facturas fiscales todavía.</p>
        )}
      </div>
    </main>
  );
}
