'use client';

import { useState, useEffect, Suspense } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Result = {
  folio: string;
  fullName: string;
  birthDate: string;
  maskedPhone: string;
  lastConsultationStatus: string;
};

function statusBadge(status: string) {
  switch (status) {
    case 'in_progress':
      return <span className="status-pill process">En consulta</span>;
    case 'closed':
      return <span className="status-pill success">Atendido</span>;
    case 'abandoned':
      return <span className="status-pill danger">Abandonada</span>;
    default:
      return <span className="status-pill">Sin consulta</span>;
  }
}

function calculateAge(birthDateStr: string): string {
  try {
    const birth = new Date(birthDateStr);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age} años` : 'Menor de 1 año';
  } catch {
    return '';
  }
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  async function executeSearch(searchTerm: string) {
    const val = searchTerm.trim();
    if (!val) return;

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const isFolio = /^[a-z]{2}-?\d{4,}$/i.test(val);
      const isPhone = /^\d{4,}$/.test(val);
      let parameter = '';

      if (isFolio) {
        parameter = `folio=${encodeURIComponent(val.toUpperCase().replace('-', ''))}`;
      } else if (isPhone) {
        parameter = `phone=${encodeURIComponent(val)}`;
      } else {
        parameter = `name=${encodeURIComponent(val)}`;
      }

      const role = localStorage.getItem('demo-role') || 'frontdesk:receptionist';
      const response = await fetch(`/api/patients/search?${parameter}`, {
        headers: { 'x-demo-role': role },
      });
      const data = (await response.json()) as { results?: Result[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? 'No se pudo completar la búsqueda');
      }

      setResults(data.results ?? []);
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : 'Error al buscar expedientes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery) {
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    executeSearch(query);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">PACIENTES / EXPEDIENTES</p>
          <h1>Directorio de Pacientes</h1>
          <p className="lede">
            Localiza el historial de atención, prescripciones ópticas o inicia un nuevo servicio en mostrador.
          </p>
        </div>
        <div className="actions">
          <Link href="/patients/new" className="button primary">
            + Nuevo Paciente
          </Link>
        </div>
      </header>

      {/* Buscador Cómodo */}
      <section className="card" style={{ marginBottom: '24px' }}>
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              name="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, apellido, teléfono (mínimo 4 dígitos) o folio (ej. PT000001)..."
              style={{ paddingLeft: '38px' }}
              aria-label="Criterio de búsqueda"
              autoFocus
            />
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--subtle)',
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
          </div>

          <button className="button primary" type="submit" disabled={loading} style={{ minWidth: '110px' }}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '10px 0 0' }}>
          💡 Tip: Si buscas por teléfono introduce al menos 4 números. Para buscar por folio escribe el código completo.
        </p>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      {/* Tabla de Resultados Cómoda */}
      {hasSearched && results.length > 0 && (
        <div className="table-wrap">
          <table className="data-table" aria-label="Resultados de pacientes">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Folio</th>
                <th>Paciente</th>
                <th>Contacto</th>
                <th>Estado Última Atención</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.folio}>
                  <td>
                    <span className="status-pill" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {r.folio}
                    </span>
                  </td>
                  <td>
                    <span className="cell-primary">{r.fullName}</span>
                    <span className="cell-secondary">
                      {calculateAge(r.birthDate)} · Nac: {new Date(r.birthDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <span className="cell-primary" style={{ fontFamily: 'monospace' }}>
                      {r.maskedPhone}
                    </span>
                  </td>
                  <td>{statusBadge(r.lastConsultationStatus)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      href={`/patients/${r.folio}`}
                      className="button secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', minHeight: '32px' }}
                    >
                      Abrir Ficha →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasSearched && results.length === 0 && !loading && (
        <div className="empty">
          <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px' }}>
            No se encontraron pacientes con &quot;{query}&quot;
          </p>
          <p style={{ margin: '0 0 16px' }}>
            Verifica la ortografía o registra el expediente si es un paciente nuevo.
          </p>
          <Link href="/patients/new" className="button primary">
            + Registrar Paciente Nuevo
          </Link>
        </div>
      )}

      {!hasSearched && (
        <div className="empty">
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🗂️</span>
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px' }}>
            Búsqueda Rápida de Expedientes
          </p>
          <p style={{ margin: 0 }}>
            Escribe el nombre o teléfono del paciente arriba para acceder a su ficha clínica y pedidos.
          </p>
        </div>
      )}
    </main>
  );
}

export default function SearchPatientsPage() {
  return (
    <Suspense fallback={<div className="shell"><p className="empty">Cargando buscador...</p></div>}>
      <SearchContent />
    </Suspense>
  );
}
