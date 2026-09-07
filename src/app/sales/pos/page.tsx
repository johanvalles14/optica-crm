'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { Printer, Search } from 'lucide-react';

type Product = {
  id: string;
  internalCode: string;
  brand?: string;
  model?: string;
  retailPrice: number;
  stock: number;
};

type Refraction = {
  sphere?: number;
  cylinder?: number;
  axis?: number;
  addition?: number;
  visualAcuity?: string;
  pupillaryDistance?: number;
};

type ClinicalContext = {
  consultation: { id: string; diagnosis?: string; clinicalNotes?: string };
  patient: { id: string; folio: string; firstName: string; middleName?: string; lastName: string; phone: string; email?: string };
  prescription?: {
    id: string;
    folio: string;
    usage: string;
    observations?: string;
    rightEyeSnapshot: Refraction;
    leftEyeSnapshot: Refraction;
  };
};

type CompletedOrder = {
  folio: string;
  status: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  createdAt: string;
  patientName?: string;
  items: Array<{ description: string; totalPrice: number }>;
};

const LENS_MATERIALS = [
  { id: 'cr39', label: 'CR-39 Monofocal Básico', price: 350, desc: 'Lente estándar ligero, uso diario' },
  { id: 'poly', label: 'Policarbonato Resistente al Impacto', price: 650, desc: 'Delgado, ideal para niños y deporte' },
  { id: 'hi_index', label: 'Alto Índice 1.67 Delgado', price: 1200, desc: 'Para graduaciones altas, ultra estético' },
];

const TREATMENTS = [
  { id: 'antireflective', label: 'Antirreflejante Estándar', price: 250 },
  { id: 'blue_filter', label: 'Filtro Azul (Protección Pantallas)', price: 350 },
  { id: 'photochromic', label: 'Fotocromático (Oscurece al Sol)', price: 700 },
];

function patientFullName(patient: ClinicalContext['patient']): string {
  return [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
}

function refractionText(refraction: Refraction): string {
  return `ESF ${refraction.sphere ?? '—'} · CIL ${refraction.cylinder ?? '—'} · EJE ${refraction.axis ?? '—'} · ADD ${refraction.addition ?? '—'}`;
}

function PosContent() {
  const searchParams = useSearchParams();
  const consultationIdFromQueue = searchParams.get('consultationId');
  const prescriptionIdFromQueue = searchParams.get('prescriptionId');
  const patientIdFromQuery = searchParams.get('patientId') || '';
  const patientNameFromQuery = searchParams.get('patientName') || '';

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(patientIdFromQuery || consultationIdFromQueue ? 2 : 1);
  const [frames, setFrames] = useState<Product[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(LENS_MATERIALS[0].id);
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);

  const [patientNameValue, setPatientNameValue] = useState(patientNameFromQuery);
  const [patientId, setPatientId] = useState(patientIdFromQuery);
  const [prescriptionId, setPrescriptionId] = useState(prescriptionIdFromQueue || '');
  const [clinicalContext, setClinicalContext] = useState<ClinicalContext | null>(null);

  const [quoteOnly, setQuoteOnly] = useState(false);
  const [promisedDays, setPromisedDays] = useState('3');
  const [depositAmount, setDepositAmount] = useState('500');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card_debit' | 'card_credit' | 'transfer'>('cash');
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [error, setError] = useState('');

  // Cargar catálogo de armazones disponibles
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

  // Cargar contexto clínico si viene desde la cola de mostrador
  useEffect(() => {
    if (!consultationIdFromQueue) return;

    async function loadClinicalContext() {
      setLoadingContext(true);
      setError('');
      try {
        const role = localStorage.getItem('demo-role') || 'frontdesk:receptionist';
        const response = await fetch(`/api/frontdesk/queue?consultationId=${consultationIdFromQueue}`, {
          headers: { 'x-demo-role': role, 'x-actor-id': 'user-rec-001' },
        });
        const data = await response.json();
        const entry = data.entry ?? data.queue?.find((item: any) => item.consultation.id === consultationIdFromQueue);
        if (!response.ok || !entry || !entry.patient) {
          throw new Error(data.error || 'No se pudo recuperar la receta enviada');
        }
        setClinicalContext(entry);
        setPatientNameValue(patientFullName(entry.patient));
        setPatientId(entry.patient.id);
        if (entry.prescription) setPrescriptionId(entry.prescription.id);
        setCurrentStep(2);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar receta');
      } finally {
        setLoadingContext(false);
      }
    }

    loadClinicalContext();
  }, [consultationIdFromQueue]);

  const currentFrame = frames.find((f) => f.id === selectedFrameId);
  const framePrice = currentFrame ? currentFrame.retailPrice : 0;
  const materialObj = LENS_MATERIALS.find((m) => m.id === selectedMaterial);
  const materialPrice = materialObj?.price ?? 0;
  const treatmentsPrice = selectedTreatments.reduce((acc, tId) => {
    const t = TREATMENTS.find((x) => x.id === tId);
    return acc + (t?.price ?? 0);
  }, 0);

  const totalCalculated = framePrice + materialPrice + treatmentsPrice;
  const depositNum = Number(depositAmount) || 0;
  const balanceDue = Math.max(0, totalCalculated - (quoteOnly ? 0 : depositNum));

  function toggleTreatment(id: string) {
    setSelectedTreatments((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]
    );
  }

  async function handleCreateOrder(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!patientNameValue.trim()) {
      setError('Por favor indica el nombre del paciente antes de continuar.');
      setCurrentStep(1);
      return;
    }

    if (!currentFrame) {
      setError('Selecciona un armazón en existencia.');
      setCurrentStep(2);
      return;
    }

    if (!quoteOnly && depositNum <= 0) {
      setError('Para confirmar la venta se requiere registrar un anticipo mayor a $0.');
      return;
    }

    setLoading(true);
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + Number(promisedDays));

    const items = [
      {
        itemType: 'frame',
        productId: currentFrame.id,
        description: `Armazón ${currentFrame.internalCode} (${currentFrame.brand || 'Óptica'})`,
        quantity: 1,
        unitPrice: framePrice,
      },
      {
        itemType: 'lens_complete',
        description: `Micas: ${materialObj?.label}${
          selectedTreatments.length > 0 ? ` + Tratamientos (${selectedTreatments.join(', ')})` : ''
        }`,
        lensConfig: {
          material: selectedMaterial,
          treatments: selectedTreatments,
          price: materialPrice + treatmentsPrice,
        },
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
          patientId: patientId || undefined,
          patientName: patientNameValue,
          prescriptionId: prescriptionId || undefined,
          items,
          promisedDeliveryDate: deliveryDate.toISOString(),
          notes: clinicalContext?.prescription
            ? `Receta ${clinicalContext.prescription.folio} · Graduación de gabinete`
            : undefined,
          initialPayment: quoteOnly ? undefined : { amount: depositNum, method: paymentMethod },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.order) throw new Error(data.error || 'No se pudo generar la venta');

      setCompletedOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la orden');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      {/* Encabezado */}
      <header className="topbar">
        <div>
          <p className="eyebrow">MOSTRADOR / VENTAS</p>
          <h1>Configurador y Venta de Lentes</h1>
          <p className="lede">
            Asistente en 3 pasos para cotizar, descontar armazón y generar el comprobante térmico.
          </p>
        </div>
        <div className="actions">
          <Link href="/sales/orders" className="button secondary">
            Ver Pedidos en Taller
          </Link>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}
      {loadingContext && <p className="form-message">Cargando receta desde gabinete...</p>}

      {completedOrder ? (
        /* Vista de Confirmación y Ticket Térmico */
        <section className="card" style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', padding: '32px' }}>
          <span className="status-pill success" style={{ fontSize: '13px', padding: '6px 14px' }}>
            ✓ {completedOrder.status === 'quote' ? 'Cotización Guardada' : 'Venta Confirmada y Stock Apartado'}
          </span>

          <h2 style={{ margin: '16px 0 4px', fontSize: '1.75rem' }}>
            Folio: {completedOrder.folio}
          </h2>
          <p className="lede" style={{ margin: '0 auto 20px' }}>
            Cliente: <strong>{completedOrder.patientName || patientNameValue}</strong>
          </p>

          {/* Ticket Térmico Simulado para Impresión Limpia */}
          <div
            style={{
              background: '#ffffff',
              border: '1px dashed #475569',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              fontFamily: 'monospace',
              fontSize: '13px',
              textAlign: 'left',
              margin: '20px auto',
              maxWidth: '340px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <strong style={{ fontSize: '15px' }}>ÓPTICA CRM</strong>
              <br />
              <span style={{ fontSize: '11px', color: '#64748b' }}>Sucursal Matriz</span>
              <br />
              <span>{completedOrder.status === 'quote' ? 'COTIZACIÓN' : 'COMPROBANTE DE VENTA'}</span>
              <br />
              <span>#{completedOrder.folio}</span>
              <br />
              <span style={{ fontSize: '11px' }}>{new Date(completedOrder.createdAt).toLocaleString()}</span>
            </div>

            <hr style={{ border: 0, borderTop: '1px dashed #cbd5e1', margin: '10px 0' }} />

            <div style={{ margin: '6px 0' }}>
              <strong>Cliente:</strong> {completedOrder.patientName || patientNameValue}
            </div>

            <hr style={{ border: 0, borderTop: '1px dashed #cbd5e1', margin: '10px 0' }} />

            <div style={{ display: 'grid', gap: '6px' }}>
              {completedOrder.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ maxWidth: '220px' }}>{it.description}</span>
                  <strong>${it.totalPrice}</strong>
                </div>
              ))}
            </div>

            <hr style={{ border: 0, borderTop: '1px dashed #cbd5e1', margin: '10px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>TOTAL:</span>
              <span>${completedOrder.total} MXN</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
              <span>ANTICIPO PAGADO:</span>
              <span>${completedOrder.paidAmount} MXN</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb', fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>
              <span>SALDO A ENTREGA:</span>
              <span>${completedOrder.balanceDue} MXN</span>
            </div>

            <hr style={{ border: 0, borderTop: '1px dashed #cbd5e1', margin: '12px 0' }} />

            <p style={{ fontSize: '11px', textAlign: 'center', color: '#64748b', margin: 0 }}>
              Para recoger sus lentes terminados presente este comprobante y liquide el saldo pendiente. ¡Gracias por su preferencia!
            </p>
          </div>

          <div className="actions" style={{ justifyContent: 'center', marginTop: '20px' }}>
            <button className="button primary" onClick={() => window.print()}>
              <Printer size={16} aria-hidden="true" /> Imprimir Comprobante
            </button>
            <Link href="/sales/orders" className="button secondary">
              Ver en Pedidos
            </Link>
            <button
              className="button subtle"
              onClick={() => {
                setCompletedOrder(null);
                setCurrentStep(1);
              }}
            >
              Nueva Cotización
            </button>
          </div>
        </section>
      ) : (
        /* Asistente de 3 Pasos */
        <div>
          {/* Stepper Superior */}
          <div className="card stepper" style={{ padding: '14px 20px', marginBottom: '24px' }}>
            <button
              type="button"
              className={`step-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
              onClick={() => setCurrentStep(1)}
            >
              <span className="step-num">{currentStep > 1 ? '✓' : '1'}</span>
              <span>1. Paciente</span>
            </button>

            <span style={{ color: 'var(--subtle)' }}>→</span>

            <button
              type="button"
              className={`step-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
              onClick={() => setCurrentStep(2)}
            >
              <span className="step-num">{currentStep > 2 ? '✓' : '2'}</span>
              <span>2. Armazón & Micas</span>
            </button>

            <span style={{ color: 'var(--subtle)' }}>→</span>

            <button
              type="button"
              className={`step-item ${currentStep === 3 ? 'active' : ''}`}
              onClick={() => setCurrentStep(3)}
            >
              <span className="step-num">3</span>
              <span>3. Anticipo & Cobro</span>
            </button>
          </div>

          <form onSubmit={handleCreateOrder}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Contenido Dinámico del Paso */}
              <div style={{ display: 'grid', gap: '20px' }}>
                {/* Paso 1: Paciente */}
                {currentStep === 1 && (
                  <section className="card">
                    <div className="card-header">
                      <h2>Paso 1: Datos del Paciente</h2>
                    </div>
                    <p className="lede">
                      Asigna la venta a un expediente para vincular su graduación óptica y dar seguimiento a la entrega.
                    </p>

                    <label>
                      Nombre Completo del Paciente *
                      <input
                        value={patientNameValue}
                        onChange={(e) => setPatientNameValue(e.target.value)}
                        placeholder="Ej. Roberto Gómez Silva"
                        required
                        autoFocus
                      />
                    </label>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                      <Link href="/patients/search" className="button secondary" style={{ fontSize: '12px' }}>
                        <Search size={15} aria-hidden="true" /> Buscar en Directorio
                      </Link>
                      <Link href="/patients/new" className="button secondary" style={{ fontSize: '12px' }}>
                        + Registrar Paciente Nuevo
                      </Link>
                    </div>

                    <div className="actions" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
                      <button
                        type="button"
                        className="button primary"
                        onClick={() => {
                          if (!patientNameValue.trim()) {
                            setError('Ingresa el nombre del paciente para avanzar');
                            return;
                          }
                          setError('');
                          setCurrentStep(2);
                        }}
                      >
                        Continuar a Armazón y Micas →
                      </button>
                    </div>
                  </section>
                )}

                {/* Paso 2: Armazón y Micas */}
                {currentStep === 2 && (
                  <section className="card">
                    <div className="card-header">
                      <h2>Paso 2: Armazón y Cristales Ópticos</h2>
                    </div>

                    {clinicalContext?.prescription && (
                      <div
                        style={{
                          background: 'var(--accent-light)',
                          border: '1px solid var(--accent-border)',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '16px',
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>
                          Receta Vinculada: {clinicalContext.prescription.folio}
                        </span>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--ink)' }}>
                          OD: {refractionText(clinicalContext.prescription.rightEyeSnapshot)}
                          <br />
                          OI: {refractionText(clinicalContext.prescription.leftEyeSnapshot)}
                        </p>
                      </div>
                    )}

                    {/* Selector de Armazón */}
                    <label>
                      Armazón en Existencia *
                      <select
                        value={selectedFrameId}
                        onChange={(e) => setSelectedFrameId(e.target.value)}
                        required
                      >
                        {frames.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.internalCode} — {f.brand || 'Armazón'} [${f.retailPrice} MXN] · Stock: {f.stock} pzas
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* Selector de Micas */}
                    <div style={{ marginTop: '16px' }}>
                      <label style={{ marginBottom: '8px' }}>Tipo de Micas / Material *</label>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {LENS_MATERIALS.map((m) => (
                          <label
                            key={m.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px 14px',
                              borderRadius: 'var(--radius-md)',
                              border: selectedMaterial === m.id ? '2px solid var(--accent)' : '1px solid var(--line)',
                              background: selectedMaterial === m.id ? 'var(--accent-light)' : '#ffffff',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <input
                                type="radio"
                                name="material"
                                checked={selectedMaterial === m.id}
                                onChange={() => setSelectedMaterial(m.id)}
                                style={{ width: '18px', height: '18px', minHeight: 'unset' }}
                              />
                              <div>
                                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{m.label}</span>
                                <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted)' }}>
                                  {m.desc}
                                </span>
                              </div>
                            </div>
                            <strong style={{ color: 'var(--ink)' }}>+${m.price} MXN</strong>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Tratamientos Adicionales */}
                    <div style={{ marginTop: '16px' }}>
                      <label style={{ marginBottom: '8px' }}>Tratamientos Ópticos Adicionales</label>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {TREATMENTS.map((t) => (
                          <label
                            key={t.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--line)',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <input
                                type="checkbox"
                                checked={selectedTreatments.includes(t.id)}
                                onChange={() => toggleTreatment(t.id)}
                                style={{ width: '18px', height: '18px', minHeight: 'unset' }}
                              />
                              <span style={{ fontSize: '13px', color: 'var(--ink)' }}>{t.label}</span>
                            </div>
                            <strong style={{ fontSize: '13px' }}>+${t.price} MXN</strong>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="actions" style={{ justifyContent: 'space-between', marginTop: '24px' }}>
                      <button type="button" className="button secondary" onClick={() => setCurrentStep(1)}>
                        ← Volver a Paciente
                      </button>
                      <button type="button" className="button primary" onClick={() => setCurrentStep(3)}>
                        Continuar a Cobro y Anticipo →
                      </button>
                    </div>
                  </section>
                )}

                {/* Paso 3: Cobro y Promesa */}
                {currentStep === 3 && (
                  <section className="card">
                    <div className="card-header">
                      <h2>Paso 3: Cobro de Anticipo y Promesa de Entrega</h2>
                    </div>

                    <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                      <label>Tipo de Documento:</label>
                      <div style={{ display: 'flex', gap: '14px' }}>
                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="quoteMode"
                            checked={!quoteOnly}
                            onChange={() => setQuoteOnly(false)}
                            style={{ width: '18px', height: '18px', minHeight: 'unset' }}
                          />
                          <span>Venta con Anticipo (Descuenta stock)</span>
                        </label>

                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="quoteMode"
                            checked={quoteOnly}
                            onChange={() => setQuoteOnly(true)}
                            style={{ width: '18px', height: '18px', minHeight: 'unset' }}
                          />
                          <span>Solo Cotización (Sin cobro)</span>
                        </label>
                      </div>
                    </div>

                    {!quoteOnly && (
                      <div className="form-grid two-cols">
                        <label>
                          Anticipo Recibido ($ MXN) *
                          <input
                            type="number"
                            min="1"
                            max={totalCalculated}
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            required
                          />
                        </label>

                        <label>
                          Forma de Pago *
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
                    )}

                    <div style={{ marginTop: '16px' }}>
                      <label>
                        Días Estimados para Entrega en Mostrador *
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={promisedDays}
                          onChange={(e) => setPromisedDays(e.target.value)}
                          required
                        />
                      </label>
                    </div>

                    <div className="actions" style={{ justifyContent: 'space-between', marginTop: '24px' }}>
                      <button type="button" className="button secondary" onClick={() => setCurrentStep(2)}>
                        ← Modificar Armazón o Micas
                      </button>
                      <button className="button primary" type="submit" disabled={loading} style={{ minHeight: '44px' }}>
                        {loading ? 'Confirmando...' : quoteOnly ? 'Guardar Cotización' : 'Confirmar Venta y Generar Ticket'}
                      </button>
                    </div>
                  </section>
                )}
              </div>

              {/* Panel Lateral de Resumen de Cotización en Vivo */}
              <aside className="card" style={{ height: 'fit-content', background: '#ffffff', position: 'sticky', top: '80px' }}>
                <div className="card-header">
                  <h3>Resumen de Pedido</h3>
                  <span className="status-pill process">En vivo</span>
                </div>

                <div style={{ fontSize: '13px', display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Paciente:</span>
                    <strong>{patientNameValue || 'Sin asignar'}</strong>
                  </div>

                  <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Armazón:</span>
                    <strong>${framePrice} MXN</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Micas ({materialObj?.label.split(' ')[0]}):</span>
                    <strong>${materialPrice} MXN</strong>
                  </div>

                  {treatmentsPrice > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tratamientos ({selectedTreatments.length}):</span>
                      <strong>${treatmentsPrice} MXN</strong>
                    </div>
                  )}

                  <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700 }}>
                    <span>Total a pagar:</span>
                    <span style={{ color: 'var(--ink)' }}>${totalCalculated} MXN</span>
                  </div>

                  {!quoteOnly && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                        <span>Anticipo en mostrador:</span>
                        <span>-${depositNum} MXN</span>
                      </div>

                      <div
                        style={{
                          background: balanceDue > 0 ? 'var(--warning-light)' : 'var(--success-light)',
                          border: `1px solid ${balanceDue > 0 ? 'var(--warning-border)' : 'var(--success-border)'}`,
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '6px',
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-secondary)' }}>
                          Saldo al entregar:
                        </span>
                        <strong style={{ fontSize: '16px', color: balanceDue > 0 ? 'var(--warning)' : '#059669' }}>
                          ${balanceDue} MXN
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              </aside>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

export default function PosPage() {
  return (
    <Suspense fallback={<div className="shell"><p className="empty">Cargando configurador...</p></div>}>
      <PosContent />
    </Suspense>
  );
}
