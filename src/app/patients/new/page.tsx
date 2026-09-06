'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';

export default function NewPatientPage() {
  const [message, setMessage] = useState('');
  const [createdFolio, setCreatedFolio] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setCreatedFolio(null);

    const form = new FormData(event.currentTarget);
    const role = localStorage.getItem('demo-role') || 'clinical:optometrist';

    try {
      // 1. Crear paciente
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({
          branchId: 'branch-001',
          firstName: form.get('firstName'),
          lastName: form.get('lastName'),
          middleName: form.get('middleName') || undefined,
          birthDate: form.get('birthDate'),
          sex: form.get('sex'),
          phone: form.get('phone'),
          email: form.get('email') || undefined,
          address: form.get('address') || undefined,
        }),
      });

      const data = (await response.json()) as { folio?: string; error?: string };
      if (!response.ok || !data.folio) {
        throw new Error(data.error ?? 'No se pudo crear el expediente');
      }

      const folio = data.folio;
      setCreatedFolio(folio);

      // 2. Registrar consentimiento si marcó la casilla
      const consentGiven = form.get('consent') === 'on';
      if (consentGiven) {
        await fetch(`/api/patients/${folio}/consent`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-demo-role': role,
          },
          body: JSON.stringify({ source: 'tablet-alta-mostrador' }),
        });
        setMessage(`Expediente creado con folio ${folio} y consentimiento registrado.`);
      } else {
        setMessage(`Expediente creado con folio ${folio}. Consentimiento clínico pendiente.`);
      }

      event.currentTarget.reset();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell narrow">
      <p className="eyebrow">PACIENTES / ALTA</p>
      <h1>Registrar Paciente</h1>
      <p className="lede">
        Crea el expediente y documenta el consentimiento informado conforme a la normativa de privacidad.
      </p>

      {createdFolio && (
        <div style={{ background: '#eaf5ea', border: '1px solid #c2e2c2', padding: '18px', marginBottom: '20px' }}>
          <strong>✓ Paciente registrado con éxito</strong>
          <p style={{ margin: '8px 0 12px' }}>Folio asignado: <code>{createdFolio}</code></p>
          <div className="actions">
            <Link href="/patients/search" className="button secondary">Buscar Expedientes</Link>
            <Link href="/frontdesk/summary" className="button primary">Ir a Mostrador</Link>
          </div>
        </div>
      )}

      <form className="form-card" onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label>
            Nombre(s) *
            <input name="firstName" required placeholder="Ej. Ana" />
          </label>
          <label>
            Apellido paterno *
            <input name="lastName" required placeholder="Ej. Gómez" />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label>
            Apellido materno (opcional)
            <input name="middleName" placeholder="Ej. Ruiz" />
          </label>
          <label>
            Fecha de nacimiento *
            <input type="date" name="birthDate" required />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label>
            Sexo *
            <select name="sex" defaultValue="not_specified">
              <option value="not_specified">No especificado</option>
              <option value="female">Femenino</option>
              <option value="male">Masculino</option>
              <option value="other">Otro</option>
            </select>
          </label>
          <label>
            Teléfono principal *
            <input name="phone" inputMode="tel" required placeholder="10 dígitos" />
          </label>
        </div>

        <label>
          Correo electrónico (opcional)
          <input type="email" name="email" placeholder="paciente@correo.com" />
        </label>

        <label>
          Dirección (opcional)
          <input name="address" placeholder="Calle, número, colonia..." />
        </label>

        <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '12px 0' }} />

        <div style={{ background: '#faf8f2', padding: '16px', border: '1px solid var(--line)' }}>
          <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" name="consent" defaultChecked style={{ width: '20px', height: '20px', marginTop: '2px' }} />
            <span style={{ fontSize: '13px', lineHeight: '1.5', fontWeight: 'normal' }}>
              <strong>Acepta aviso de privacidad y consentimiento informado (RF-003):</strong> El paciente autoriza el tratamiento de sus datos personales y clínicos exclusivamente para su atención optométrica conforme a la LFPDPPP vigente.
            </span>
          </label>
        </div>

        <button className="button primary" type="submit" disabled={loading} style={{ marginTop: '12px' }}>
          {loading ? 'Creando expediente...' : 'Crear expediente'}
        </button>

        {message && <p className="form-message" role="status">{message}</p>}
      </form>
    </main>
  );
}
