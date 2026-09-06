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
  notes?: string;
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

  // Facturación CFDI 4.0 Express
  const [requireInvoice, setRequireInvoice] = useState(false);
  const [rfc, setRfc] = useState('');
  const [legalName, setLegalName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [taxSystem, setTaxSystem] = useState('605');
  const [cfdiUse, setCfdiUse] = useState('D07');
  const [generatedInvoice, setGeneratedInvoice] = useState<{ uuid: string; folio: string; id: string } | null>(null);

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

      // 2. Si solicitó factura fiscal, timbrar de inmediato vía PAC
      if (requireInvoice) {
        const invRes = await fetch('/api/billing/invoices', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-demo-role': role,
          },
          body: JSON.stringify({
            saleOrderId: order.id,
            taxProfile: {
              rfc,
              legalName,
              zipCode,
              taxSystem,
              cfdiUse,
            },
          }),
        });

        const invData = await invRes.json();
        if (!invRes.ok) {
          throw new Error(invData.error || 'Entrega registrada, pero falló el timbrado de la factura');
        }

        setGeneratedInvoice({
          id: invData.invoice.id,
          uuid: invData.invoice.uuid,
          folio: invData.invoice.folio,
        });
        setMessage(`✓ Orden ${order.folio} liquidada y Factura CFDI 4.0 timbrada exitosamente (Folio fiscal: ${invData.invoice.uuid}).`);
      } else {
        setMessage(`✓ Orden ${order.folio} liquidada y entregada con éxito.`);
      }

      setSelectedOrder(null);
      setRequireInvoice(false);
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

          {/* Checkbox de Factura Fiscal CFDI 4.0 */}
          <div style={{ marginTop: '16px', background: '#faf8f2', padding: '16px', border: '1px solid var(--line)' }}>
            <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
              <input
                type="checkbox"
                checked={requireInvoice}
                onChange={(e) => setRequireInvoice(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span>¿El paciente solicita Factura Fiscal CFDI 4.0 (SAT)?</span>
            </label>

            {requireInvoice && (
              <div style={{ display: 'grid', gap: '10px', marginTop: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label>
                    RFC Receptor:
                    <input
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value.toUpperCase())}
                      placeholder="13 caracteres (ej. VAPJ850906HR7)"
                      required={requireInvoice}
                    />
                  </label>
                  <label>
                    Código Postal Fiscal:
                    <input
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="5 dígitos (ej. 27000)"
                      required={requireInvoice}
                    />
                  </label>
                </div>

                <label>
                  Nombre o Razón Social (exacto en mayúsculas):
                  <input
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value.toUpperCase())}
                    placeholder="Sin régimen societario (ej. JUAN PEREZ LOPEZ)"
                    required={requireInvoice}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label>
                    Régimen Fiscal SAT:
                    <select value={taxSystem} onChange={(e) => setTaxSystem(e.target.value)}>
                      <option value="605">605 - Sueldos y Salarios</option>
                      <option value="612">612 - Personas Físicas con Actividades Empresariales</option>
                      <option value="626">626 - RESICO (Simplificado de Confianza)</option>
                      <option value="601">601 - General Personas Morales</option>
                      <option value="616">616 - Sin obligaciones fiscales</option>
                    </select>
                  </label>

                  <label>
                    Uso de CFDI:
                    <select value={cfdiUse} onChange={(e) => setCfdiUse(e.target.value)}>
                      <option value="D07">D07 - Lentes ópticos graduados (Deducción Personal)</option>
                      <option value="G03">G03 - Gastos en general</option>
                      <option value="S01">S01 - Sin efectos fiscales</option>
                    </select>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="actions" style={{ marginTop: '16px' }}>
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
              {o.notes && (o.notes.includes('REPETICIÓN') || o.notes.includes('MERMA')) && (
                <span className="status-pill" style={{ background: '#f8d7da', color: '#721c24', fontWeight: 'bold', marginLeft: '8px' }}>
                  ⚠️ Repetición / Merma en Taller
                </span>
              )}
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                Total: <strong>${o.total} MXN</strong> · Pagado: <strong>${o.paidAmount} MXN</strong> · Saldo:{' '}
                <strong style={{ color: o.balanceDue > 0 ? 'var(--accent)' : '#186a3b' }}>${o.balanceDue} MXN</strong>
              </div>
              <small style={{ display: 'block', marginTop: '4px' }}>
                Items: {o.items?.map((it) => it.description).join(' + ')}
              </small>
              {o.notes && (
                <small style={{ display: 'block', color: 'var(--accent)', marginTop: '2px', fontWeight: 'bold' }}>
                  {o.notes}
                </small>
              )}
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
