'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.replace(params.get('next') || '/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <label>Correo electrónico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" /></label>
      <label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
      <button className="button primary" disabled={loading}>{loading ? 'Validando...' : 'Entrar'}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="shell narrow">
      <p className="eyebrow">ÓPTICA CRM / ACCESO</p>
      <h1>Iniciar sesión</h1>
      <p className="lede">Usa la cuenta de trabajo asignada por el administrador.</p>
      <Suspense fallback={<p>Cargando formulario...</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
