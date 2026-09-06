'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

type Result = { folio: string; fullName: string; birthDate: string; maskedPhone: string; lastConsultationStatus: string };

export default function SearchPatientsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState('');

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('query')?.toString() ?? '';
    const parameter = /^\d{4,}$/.test(value) ? `phone=${encodeURIComponent(value)}` : `name=${encodeURIComponent(value)}`;
    const response = await fetch(`/api/patients/search?${parameter}`);
    const data = await response.json() as { results?: Result[]; error?: string };
    setResults(data.results ?? []);
    setError(response.ok ? '' : (data.error ?? 'No se pudo buscar'));
  }

  return (
    <main className="shell narrow">
      <p className="eyebrow">PACIENTES / BÚSQUEDA</p>
      <h1>Localizar expediente</h1>
      <form className="search-row" onSubmit={search}>
        <input name="query" aria-label="Nombre, teléfono o folio" placeholder="Nombre, teléfono o folio" required />
        <button className="button primary" type="submit">Buscar</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="results" aria-live="polite">
        {results.map((result) => <article className="result" key={result.folio}><strong>{result.fullName}</strong><span>{result.folio} · {result.maskedPhone}</span><small>Última consulta: {result.lastConsultationStatus}</small></article>)}
        {!error && results.length === 0 && <p className="empty">Escribe un nombre o al menos cuatro dígitos del teléfono.</p>}
      </div>
    </main>
  );
}
