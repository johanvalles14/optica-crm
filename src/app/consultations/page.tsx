'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';

type PatientResult = {
  folio: string;
  fullName: string;
  birthDate: string;
  maskedPhone: string;
  lastConsultationStatus: string;
};

export default function ConsultationsPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [openingFolio, setOpeningFolio] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  async function searchPatients(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const parameter = /^[A-Z]{2}\d{6}$/i.test(value)
        ? `folio=${encodeURIComponent(value.toUpperCase())}`
        : /^\d{4,}$/.test(value)
          ? `phone=${encodeURIComponent(value)}`
          : `name=${encodeURIComponent(value)}`;
      const role = localStorage.getItem('demo-role') || 'clinical:optometrist';
      const response = await fetch(`/api/patients/search?${parameter}`, {
        headers: { 'x-demo-role': role },
      });
      const data = await response.json() as { results?: PatientResult[]; error?: string };
      if (!response.ok) throw new Error(data.error || 'No se pudo buscar el expediente');
      setResults(data.results ?? []);
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : 'No se pudo buscar el expediente');
    } finally {
      setLoading(false);
    }
  }

  async function openConsultation(folio: string) {
    setOpeningFolio(folio);
    setError('');
    try {
      const role = localStorage.getItem('demo-role') || 'clinical:optometrist';
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
          'x-actor-id': 'user-opt-001',
        },
        body: JSON.stringify({ folio, branchId: 'branch-001' }),
      });
      const data = await response.json() as { id?: string; error?: string };
      if (!response.ok || !data.id) throw new Error(data.error || 'No se pudo abrir la consulta');
      router.push(`/consultations/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la consulta');
    } finally {
      setOpeningFolio(null);
    }
  }

  return (
    <main className="shell tablet-shell">
      <header className="topbar tablet-topbar">
        <div>
          <p className="eyebrow">GABINETE / TABLET CLÍNICA</p>
          <h1>Iniciar consulta</h1>
          <p className="lede">
            Localiza al paciente, abre su expediente clínico y envía la receta terminada a recepción para cotizar.
          </p>
        </div>
        <Link className="button secondary" href="/patients/new">
          Registrar paciente
        </Link>
      </header>

      <section className="workspace-panel" aria-labelledby="patient-search-title">
        <div className="workspace-heading">
          <div>
            <h2 id="patient-search-title">Paciente en gabinete</h2>
            <p>Busca por nombre, folio o al menos cuatro dígitos del teléfono.</p>
          </div>
          <span className="status-pill">Flujo conectado a recepción</span>
        </div>

        <form className="search-row tablet-search" onSubmit={searchPatients}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Nombre, folio o teléfono del paciente"
            placeholder="Ej. Carmen Ortiz, PT000002 o 8711234567"
            required
          />
          <button className="button primary" type="submit" disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar expediente'}
          </button>
        </form>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="handoff-list" aria-live="polite" aria-label="Resultados de pacientes">
        {results.map((patient) => (
          <article className="handoff-row" key={patient.folio}>
            <div>
              <span className="status-pill">{patient.folio}</span>
              <h2>{patient.fullName}</h2>
              <p>{patient.maskedPhone} · Última consulta: {patient.lastConsultationStatus.replace(/_/g, ' ')}</p>
            </div>
            <button
              className="button primary"
              type="button"
              onClick={() => openConsultation(patient.folio)}
              disabled={openingFolio !== null}
            >
              {openingFolio === patient.folio ? 'Abriendo...' : 'Abrir consulta'}
            </button>
          </article>
        ))}
        {searched && !loading && results.length === 0 && !error && (
          <p className="empty">No se encontró un expediente. Puedes registrar un paciente nuevo desde esta misma pantalla.</p>
        )}
      </section>
    </main>
  );
}
