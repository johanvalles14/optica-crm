'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import Barcode from '../../../components/Barcode';
import { CircleCheck, Printer } from 'lucide-react';

type CreatedProduct = {
  id: string;
  internalCode: string;
  category: string;
  brand?: string;
  retailPrice: number;
};

export default function InventoryIntakePage() {
  const [category, setCategory] = useState('frame');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [retailPrice, setRetailPrice] = useState('850');
  const [costPrice, setCostPrice] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [createdBatch, setCreatedBatch] = useState<CreatedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const role = localStorage.getItem('demo-role') || 'inventory:manager';
      const res = await fetch('/api/inventory/intake', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({
          category,
          brand: brand || undefined,
          descriptionPattern: description || undefined,
          retailPrice: Number(retailPrice),
          costPrice: costPrice ? Number(costPrice) : undefined,
          quantity: Number(quantity),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar el lote');

      setCreatedBatch(data.products);
      setMessage(`Se generaron exitosamente ${data.products.length} códigos listos para etiquetar.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">INVENTARIO / ALTA RÁPIDA DE EMBARQUES</p>
          <h1>Recepción de Inventario Caótico</h1>
          <p className="lede">
            Ingresa cajas o paquetes de armazones sin código en 1 solo paso y genera etiquetas adhesivas inmediatas.
          </p>
        </div>
        <div className="actions">
          <Link href="/inventory/products" className="button secondary">
            Ver Catálogo de Stock
          </Link>
          {createdBatch.length > 0 && (
            <button className="button primary" onClick={handlePrint}>
              <Printer size={16} aria-hidden="true" /> Imprimir Etiquetas ({createdBatch.length})
            </button>
          )}
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}
      {message && (
        <p className="form-message" role="status" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CircleCheck size={16} aria-hidden="true" />
          {message}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
        {/* Formulario de Alta Rápida */}
        <section className="form-card no-print" aria-labelledby="intake-title">
          <h2 id="intake-title" style={{ fontSize: '1.5rem', margin: 0 }}>
            Datos del Lote Recibido
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px', marginTop: '16px' }}>
            <label>
              Tipo de artículo:
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="frame">Armazones (Gafas)</option>
                <option value="solution">Soluciones y Gotas</option>
                <option value="accessory">Accesorios y Estuches</option>
                <option value="contact_lens">Lentes de Contacto</option>
              </select>
            </label>

            <label>
              Marca / Línea comercial del embarque:
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ej. Genérico Acero, Colección Primavera..."
              />
            </label>

            <label>
              Descripción general o gama:
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Gama Media $850, colores surtidos"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                Precio Venta Público ($):
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value)}
                  required
                />
              </label>

              <label>
                Costo Proveedor (opcional):
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="Solo visible para admin"
                />
              </label>
            </div>

            <label>
              Número de piezas en la caja / lote:
              <input
                type="number"
                min="1"
                max="200"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </label>

            <button className="button primary" type="submit" disabled={loading} style={{ marginTop: '10px' }}>
              {loading ? 'Generando códigos en serie...' : `Dar de Alta ${quantity} Piezas`}
            </button>
          </form>
        </section>

        {/* Muestra de etiquetas generadas */}
        <section className="hero-card label-sheet-card" aria-labelledby="labels-title">
          <h2 id="labels-title">Planilla de Etiquetas Generadas</h2>
          <p className="lede" style={{ fontSize: '13px' }}>
            Etiquetas con código interno para pegar directamente en las varillas de los armazones o empaques.
          </p>

          {createdBatch.length === 0 ? (
            <p className="empty" style={{ marginTop: '30px' }}>
              Ingresa los datos a la izquierda para generar las etiquetas del lote.
            </p>
          ) : (
            <div
              className="print-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '12px',
                marginTop: '16px',
                maxHeight: '440px',
                overflowY: 'auto',
                padding: '8px',
                border: '1px solid var(--line)',
                background: 'white',
              }}
            >
              {createdBatch.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: '1px dashed #333',
                    padding: '8px',
                    textAlign: 'center',
                    background: '#fffef9',
                    breakInside: 'avoid',
                    pageBreakInside: 'avoid',
                  }}
                >
                  <strong style={{ fontSize: '11px', display: 'block', color: 'var(--muted)' }}>
                    ÓPTICA CRM
                  </strong>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', display: 'block', margin: '3px 0' }}>
                    {item.internalCode}
                  </span>
                  <div style={{ margin: '4px auto', width: '100%' }}>
                    <Barcode
                      value={item.internalCode}
                      width={1.2}
                      height={28}
                      displayValue={false}
                    />
                  </div>
                  <small style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginTop: '2px' }}>
                    ${item.retailPrice} MXN
                  </small>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .label-sheet-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .print-grid {
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            padding: 0 !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </main>
  );
}
