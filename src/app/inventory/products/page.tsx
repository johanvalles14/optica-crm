'use client';

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';

type Product = {
  id: string;
  internalCode: string;
  vendorBarcode?: string;
  category: string;
  brand?: string;
  model?: string;
  description?: string;
  retailPrice: number;
  stock: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Modal de baja por merma / rotura
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState('1');
  const [adjustReason, setAdjustReason] = useState('damage_breakage');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  async function loadProducts(searchTerm = '') {
    setLoading(true);
    setError('');
    try {
      const role = localStorage.getItem('demo-role') || 'frontdesk:receptionist';
      const q = searchTerm ? `?term=${encodeURIComponent(searchTerm)}` : '';
      const res = await fetch(`/api/inventory/products${q}`, {
        headers: { 'x-demo-role': role },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar productos');
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar inventario');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    loadProducts(term);
  }

  async function handleRecordAdjustment(e: FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;
    setAdjustLoading(true);
    setError('');
    setMessage('');

    try {
      const role = localStorage.getItem('demo-role') || 'inventory:manager';
      const res = await fetch('/api/inventory/adjustments', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: -Math.abs(Number(adjustQuantity)), // Descuento de stock
          reason: adjustReason,
          notes: adjustNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar la baja');

      setMessage(`✓ Baja registrada correctamente para ${selectedProduct.internalCode}. Stock actualizado.`);
      setSelectedProduct(null);
      setAdjustNotes('');
      loadProducts(term);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar baja');
    } finally {
      setAdjustLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">INVENTARIO / CATÁLOGO & EXISTENCIAS</p>
          <h1>Stock y Catálogo de Óptica</h1>
          <p className="lede">
            Consulta existencias en tiempo real, busca por código de barras interno y registra bajas operativas inmediatas.
          </p>
        </div>
        <div className="actions">
          <Link href="/inventory/intake" className="button primary">
            + Alta Rápida de Lote
          </Link>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="form-message" role="status">{message}</p>}

      <form className="search-row" onSubmit={handleSearch}>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por código (ARM-0001), marca o modelo..."
          aria-label="Buscar producto"
        />
        <button className="button primary" type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {/* Modal / Panel de Baja Rápida por Merma (RF-110) */}
      {selectedProduct && (
        <div style={{ background: '#fff5f3', border: '2px solid var(--accent)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--accent)' }}>
            Registrar Baja / Merma: {selectedProduct.internalCode} ({selectedProduct.brand || 'Artículo'})
          </h2>
          <p className="lede" style={{ fontSize: '14px', margin: '8px 0 16px' }}>
            Stock actual: <strong>{selectedProduct.stock} piezas</strong>. Justifica el motivo de la baja para descontar de inmediato:
          </p>

          <form onSubmit={handleRecordAdjustment} style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                Motivo de la baja:
                <select value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}>
                  <option value="damage_breakage">Merma por rotura (en taller o vitrina)</option>
                  <option value="vendor_return">Devolución a proveedor por defecto</option>
                  <option value="warranty">Reposición por garantía de cliente</option>
                  <option value="physical_count">Ajuste por conteo físico / faltante</option>
                </select>
              </label>

              <label>
                Cantidad a descontar:
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  required
                />
              </label>
            </div>

            <label>
              Explicación detallada (obligatoria):
              <input
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="Ej. Varilla fracturada al biselar, defecto en bisagra de fábrica..."
                required
              />
            </label>

            <div className="actions" style={{ marginTop: '8px' }}>
              <button className="button primary" type="submit" disabled={adjustLoading}>
                {adjustLoading ? 'Descontando stock...' : 'Confirmar Baja Inmediata'}
              </button>
              <button className="button secondary" type="button" onClick={() => setSelectedProduct(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de existencias */}
      <div className="results">
        {products.map((p) => (
          <article className="result" key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="status-pill" style={{ marginRight: '10px' }}>{p.internalCode}</span>
              <strong>{p.brand ? `${p.brand} · ${p.model || ''}` : p.description || 'Producto'}</strong>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                Categoría: <code>{p.category}</code> · Precio Venta: <strong>${p.retailPrice} MXN</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', display: 'block', color: 'var(--muted)' }}>EXISTENCIAS</span>
                <strong style={{ fontSize: '1.4rem', color: p.stock > 0 ? '#186a3b' : 'var(--accent)' }}>
                  {p.stock}
                </strong>
              </div>
              {p.stock > 0 && (
                <button
                  className="button secondary"
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                  onClick={() => {
                    setSelectedProduct(p);
                    setAdjustQuantity('1');
                  }}
                >
                  ⚠️ Baja / Merma
                </button>
              )}
            </div>
          </article>
        ))}

        {products.length === 0 && !loading && (
          <p className="empty">No se encontraron productos en inventario.</p>
        )}
      </div>
    </main>
  );
}
