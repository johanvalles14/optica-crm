import { afterEach, describe, expect, it } from 'vitest';
import { actorFromRequest } from '../../../src/lib/request-context';

const originalAuthMode = process.env.AUTH_MODE;

afterEach(() => {
  if (originalAuthMode === undefined) delete process.env.AUTH_MODE;
  else process.env.AUTH_MODE = originalAuthMode;
});

describe('request context authentication boundary', () => {
  it('uses the demo role only when demo mode is explicit', () => {
    process.env.AUTH_MODE = 'demo';
    const actor = actorFromRequest(new Request('http://localhost', {
      headers: { 'x-demo-role': 'frontdesk:receptionist' },
    }));
    expect(actor.role).toBe('frontdesk:receptionist');
    expect(actor.source).toBe('web');
  });

  it('rejects requests without trusted proxy identity', () => {
    process.env.AUTH_MODE = 'proxy';
    expect(() => actorFromRequest(new Request('http://localhost'))).toThrow('Authentication required');
  });

  it('uses the identity and role supplied by the trusted proxy', () => {
    process.env.AUTH_MODE = 'proxy';
    const actor = actorFromRequest(new Request('http://localhost', {
      headers: {
        'x-auth-user-id': '00000000-0000-4000-8000-000000000001',
        'x-auth-role': 'admin',
      },
    }));
    expect(actor.actorId).toBe('00000000-0000-4000-8000-000000000001');
    expect(actor.role).toBe('admin');
    expect(actor.source).toBe('trusted-auth-proxy');
  });
});
