import { describe, it, expect } from 'vitest';
import { AuthAdapterStub } from '../../../src/modules/auth/adapter.stub';
import { admin } from '../../fixtures/actors';

describe('RF-010 — Eventos de sesión auditables', () => {
  const auth = new AuthAdapterStub();

  it('registra LOGIN con requestId', async () => {
    const actor = admin('req-session-login-001');
    const entry = await auth.recordSessionEvent(actor, 'LOGIN', { source: '127.0.0.1' });
    expect(entry.action).toBe('LOGIN');
    expect(entry.requestId).toBe('req-session-login-001');
    expect(entry.actorId).toBe('user-adm-001');
  });

  it('registra LOGOUT con requestId', async () => {
    const actor = admin('req-session-logout-001');
    const entry = await auth.recordSessionEvent(actor, 'LOGOUT', { source: '127.0.0.1' });
    expect(entry.action).toBe('LOGOUT');
    expect(entry.requestId).toBe('req-session-logout-001');
  });

  it('registra SESSION_INVALIDATED con requestId', async () => {
    const actor = admin('req-session-invalidate-001');
    const entry = await auth.recordSessionEvent(actor, 'SESSION_INVALIDATED', {
      source: '127.0.0.1',
      reason: 'logout forzado',
    });
    expect(entry.action).toBe('SESSION_INVALIDATED');
    expect(entry.requestId).toBe('req-session-invalidate-001');
  });

  it('la metadata de sesión nunca incluye tokens ni contraseñas', async () => {
    const actor = admin('req-session-secret-001');
    const entry = await auth.recordSessionEvent(actor, 'LOGIN', {
      source: '127.0.0.1',
      token: 'super-secret-jwt',
      password: 'super-secret-password',
    });
    expect(entry.metadata).not.toHaveProperty('token');
    expect(entry.metadata).not.toHaveProperty('password');
  });
});
