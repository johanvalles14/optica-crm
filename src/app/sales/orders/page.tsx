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

function statusBadge(status: string) {
  switch (status) {
    case 'delivered_paid':
      return <span className="status-pill success">Entregado</span>;
    case 'ready_for_delivery':
      return <span className="status-pill warning">Listo para Entrega</span>;
    case 'confirmed_in_process':
      return <span className="status-pill process">En Taller / Preparación</span>;
    case 'pending_deposit':
      return <span className="status-pill warning">Espera de Anticipo</span>;
    case 'quote':
      return <span className="status-pill">Cotización</span>;
    case 'cancelled':
      return <span className="status-pill danger">Cancelado</span>;
    default:
      return <span className="status-pill">{status}</span>;
  }
}

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'in_process' | 'ready' | 'delivered' | 'quotes'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de liquidación y entrega
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card_debit' | 'card_credit' | 'transfer'>('cash');
  const [processing, setProcessing] = useState(false);

  // Factura CFDI 4.0 SAT opcional
  const [requireInvoice, setRequireInvoice] = useState(false);
  const [rfc, setRfc] = useState('');
  const [legalName, setLegalName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [taxSystem, setTaxSystem] = useState('605');
  const [cfdiUse, setCfdiUse] = useState('D07');

  async function loadOrders() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sales/orders');
      const data = await res.json();
      if (res.ok && data.orders) {
        setOrders(data.orders);
      } else {
        throw new Error(data.error || 'Error al cargar órdenes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar órdenes');
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

      // 1. Invocar transición real de entrega mediante la nueva API
      const deliverRes = await fetch(`/api/sales/orders/${order.id}/deliver`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({
          finalPayment:
            order.balanceDue > 0
              ? {
                  amount: order.balanceDue,
                  method: paymentMethod,
                }
              : undefined,
        }),
      });

      const deliverData = await deliverRes.json();
      if (!deliverRes.ok) {
        throw new Error(deliverData.error || 'No se pudo registrar la entrega');
      }

      // 2. Timbrar factura SAT si el paciente la solicitó
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
          throw new Error(invData.error || 'Entrega registrada, pero falló el timbrado SAT');
        }

        setMessage(
          `✓ Pedido ${order.folio} liquidado y entregado. Factura fiscal timbrada (Folio: ${invData.invoice.folio}).`
        );
      } else {
        setMessage(`✓ Pedido ${order.folio} liquidado y entregado con éxito al paciente.`);
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

  // Filtrado de órdenes
  const filteredOrders = orders.filter((o) => {
    // Filtro por pestaña
    if (activeFilter === 'in_process' && o.status !== 'confirmed_in_process') return false;
    if (activeFilter === 'ready' && o.status !== 'ready_for_delivery') return false;
    if (activeFilter === 'delivered' && o.status !== 'delivered_paid') return false;
    if (activeFilter === 'quotes' && o.status !== 'quote' && o.status !== 'pending_deposit') return false;

    // Filtro por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const folioMatch = o.folio.toLowerCase().includes(q);
      const nameMatch = (o.patientName || '').toLowerCase().includes(q);
      return folioMatch || nameMatch;
    }

    return true;
  });

  return (
    <main className="shell">
      {/* Cabecera */}
      <header className="topbar">
        <div>
          <p className="eyebrow">MOSTRADOR / SEGUIMIENTO & ENTREGAS</p>
          <h1>Pedidos de Lentes</h1>
          <p className="lede">
            Supervisa el estado en taller, liquida el saldo restante y registra la entrega al paciente.
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

      {/* Modal de Liquidación y Entrega */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="card-header">
              <h2 style={{ margin: 0 }}>Liquidación y Entrega</h2>
              <button
                type="button"
                className="button subtle"
                onClick={() => setSelectedOrder(null)}
                style={{ fontSize: '18px', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <p className="lede">
              Folio: <strong>{selectedOrder.folio}</strong> · Paciente:{' '}
              <strong>{selectedOrder.patientName || 'Público General'}</strong>
            </p>

            {selectedOrder.balanceDue > 0 ? (
              <div
                style={{
                  background: 'var(--warning-light)',
                  border: '1px solid var(--warning-border)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', fontWeight: 600 }}>
                  SALDO PENDIENTE POR COBRAR:
                </span>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: 'var(--warning)', margin: '4px 0' }}>
                  ${selectedOrder.balanceDue} MXN
                </strong>

                <label style={{ marginTop: '12px' }}>
                  Forma de cobro del saldo:
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card_debit">Tarjeta de Débito</option>
                    <option value="card_credit">Tarjeta de Crédito</option>
                    <option value="transfer">Transferencia (SPEI)</option>
                  </select>
                </label>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--success-light)',
                  border: '1px solid var(--success-border)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                }}
              >
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                  ✓ El pedido ya se encuentra totalmente liquidado.
                </span>
              </div>
            )}

            {/* Factura CFDI 4.0 SAT Opcional */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '14px', marginTop: '16px' }}>
              <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={requireInvoice}
                  onChange={(e) => setRequireInvoice(e.target.checked)}
                  style={{ width: '18px', height: '18px', minHeight: 'unset' }}
                />
                <span style={{ fontWeight: 600, fontSize: '13px' }}>
                  ¿El paciente requiere Factura Fiscal SAT (CFDI 4.0)?
                </span>
              </label>

              {requireInvoice && (
                <div className="form-grid" style={{ marginTop: '14px', background: 'var(--card-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <div className="form-grid two-cols">
                    <label>
                      RFC Receptor *
                      <input
                        value={rfc}
                        onChange={(e) => setRfc(e.target.value.toUpperCase())}
                        placeholder="13 caracteres"
                        required={requireInvoice}
                      />
                    </label>

                    <label>
                      C.P. Fiscal Receptor *
                      <input
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="5 dígitos"
                        required={requireInvoice}
                      />
                    </label>
                  </div>

                  <label>
                    Razón Social en Mayúsculas *
                    <input
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value.toUpperCase())}
                      placeholder="Nombre exacto según Constancia SAT"
                      required={requireInvoice}
                    />
                  </label>

                  <div className="form-grid two-cols">
                    <label>
                      Régimen Fiscal
                      <select value={taxSystem} onChange={(e) => setTaxSystem(e.target.value)}>
                        <option value="605">605 - Sueldos y Salarios</option>
                        <option value="612">612 - Personas Físicas con Actividades Empresariales</option>
                        <option value="626">626 - RESICO</option>
                        <option value="601">601 - General Personas Morales</option>
                        <option value="616">616 - Sin obligaciones fiscales</option>
                      </select>
                    </label>

                    <label>
                      Uso de CFDI
                      <select value={cfdiUse} onChange={(e) => setCfdiUse(e.target.value)}>
                        <option value="D07">D07 - Lentes graduados (Deducción Personal)</option>
                        <option value="G03">G03 - Gastos en general</option>
                        <option value="S01">S01 - Sin efectos fiscales</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => setSelectedOrder(null)}
                disabled={processing}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button primary"
                onClick={() => handleLiquidateAndDeliver(selectedOrder)}
                disabled={processing}
              >
                {processing
                  ? 'Registrando entrega...'
                  : selectedOrder.balanceDue > 0
                  ? `Cobrar $${selectedOrder.balanceDue} y Entregar Lentes`
                  : 'Confirmar Entrega de Lentes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <section className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Pestañas de Filtro */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`button ${activeFilter === 'all' ? 'primary' : 'subtle'}`}
              onClick={() => setActiveFilter('all')}
              style={{ minHeight: '34px', padding: '6px 12px' }}
            >
              Todos ({orders.length})
            </button>

            <button
              type="button"
              className={`button ${activeFilter === 'ready' ? 'primary' : 'subtle'}`}
              onClick={() => setActiveFilter('ready')}
              style={{ minHeight: '34px', padding: '6px 12px' }}
            >
              Listos ({orders.filter((o) => o.status === 'ready_for_delivery').length})
            </button>

            <button
              type="button"
              className={`button ${activeFilter === 'in_process' ? 'primary' : 'subtle'}`}
              onClick={() => setActiveFilter('in_process')}
              style={{ minHeight: '34px', padding: '6px 12px' }}
            >
              En Taller ({orders.filter((o) => o.status === 'confirmed_in_process').length})
            </button>

            <button
              type="button"
              className={`button ${activeFilter === 'delivered' ? 'primary' : 'subtle'}`}
              onClick={() => setActiveFilter('delivered')}
              style={{ minHeight: '34px', padding: '6px 12px' }}
            >
              Entregados ({orders.filter((o) => o.status === 'delivered_paid').length})
            </button>

            <button
              type="button"
              className={`button ${activeFilter === 'quotes' ? 'primary' : 'subtle'}`}
              onClick={() => setActiveFilter('quotes')}
              style={{ minHeight: '34px', padding: '6px 12px' }}
            >
              Cotizaciones ({orders.filter((o) => o.status === 'quote' || o.status === 'pending_deposit').length})
            </button>
          </div>

          {/* Campo de Búsqueda Rápida en Pedidos */}
          <div style={{ width: '260px' }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por folio o cliente..."
              style={{ minHeight: '34px', fontSize: '13px', padding: '6px 12px' }}
            />
          </div>
        </div>
      </section>

      {/* Tabla Cómoda de Pedidos */}
      {filteredOrders.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table" aria-label="Lista de pedidos">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Folio</th>
                <th>Cliente / Paciente</th>
                <th>Artículos</th>
                <th>Total</th>
                <th>Saldo Restante</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <span className="status-pill" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {o.folio}
                    </span>
                  </td>
                  <td>
                    <span className="cell-primary">{o.patientName || 'Público General'}</span>
                    <span className="cell-secondary">
                      Fecha: {new Date(o.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <span className="cell-primary" style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.items?.map((it) => it.description).join(' + ') || 'Lentes graduados'}
                    </span>
                    {o.notes && (
                      <span className="cell-secondary" style={{ color: 'var(--muted)' }}>
                        {o.notes}
                      </span>
                    )}
                  </td>
                  <td>${o.total} MXN</td>
                  <td>
                    <strong style={{ color: o.balanceDue > 0 ? 'var(--warning)' : 'var(--success)' }}>
                      ${o.balanceDue} MXN
                    </strong>
                  </td>
                  <td>{statusBadge(o.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {o.status !== 'delivered_paid' && o.status !== 'cancelled' ? (
                      <button
                        className="button primary"
                        style={{ padding: '6px 12px', fontSize: '12px', minHeight: '32px' }}
                        onClick={() => setSelectedOrder(o)}
                      >
                        Entregar y Liquidar
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        ✓ Finalizado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <p style={{ margin: 0 }}>No hay pedidos que coincidan con el filtro seleccionado.</p>
        </div>
      )}
    </main>
  );
}
