'use client';

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';

type Shift = {
  id: string;
  status: string;
  initialFloat: number;
  expensesTotal: number;
  openedAt: string;
  version: number;
};

export default function CashShiftPage() {
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Apertura
  const [initialFloat, setInitialFloat] = useState('500');
  const [openLoading, setOpenLoading] = useState(false);

  // Gastos menores
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseReceipt, setExpenseReceipt] = useState('');
  const [expenseLoading, setExpenseLoading] = useState(false);

  async function loadShift() {
    setLoading(true);
    setError('');
    try {
      const role = localStorage.getItem('demo-role') || 'frontdesk:receptionist';
      const res = await fetch('/api/cash/shift?branchId=branch-001', {
        headers: { 'x-demo-role': role },
      });
      const data = await res.json();
      if (res.ok) setShift(data.shift);
      else throw new Error(data.error || 'Error al cargar turno');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShift();
  }, []);

  async function handleOpenShift(e: FormEvent) {
    e.preventDefault();
    setOpenLoading(true);
    setError('');
    setMessage('');
    try {
      const role = localStorage.getItem('demo-role') || 'frontdesk:receptionist';
      const res = await fetch('/api/cash/shift', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({
          branchId: 'branch-001',
          initialFloat: Number(initialFloat),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo abrir el turno');

      setMessage('✓ Turno de caja abierto exitosamente con fondo inicial.');
      setShift(data.shift);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir turno');
    } finally {
      setOpenLoading(false);
    }
  }

  async function handleRecordExpense(e: FormEvent) {
    e.preventDefault();
    if (!shift) return;
    setExpenseLoading(true);
    setError('');
    setMessage('');
    try {
      const role = localStorage.getItem('demo-role') || 'frontdesk:receptionist';
      const res = await fetch(`/api/cash/shift/${shift.id}/expense`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({
          amount: Number(expenseAmount),
          description: expenseDesc,
          receiptNumber: expenseReceipt || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar gasto');

      setMessage(`✓ Gasto menor de $${expenseAmount} MXN registrado correctamente.`);
      setExpenseAmount('');
      setExpenseDesc('');
      setExpenseReceipt('');
      loadShift();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar gasto');
    } finally {
      setExpenseLoading(false);
    }
  }

  return (
    <main className="shell narrow">
      <header className="topbar">
        <div>
          <p className="eyebrow">CAJA & FINANZAS / TURNO DIARIO</p>
          <h1>Control de Caja Mostrador</h1>
          <p className="lede">
            Fondo inicial de cambio, registro de gastos chicos y corte de efectivo.
          </p>
        </div>
        <div className="actions">
          <Link href="/cash/receivables" className="button secondary">
            Saldos en la Calle
          </Link>
          {shift && (
            <Link href="/cash/close" className="button primary">
              Corte y Arqueo Ciego
            </Link>
          )}
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="form-message" role="status">{message}</p>}

      {!shift ? (
        /* Formulario para Abrir Turno */
        <section className="form-card">
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Apertura de Turno de Caja</h2>
          <p className="lede">
            No hay un turno abierto actualmente en esta sucursal. Ingresa el fondo de cambio (morralla) para comenzar la jornada:
          </p>

          <form onSubmit={handleOpenShift} style={{ display: 'grid', gap: '14px', marginTop: '16px' }}>
            <label>
              Fondo inicial de cambio ($ MXN):
              <input
                type="number"
                min="0"
                step="50"
                value={initialFloat}
                onChange={(e) => setInitialFloat(e.target.value)}
                required
              />
            </label>

            <button className="button primary" type="submit" disabled={openLoading}>
              {openLoading ? 'Abriendo caja...' : 'Abrir Turno de Caja'}
            </button>
          </form>
        </section>
      ) : (
        /* Turno Activo */
        <div style={{ display: 'grid', gap: '24px' }}>
          <section className="hero-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Estado del Turno Actual</h2>
              <span className="status-pill" style={{ background: '#eaf5ea', color: '#186a3b', fontWeight: 'bold' }}>
                🟢 Turno Abierto
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: '#faf8f2', padding: '16px', border: '1px solid var(--line)' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>FONDO INICIAL</span>
                <strong style={{ fontSize: '1.6rem' }}>${shift.initialFloat} MXN</strong>
              </div>

              <div style={{ background: '#faf8f2', padding: '16px', border: '1px solid var(--line)' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>GASTOS MENORES REGISTRADOS</span>
                <strong style={{ fontSize: '1.6rem', color: 'var(--accent)' }}>${shift.expensesTotal} MXN</strong>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <Link href="/cash/close" className="button primary">
                Ir al Corte y Arqueo Ciego
              </Link>
            </div>
          </section>

          {/* Formulario de Gasto Menor / Salida de Caja Chica */}
          <section className="form-card">
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Registrar Gasto Menor de Caja Chica</h2>
            <p className="lede" style={{ fontSize: '13px', margin: '6px 0 16px' }}>
              Registra pagos chicos en efectivo (garrafón de agua, mensajería, artículos de limpieza) para que cuadre el corte al centavo.
            </p>

            <form onSubmit={handleRecordExpense} style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Importe del gasto ($ MXN):
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="Ej. 65"
                    required
                  />
                </label>

                <label>
                  Folio de recibo / nota (opcional):
                  <input
                    value={expenseReceipt}
                    onChange={(e) => setExpenseReceipt(e.target.value)}
                    placeholder="Ej. REC-094"
                  />
                </label>
              </div>

              <label>
                Concepto obligatorio:
                <input
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Ej. Garrafón de agua y vasos térmicos"
                  required
                />
              </label>

              <button className="button secondary" type="submit" disabled={expenseLoading}>
                {expenseLoading ? 'Registrando salida...' : '- Registrar Salida de Dinero'}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
