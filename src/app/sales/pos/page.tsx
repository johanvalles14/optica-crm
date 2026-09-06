'use client';

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';

type Product = {
  id: string;
  internalCode: string;
  brand?: string;
  model?: string;
  retailPrice: number;
  stock: number;
};

const LENS_MATERIALS = [
  { id: 'cr39', label: 'CR-39 Monofocal Básico', price: 350 },
  { id: 'poly', label: 'Policarbonato Resistente al Impacto', price: 650 },
  { id: 'hi_index', label: 'Alto Índice 1.67 Delgado', price: 1200 },
];

const TREATMENTS = [
  { id: 'antireflective', label: 'Antirreflejante Estándar', price: 250 },
  { id: 'blue_filter', label: 'Filtro Azul (Protección Pantallas)', price: 350 },
  { id: 'photochromic', label: 'Fotocromático (Oscurece al Sol)', price: 700 },
];

export default function PosPage() {
  const [frames, setFrames] = useState<Product[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(LENS_MATERIALS[0].id);
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);

  const [patientName, setPatientName] = useState('');
  const [promisedDays, setPromisedDays] = useState('3');
  const [depositAmount, setDepositAmount] = useState('500');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card_debit' | 'card_credit' | 'transfer'>('cash');

  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchFrames() {
      try {
        const res = await fetch('/api/inventory/products?category=frame&onlyInStock=true');
        const data = await res.json();
        if (res.ok && data.products) {
          setFrames(data.products);
          if (data.products.length > 0) setSelectedFrameId(data.products[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchFrames();
  }, []);

  const currentFrame = frames.find((f) => f.id === selectedFrameId);
  const framePrice = currentFrame ? currentFrame.retailPrice : 0;
  const materialObj = LENS_MATERIALS.find((m) => m.id === selectedMaterial);
  const materialPrice = materialObj ? materialObj.price : 0;
  const treatmentsPrice = selectedTreatments.reduce((acc, tId) => {
    const t = TREATMENTS.find((x) => x.id === tId);
    return acc + (t ? t.price : 0);
  }, 0);

  const totalCalculated = framePrice + materialPrice + treatmentsPrice;
  const depositNum = Number(depositAmount) || 0;
  const balanceDue = Math.max(0, totalCalculated - depositNum);

  function toggleTreatment(id: string) {
    if (selectedTreatments.includes(id)) {
      setSelectedTreatments(selectedTreatments.filter((t) => t !== id));
    } else {
      setSelectedTreatments([...selectedTreatments, id]);
    }
  }

  async function handleCreateSale(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + Number(promisedDays));

    const items = [
      {
        itemType: 'frame',
        productId: currentFrame?.id,
        description: `Armazón ${currentFrame?.internalCode} (${currentFrame?.brand || 'Óptica'})`,
        quantity: 1,
        unitPrice: framePrice,
      },
      {
        itemType: 'lens_complete',
        description: `Micas: ${materialObj?.label}${
          selectedTreatments.length > 0 ? ` + Tratamientos (${selectedTreatments.join(', ')})` : ''
        }`,
        quantity: 1,
        unitPrice: materialPrice + treatmentsPrice,
      },
    ];

    try {
      const role = localStorage.getItem('demo-role') || 'frontdesk:receptionist';
      const res = await fetch('/api/sales/orders', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({
          branchId: 'branch-001',
          patientName: patientName || 'Público General',
          items,
          promisedDeliveryDate: deliveryDate.toISOString(),
          initialPayment:
            depositNum > 0
              ? {
                  amount: depositNum,
                  method: paymentMethod,
                }
              : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear la venta');

      setCompletedOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar venta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MOSTRADOR / PUNTO DE VENTA ÓPTICO</p>
          <h1>Configurador de Lentes y Venta</h1>
          <p className="lede">
            Combina armazón en existencia, micas de laboratorio y tratamientos, cobra anticipo y emite el comprobante.
          </p>
        </div>
        <div className="actions">
          <Link href="/sales/orders" className="button secondary">
            Ver Pedidos en Taller
          </Link>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      {completedOrder ? (
        <section className="form-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <span className="status-pill" style={{ background: '#eaf5ea', color: '#186a3b', fontWeight: 'bold' }}>
            ✓ Venta confirmada y stock descontado
          </span>
          <h2 style={{ margin: '16px 0 8px' }}>Folio: {completedOrder.folio}</h2>
          <p className="lede" style={{ margin: '0 auto 16px' }}>
            Total: <strong>${completedOrder.total} MXN</strong> · Anticipo recibido:{' '}
            <strong style={{ color: '#186a3b' }}>${completedOrder.paidAmount} MXN</strong> · Saldo restante:{' '}
            <strong style={{ color: 'var(--accent)' }}>${completedOrder.balanceDue} MXN</strong>
          </p>

          {/* Ticket térmico simulado */}
          <div
            style={{
              background: '#fff',
              border: '1px dashed #333',
              padding: '24px',
              fontFamily: 'monospace',
              fontSize: '13px',
              textAlign: 'left',
              margin: '20px auto',
              width: '320px',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <strong>ÓPTICA CENTRAL</strong>
              <br />
              Comprobante de Pedido #{completedOrder.folio}
              <br />
              {new Date(completedOrder.createdAt).toLocaleDateString()}
            </div>
            <hr style={{ border: '0', borderTop: '1px dashed #ccc' }} />
            <p style={{ margin: '6px 0' }}>Cliente: {completedOrder.patientName}</p>
            {completedOrder.items.map((it: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>{it.description}</span>
                <span>${it.totalPrice}</span>
              </div>
            ))}
            <hr style={{ border: '0', borderTop: '1px dashed #ccc' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>TOTAL:</span>
              <span>${completedOrder.total} MXN</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ANTICIPO PAGADO:</span>
              <span>${completedOrder.paidAmount} MXN</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)', fontWeight: 'bold' }}>
              <span>SALDO A LA ENTREGA:</span>
              <span>${completedOrder.balanceDue} MXN</span>
            </div>
            <p style={{ fontSize: '10px', marginTop: '16px', textAlign: 'center', color: '#666' }}>
              Para recoger sus lentes terminados es indispensable presentar este ticket y liquidar el saldo.
            </p>
          </div>

          <div className="actions" style={{ justifyContent: 'center' }}>
            <button className="button primary" onClick={() => window.print()}>
              🖨 Imprimir Ticket Térmico
            </button>
            <button className="button secondary" onClick={() => setCompletedOrder(null)}>
              Nueva Venta
            </button>
          </div>
        </section>
      ) : (
        <form onSubmit={handleCreateSale} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          {/* Columna 1: Selección de Lentes y Armazón */}
          <section className="form-card">
            <h2>1. Armazón y Micas</h2>

            <label>
              Armazón físico disponible en vitrina:
              <select value={selectedFrameId} onChange={(e) => setSelectedFrameId(e.target.value)} required>
                {frames.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.internalCode} — {f.brand || 'Armazón'} (${f.retailPrice} MXN) [Stock: {f.stock}]
                  </option>
                ))}
              </select>
            </label>

            <label style={{ marginTop: '12px' }}>
              Material de las Micas:
              <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)}>
                {LENS_MATERIALS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} (+${m.price} MXN)
                  </option>
                ))}
              </select>
            </label>

            <div style={{ marginTop: '16px' }}>
              <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>
                Tratamientos Ópticos Adicionales:
              </strong>
              {TREATMENTS.map((t) => (
                <label key={t.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', margin: '6px 0' }}>
                  <input
                    type="checkbox"
                    checked={selectedTreatments.includes(t.id)}
                    onChange={() => toggleTreatment(t.id)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>
                    {t.label} (<strong>+${t.price} MXN</strong>)
                  </span>
                </label>
              ))}
            </div>

            <label style={{ marginTop: '16px' }}>
              Nombre del Paciente / Cliente:
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ej. Carmen Ortiz (o buscar en expediente)"
              />
            </label>
          </section>

          {/* Columna 2: Importes, Anticipo y Cobro */}
          <section className="form-card">
            <h2>2. Cobro de Anticipo y Promesa</h2>

            <div style={{ background: '#faf8f2', padding: '16px', border: '1px solid var(--line)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>Armazón:</span>
                <strong>${framePrice} MXN</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>Micas seleccionadas:</span>
                <strong>${materialPrice} MXN</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>Tratamientos:</span>
                <strong>${treatmentsPrice} MXN</strong>
              </div>
              <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                <span>TOTAL A COBRAR:</span>
                <span>${totalCalculated} MXN</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                Anticipo recibido ($):
                <input
                  type="number"
                  min="0"
                  max={totalCalculated}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                />
              </label>

              <label>
                Forma de pago:
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
                  <option value="cash">Efectivo</option>
                  <option value="card_debit">Tarjeta de Débito</option>
                  <option value="card_credit">Tarjeta de Crédito</option>
                  <option value="transfer">Transferencia (SPEI)</option>
                </select>
              </label>
            </div>

            <div style={{ margin: '14px 0', padding: '12px', background: balanceDue > 0 ? '#fff5f3' : '#eaf5ea', border: '1px solid var(--line)' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted)', display: 'block' }}>SALDO PENDIENTE A LA ENTREGA:</span>
              <strong style={{ fontSize: '1.4rem', color: balanceDue > 0 ? 'var(--accent)' : '#186a3b' }}>
                ${balanceDue} MXN
              </strong>
            </div>

            <label>
              Días estimados para entrega:
              <input
                type="number"
                min="1"
                max="30"
                value={promisedDays}
                onChange={(e) => setPromisedDays(e.target.value)}
                required
              />
            </label>

            <button className="button primary" type="submit" disabled={loading} style={{ marginTop: '16px' }}>
              {loading ? 'Confirmando venta...' : 'Confirmar Venta y Generar Ticket'}
            </button>
          </section>
        </form>
      )}
    </main>
  );
}
