'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewPatientPage() {
  const router = useRouter();
  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdFolio, setCreatedFolio] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setCreatedFolio(null);

    const form = new FormData(event.currentTarget);
    const role = localStorage.getItem('demo-role') || 'clinical:optometrist';

    try {
      // 1. Crear paciente con todos los campos
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
          allergies: form.get('allergies') || undefined,
          conditions: form.get('conditions') || undefined,
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
      }

      // Redirección inmediata a la Ficha Central
      router.push(`/patients/${folio}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar paciente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell narrow">
      <header className="topbar">
        <div>
          <p className="eyebrow">PACIENTES / REGISTRO</p>
          <h1>Nuevo Paciente</h1>
          <p className="lede">
            Ingresa los datos esenciales para abrir el expediente clínico y comenzar la atención.
          </p>
        </div>
        <div className="actions">
          <Link href="/patients/search" className="button secondary">
            ← Volver a Búsqueda
          </Link>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      {createdFolio ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px' }}>
          <span style={{ fontSize: '36px' }}>✅</span>
          <h2>¡Paciente Registrado!</h2>
          <p className="lede">Folio asignado: <strong>{createdFolio}</strong></p>
          <p>Redirigiendo a la ficha central del paciente...</p>
          <div className="actions" style={{ justifyContent: 'center', marginTop: '16px' }}>
            <Link href={`/patients/${createdFolio}`} className="button primary">
              Abrir Ficha Ahora →
            </Link>
          </div>
        </div>
      ) : (
        <form className="card form-grid" onSubmit={submit}>
          {/* Bloque de Datos Esenciales */}
          <div>
            <h3>1. Datos Personales Esenciales</h3>
            <p className="lede" style={{ fontSize: '13px', marginBottom: '14px' }}>
              Los campos con asterisco (*) son obligatorios para el expediente y la receta óptica.
            </p>

            <div className="form-grid two-cols">
              <label>
                Nombre(s) *
                <input name="firstName" required placeholder="Ej. Ana María" autoFocus />
              </label>

              <label>
                Apellido Paterno *
                <input name="lastName" required placeholder="Ej. Gómez" />
              </label>
            </div>

            <div className="form-grid two-cols" style={{ marginTop: '14px' }}>
              <label>
                Fecha de Nacimiento *
                <input type="date" name="birthDate" required />
              </label>

              <label>
                Sexo *
                <select name="sex" defaultValue="not_specified">
                  <option value="not_specified">No especificado</option>
                  <option value="female">Femenino</option>
                  <option value="male">Masculino</option>
                  <option value="other">Otro</option>
                </select>
              </label>
            </div>

            <div style={{ marginTop: '14px' }}>
              <label>
                Teléfono Celular / WhatsApp *
                <input name="phone" inputMode="tel" required placeholder="10 dígitos (ej. 8711234567)" />
              </label>
            </div>
          </div>

          {/* Bloque Opcional Plegable */}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
            <button
              type="button"
              className="button subtle"
              onClick={() => setShowOptional(!showOptional)}
              style={{ width: '100%', justifyContent: 'space-between', padding: '10px 14px' }}
            >
              <span style={{ fontWeight: 600 }}>
                {showOptional ? '▾ Ocultar datos de contacto adicionales' : '▸ + Agregar datos de contacto adicionales (opcionales)'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {showOptional ? 'Plegar' : 'Correo, domicilio, notas'}
              </span>
            </button>

            {showOptional && (
              <div className="form-grid" style={{ marginTop: '16px', background: 'var(--card-subtle)', padding: '18px', borderRadius: 'var(--radius-md)' }}>
                <div className="form-grid two-cols">
                  <label>
                    Apellido Materno
                    <input name="middleName" placeholder="Ej. Ruiz" />
                  </label>

                  <label>
                    Correo Electrónico
                    <input type="email" name="email" placeholder="paciente@correo.com" />
                  </label>
                </div>

                <label>
                  Dirección o Domicilio
                  <input name="address" placeholder="Calle, número, colonia, ciudad..." />
                </label>

                <div className="form-grid two-cols">
                  <label>
                    Alergias o Advertencias
                    <input name="allergies" placeholder="Ej. Ninguna / Hipersensibilidad al sol" />
                  </label>

                  <label>
                    Condiciones Médicas
                    <input name="conditions" placeholder="Ej. Diabetes, Hipertensión..." />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Consentimiento y Aviso de Privacidad */}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
            <div
              style={{
                background: 'var(--card-subtle)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)',
              }}
            >
              <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  name="consent"
                  defaultChecked
                  style={{ width: '20px', height: '20px', minHeight: 'unset', marginTop: '2px' }}
                />
                <span style={{ fontSize: '13px', lineHeight: '1.45', fontWeight: 'normal', color: 'var(--ink-secondary)' }}>
                  <strong>Consentimiento y Aviso de Privacidad (RF-003):</strong> El paciente autoriza el tratamiento
                  de sus datos personales y clínicos exclusivamente para atención optométrica y seguimiento de pedidos.
                </span>
              </label>
            </div>
          </div>

          <div className="actions" style={{ marginTop: '10px' }}>
            <button className="button primary" type="submit" disabled={loading} style={{ flex: 1, minHeight: '46px' }}>
              {loading ? 'Guardando paciente...' : 'Guardar y Abrir Ficha del Paciente'}
            </button>
            <Link href="/patients/search" className="button secondary">
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}
