'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Printer } from 'lucide-react';

type EyeLabData = {
  sphere?: number;
  cylinder?: number;
  axis?: number;
  addition?: number;
  pupillaryDistance?: number;
  opticalCenterHeight?: number;
};

type TraySlipData = {
  labOrderFolio: string;
  saleOrderFolio: string;
  patientName: string;
  date: string;
  frameCode: string;
  frameMountingType: string;
  lensMaterial: string;
  treatmentsText: string;
  rightEye: EyeLabData;
  leftEye: EyeLabData;
  destinationText: string;
  observations?: string;
};

export default function TraySlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const labOrderId = resolvedParams.id;

  const [slip, setSlip] = useState<TraySlipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSlip() {
      try {
        const res = await fetch(`/api/laboratory/orders/${labOrderId}/slip`);
        const data = await res.json();
        if (res.ok) setSlip(data.slip);
        else throw new Error(data.error || 'Error al cargar boleta');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setLoading(false);
      }
    }
    fetchSlip();
  }, [labOrderId]);

  if (loading) return <main className="shell narrow"><p>Cargando boleta de charola...</p></main>;
  if (error || !slip) return <main className="shell narrow"><p className="error">{error || 'No se encontró la boleta'}</p></main>;

  return (
    <main className="shell narrow">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }} className="no-print">
        <Link href="/laboratory/kanban" className="button secondary">
          ← Volver al Tablero Kanban
        </Link>
        <button className="button primary" onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" /> Imprimir Boleta de Charola
        </button>
      </div>

      {/* Formato de Boleta para Charola de Montaje */}
      <section
        style={{
          background: 'white',
          border: '2px solid #222',
          padding: '24px',
          fontFamily: 'Arial, sans-serif',
          maxWidth: '540px',
          margin: '0 auto',
        }}
      >
        <header style={{ borderBottom: '2px solid #222', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', margin: 0 }}>BOLETA DE CHAROLA DE MONTAJE</h1>
            <p style={{ margin: '4px 0 0', color: '#555', fontSize: '12px' }}>ÓPTICA CRM · TALLER DE BISELADO</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', display: 'block' }}>{slip.labOrderFolio}</span>
            <small style={{ color: '#666' }}>Venta: {slip.saleOrderFolio}</small>
          </div>
        </header>

        <div style={{ marginBottom: '16px' }}>
          <strong style={{ fontSize: '12px', color: '#666', display: 'block' }}>PACIENTE</strong>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{slip.patientName}</span>
          <span style={{ display: 'block', fontSize: '12px', color: '#555' }}>Destino: {slip.destinationText}</span>
        </div>

        {/* Tabla de Graduación para el Técnico */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f0ede4', borderBottom: '1px solid #333' }}>
              <th style={{ padding: '6px', textAlign: 'left' }}>Ojo</th>
              <th style={{ padding: '6px' }}>Esfera</th>
              <th style={{ padding: '6px' }}>Cilindro</th>
              <th style={{ padding: '6px' }}>Eje</th>
              <th style={{ padding: '6px' }}>Adición</th>
              <th style={{ padding: '6px' }}>DP</th>
              <th style={{ padding: '6px' }}>Alt.</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'center' }}>
              <td style={{ padding: '8px 6px', fontWeight: 'bold', textAlign: 'left' }}>OD (Derecho)</td>
              <td>{slip.rightEye.sphere ?? '0.00'}</td>
              <td>{slip.rightEye.cylinder ?? '0.00'}</td>
              <td>{slip.rightEye.axis ? `${slip.rightEye.axis}°` : '—'}</td>
              <td>{slip.rightEye.addition ? `+${slip.rightEye.addition}` : '—'}</td>
              <td>{slip.rightEye.pupillaryDistance ?? '—'}</td>
              <td>{slip.rightEye.opticalCenterHeight ?? '—'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'center' }}>
              <td style={{ padding: '8px 6px', fontWeight: 'bold', textAlign: 'left' }}>OI (Izquierdo)</td>
              <td>{slip.leftEye.sphere ?? '0.00'}</td>
              <td>{slip.leftEye.cylinder ?? '0.00'}</td>
              <td>{slip.leftEye.axis ? `${slip.leftEye.axis}°` : '—'}</td>
              <td>{slip.leftEye.addition ? `+${slip.leftEye.addition}` : '—'}</td>
              <td>{slip.leftEye.pupillaryDistance ?? '—'}</td>
              <td>{slip.leftEye.opticalCenterHeight ?? '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* Especificaciones de Material y Armazón */}
        <div style={{ background: '#fdfcf7', border: '1px solid #ccc', padding: '12px', fontSize: '13px', lineHeight: '1.6' }}>
          <div><strong>Armazón:</strong> <code>{slip.frameCode}</code> ({slip.frameMountingType})</div>
          <div><strong>Material de Mica:</strong> {slip.lensMaterial}</div>
          <div><strong>Tratamientos:</strong> {slip.treatmentsText}</div>
          {slip.observations && (
            <div style={{ marginTop: '8px', color: '#c0392b' }}>
              <strong>Instrucciones:</strong> {slip.observations}
            </div>
          )}
        </div>

        {/* Firmas de Control */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px', textAlign: 'center', fontSize: '11px' }}>
          <div style={{ borderTop: '1px solid #333', width: '40%', paddingTop: '4px' }}>
            Biselado y Montaje
          </div>
          <div style={{ borderTop: '1px solid #333', width: '40%', paddingTop: '4px' }}>
            Frontofocómetro (Visto Bueno)
          </div>
        </div>
      </section>
    </main>
  );
}
