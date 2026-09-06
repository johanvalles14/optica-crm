'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Order = {
  id: string;
  folio: string;
  patientName?: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  createdAt: string;
  promisedDeliveryDate?: string;
  items: Array<{ description: string; quantity: number }>;
};

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Liquidación y entrega modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card_debit' | 'card_credit' | 'transfer'>('cash');
  const [processing, setProcessing] = useState(false);

  async function loadOrders() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sales/orders');
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
      else throw new Error(data.error || 'Error al cargar órdenes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleLiquidateAndDeliver(order: Order) {
    setProcessing(true);
    setError('');
    setMessage('');
    try {
      const role = localStorage.getItem('demo-role') || 'frontdesk:receptionist';

      // 1. Si hay saldo pendiente, registrar pago
      if (order.balanceDue > 0) {
        const payRes = await fetch(`/api/sales/orders/${order.id}/payments`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-demo-role': role,
          },
          body: JSON.stringify({
            amount: order.balanceDue,
            method: paymentMethod,
          }),
        });
        if (!payRes.ok) {
          const pData = await payRes.json();
          throw new Error(pData.error || 'No se pudo registrar el pago final');
        }
      }

      setMessage(`✓ Orden ${order.folio} liquidada y entregada con éxito.`);
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al entregar orden');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MOSTRADOR / SEGUIMIENTO & ENTREGAS</p>
          <h1>Pedidos de Lentes</h1>
          <p className="lede">
            Controla las órdenes en preparación, valida liquidación de saldo pendiente y registra la entrega al paciente.
          </p>
        </div>
        <div className="actions">
          <Link href="/sales/pos" className="button primary">
            + Nueva Venta / Cotizador
          </Link>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="form-message" role="status">{message}</p>}

      {/* Modal de cobro de saldo y entrega */}
      {selectedOrder && (
        <div style={{ background: '#fff9ed', border: '2px solid #df6547', padding: '24px', marginBottom: '24px' }}>
          <h2>Liquidación y Entrega de Pedido: {selectedOrder.folio}</h2>
          <p className="lede">
            Cliente: <strong>{selectedOrder.patientName}</strong> · Saldo pendiente:{' '}
            <strong style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>${selectedOrder.balanceDue} MXN</strong>
          </p>

          {selectedOrder.balanceDue > 0 && (
            <div style={{ margin: '16px 0' }}>
              <label>
                Forma de pago del saldo restante:
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
                  <option value="cash">Efectivo</option>
                  <option value="card_debit">Tarjeta de Débito</option>
                  <option value="card_credit">Tarjeta de Crédito</option>
                  <option value="transfer">Transferencia (SPEI)</option>
                </select>
              </label>
            </div>
          )}

          <div className="actions">
            <button
              className="button primary"
              onClick={() => handleLiquidateAndDeliver(selectedOrder)}
              disabled={processing}
            >
              {processing
                ? 'Procesando entrega...'
                : selectedOrder.balanceDue > 0
                ? `Cobrar $${selectedOrder.balanceDue} y Entregar Lentes`
                : 'Confirmar Entrega de Lentes'}
            </button>
            <button className="button secondary" onClick={() => setSelectedOrder(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de órdenes */}
      <div className="results">
        {orders.map((o) => (
          <article className="result" key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="status-pill" style={{ marginRight: '10px' }}>{o.folio}</span>
              <strong>{o.patientName || 'Público General'}</strong>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                Total: <strong>${o.total} MXN</strong> · Pagado: <strong>${o.paidAmount} MXN</strong> · Saldo:{' '}
                <strong style={{ color: o.balanceDue > 0 ? 'var(--accent)' : '#186a3b' }}>${o.balanceDue} MXN</strong>
              </div>
              <small style={{ display: 'block', marginTop: '4px' }}>
                Items: {o.items?.map((it) => it.description).join(' + ')}
              </small>
            </div>

            <div style={{ textAlign: 'right', display: 'grid', gap: '8px' }}>
              <span
                className="status-pill"
                style={{
                  background: o.status === 'delivered_paid' ? '#eaf5ea' : '#faf8f2',
                  color: o.status === 'delivered_paid' ? '#186a3b' : 'inherit',
                  textTransform: 'capitalize',
                }}
              >
                {o.status.replace(/_/g, ' ')}
              </span>

              {o.status !== 'delivered_paid' && o.status !== 'cancelled' && (
                <button
                  className="button primary"
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                  onClick={() => setSelectedOrder(o)}
                >
                  Entregar y Liquidar
                </button>
              )}
            </div>
          </article>
        ))}

        {orders.length === 0 && !loading && (
          <p className="empty">No hay pedidos registrados en mostrador.</p>
        )}
      </div>
    </main>
  );
}
