'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [pendingDeliveryCount, setPendingDeliveryCount] = useState<number | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/sales/orders');
        const data = await res.json();
        if (res.ok && data.orders) {
          setOrdersCount(data.orders.length);
          const ready = data.orders.filter(
            (o: any) => o.status === 'ready_for_delivery' || o.status === 'confirmed_in_process'
          ).length;
          setPendingDeliveryCount(ready);
        }
      } catch {
        // Fallback silencioso
      }
    }
    loadStats();
  }, []);

  const todayStr = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="shell">
      {/* Saludo y Cabecera del Día */}
      <header className="topbar">
        <div>
          <p className="eyebrow">ÓPTICA CRM · SUCURSAL MATRIZ</p>
          <h1>Panel de Trabajo Diario</h1>
          <p className="lede" style={{ textTransform: 'capitalize' }}>
            {todayStr} · Modo operativo para mostrador y gabinete clínico
          </p>
        </div>
        <div className="actions">
          <span className="status-pill success">● Sistema en línea</span>
          <span className="status-pill">Turno activo</span>
        </div>
      </header>

      {/* Los 3 Grandes Accesos Operativos Diarios (Decisión Q8) */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginBottom: '36px',
        }}
      >
        {/* Acción 1: Pacientes */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: '4px solid var(--accent)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                🗂️
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Pacientes</h2>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Expedientes y datos de salud</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.5' }}>
              Localiza el historial de atenciones, graduaciones anteriores o registra a una persona que visita la óptica por primera vez.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <Link href="/patients/new" className="button primary" style={{ flex: 1 }}>
              + Nuevo Paciente
            </Link>
            <Link href="/patients/search" className="button secondary">
              Buscar
            </Link>
          </div>
        </div>

        {/* Acción 2: Ventas / Configurador */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: '4px solid #059669',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--success-light)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                👓
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Nueva Venta</h2>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Punto de venta y lentes</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.5' }}>
              Selecciona armazón de vitrina, micas con tratamientos, registra el anticipo recibido y emite el comprobante para el cliente.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <Link href="/sales/pos" className="button primary" style={{ flex: 1, background: '#059669' }}>
              + Cotizar / Venta Óptica
            </Link>
          </div>
        </div>

        {/* Acción 3: Pedidos y Entregas */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: '4px solid #d97706',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--warning-light)',
                  color: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                🛍️
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Entregar Pedidos</h2>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Lentes listos en mostrador</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.5' }}>
              Revisa los anteojos terminados por taller, liquida saldos pendientes, emite factura SAT si lo piden y entrega al paciente.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <Link href="/sales/orders" className="button secondary" style={{ flex: 1 }}>
              Ver Pedidos ({pendingDeliveryCount !== null ? pendingDeliveryCount : '...'})
            </Link>
          </div>
        </div>
      </section>

      {/* Métricas Rápidas del Día */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '36px',
        }}
      >
        <div className="card" style={{ padding: '18px 22px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Pedidos en Preparación
          </span>
          <strong style={{ fontSize: '1.8rem', display: 'block', margin: '4px 0', color: 'var(--ink)' }}>
            {pendingDeliveryCount !== null ? pendingDeliveryCount : '0'}
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Trabajos en proceso o taller</span>
        </div>

        <div className="card" style={{ padding: '18px 22px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Historial Órdenes
          </span>
          <strong style={{ fontSize: '1.8rem', display: 'block', margin: '4px 0', color: 'var(--ink)' }}>
            {ordersCount !== null ? ordersCount : '0'}
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Ventas generadas en sucursal</span>
        </div>

        <div className="card" style={{ padding: '18px 22px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Estado de Gabinete
          </span>
          <strong style={{ fontSize: '1.8rem', display: 'block', margin: '4px 0', color: 'var(--accent)' }}>
            Disponible
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Refracción y consultas activas</span>
        </div>

        <div className="card" style={{ padding: '18px 22px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Caja del Turno
          </span>
          <strong style={{ fontSize: '1.8rem', display: 'block', margin: '4px 0', color: '#059669' }}>
            Abierta
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Cobro de anticipos y liquidación</span>
        </div>
      </section>

      {/* Módulos de Apoyo y Guía Contextual */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Módulos de Soporte */}
        <section className="card">
          <div className="card-header">
            <h3>Áreas Especializadas</h3>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Acceso complementario</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Link
              href="/consultations"
              className="button secondary"
              style={{ justifyContent: 'flex-start', fontSize: '12px' }}
            >
              <span>🔬</span> Gabinete Clínico
            </Link>

            <Link
              href="/laboratory/kanban"
              className="button secondary"
              style={{ justifyContent: 'flex-start', fontSize: '12px' }}
            >
              <span>⚙️</span> Taller de Biselado
            </Link>

            <Link
              href="/inventory/products"
              className="button secondary"
              style={{ justifyContent: 'flex-start', fontSize: '12px' }}
            >
              <span>📦</span> Catálogo de Armazones
            </Link>

            <Link
              href="/inventory/intake"
              className="button secondary"
              style={{ justifyContent: 'flex-start', fontSize: '12px' }}
            >
              <span>🏷️</span> Alta Rápida de Stock
            </Link>

            <Link
              href="/cash/shift"
              className="button secondary"
              style={{ justifyContent: 'flex-start', fontSize: '12px' }}
            >
              <span>💵</span> Control de Caja
            </Link>

            <Link
              href="/billing/invoices"
              className="button secondary"
              style={{ justifyContent: 'flex-start', fontSize: '12px' }}
            >
              <span>🧾</span> Facturas Fiscales SAT
            </Link>
          </div>
        </section>

        {/* Guía Rápida para Principiantes */}
        <section className="card" style={{ background: 'var(--card-subtle)' }}>
          <div className="card-header">
            <h3>💡 Guía Rápida para Mostrador</h3>
          </div>

          <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--ink-secondary)' }}>
            <li>
              <strong>Llega un cliente:</strong> Búscalo primero por su nombre o teléfono. Si no existe, pulsa <em>Nuevo Paciente</em> para registrarlo en 1 minuto.
            </li>
            <li>
              <strong>Pasa a examen:</strong> Abre su ficha y selecciona <em>Iniciar Consulta</em> para que el optometrista registre su graduación.
            </li>
            <li>
              <strong>Venta de lentes:</strong> Selecciona <em>Nueva Venta</em>, elige el armazón y las micas. Cobra al menos el anticipo para enviar a taller.
            </li>
            <li>
              <strong>Entrega de anteojos:</strong> Cuando taller termine el biselado, busca el pedido en <em>Pedidos</em>, cobra el saldo restante y entrégalo.
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}
