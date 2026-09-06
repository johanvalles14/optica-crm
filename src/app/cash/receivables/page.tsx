'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type PendingItem = {
  orderId: string;
  folio: string;
  patientName: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  orderStatus: string;
  promisedDeliveryDate?: string;
  createdAt: string;
};

type Report = {
  totalOutstandingBalance: number;
  totalOrdersWithBalance: number;
  items: PendingItem[];
};

export default function ReceivablesPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchReceivables() {
      try {
        const res = await fetch('/api/cash/reports/accounts-receivable?branchId=branch-001');
        const data = await res.json();
        if (res.ok) setReport(data.report);
        else throw new Error(data.error || 'Error al cargar reporte');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setLoading(false);
      }
    }
    fetchReceivables();
  }, []);

  if (loading) return <main className="shell narrow"><p>Cargando cartera por cobrar...</p></main>;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">FINANZAS / CARTERA & COBRANZA</p>
          <h1>Saldos en la Calle (Por Cobrar)</h1>
          <p className="lede">
            Dinero pendiente de liquidación correspondiente a lentes en proceso de fabricación o listos para entrega.
          </p>
        </div>
        <div className="actions">
          <Link href="/sales/orders" className="button secondary">
            Ir a Entrega de Pedidos
          </Link>
          <Link href="/cash/shift" className="button primary">
            Control de Caja
          </Link>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      {report && (
        <>
          {/* Métricas destacadas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="metric-card" style={{ width: 'auto' }}>
              <span className="metric-label">TOTAL PENDIENTE DE COBRO</span>
              <strong style={{ color: 'var(--accent)', fontSize: '2.2rem' }}>
                ${report.totalOutstandingBalance} MXN
              </strong>
              <p>Dinero en la calle que entrará al entregar los lentes.</p>
            </div>

            <div className="metric-card" style={{ width: 'auto' }}>
              <span className="metric-label">PEDIDOS CON SALDO</span>
              <strong style={{ fontSize: '2.2rem' }}>
                {report.totalOrdersWithBalance}
              </strong>
              <p>Órdenes con anticipo parcial pagado.</p>
            </div>
          </div>

          {/* Tabla de órdenes pendientes */}
          <div className="results">
            {report.items.map((item) => (
              <article key={item.orderId} className="result" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="status-pill" style={{ marginRight: '10px' }}>{item.folio}</span>
                  <strong>{item.patientName}</strong>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                    Total pedido: <strong>${item.total} MXN</strong> · Anticipo cubierto: <strong>${item.paidAmount} MXN</strong>
                  </div>
                  {item.promisedDeliveryDate && (
                    <small style={{ color: '#555', display: 'block', marginTop: '4px' }}>
                      Promesa de entrega: {new Date(item.promisedDeliveryDate).toLocaleDateString()}
                    </small>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', display: 'block', color: 'var(--muted)' }}>SALDO POR LIQUIDAR</span>
                  <strong style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>
                    ${item.balanceDue} MXN
                  </strong>
                  <Link
                    href="/sales/orders"
                    className="button secondary"
                    style={{ padding: '6px 10px', fontSize: '11px', marginTop: '8px', display: 'inline-block' }}
                  >
                    Ver en Pedidos →
                  </Link>
                </div>
              </article>
            ))}

            {report.items.length === 0 && (
              <p className="empty">✓ ¡Excelente! No hay saldos pendientes en la calle actualmente.</p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
