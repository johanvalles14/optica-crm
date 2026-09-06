import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">ÓPTICA CRM / SPEC-001</p>
          <h1>Atención clara, expediente trazable.</h1>
        </div>
        <span className="status-pill">Modo demostración</span>
      </header>
      <section className="hero-grid">
        <article className="hero-card">
          <p className="eyebrow">Panel de trabajo</p>
          <h2>Atención clínica y mostrador comercial.</h2>
          <p>Registra pacientes, realiza consultas optométricas, cotiza lentes completos y gestiona inventario caótico.</p>
          <div className="actions" style={{ flexWrap: 'wrap' }}>
            <Link className="button primary" href="/sales/pos">Punto de Venta / Cotizador</Link>
            <Link className="button secondary" href="/inventory/intake">+ Alta Rápida de Lote</Link>
            <Link className="button secondary" href="/patients/new">Nuevo Paciente</Link>
            <Link className="button secondary" href="/frontdesk/summary">Mostrador Clínico</Link>
          </div>
        </article>
        <aside className="metric-card">
          <span className="metric-label">Módulos Activos</span>
          <strong>SPEC-001 & SPEC-002</strong>
          <p>Expediente clínico, punto de venta óptico, control de anticipos y recepción rápida de stock.</p>
        </aside>
      </section>
    </main>
  );
}
