import { randomUUID } from 'node:crypto';
import type { ActorContext, Role } from '../../contracts/auth.contract';

const defaultRole: Role = 'clinical:optometrist';
const validRoles: Role[] = [
    'clinical:optometrist',
    'clinical:assistant',
    'frontdesk:receptionist',
    'inventory:manager',
    'laboratory:technician',
    'admin',
  ];

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function actorFromRequest(request: Request): ActorContext {
  const authMode = process.env.AUTH_MODE ?? (process.env.NODE_ENV === 'production' ? 'proxy' : 'demo');
  if (authMode !== 'demo') {
    const actorId = request.headers.get('x-auth-user-id');
    const role = request.headers.get('x-auth-role');
    if (!actorId || !isUuid(actorId) || !role || !validRoles.includes(role as Role)) {
      throw new Error('Authentication required');
    }
    return {
      actorId,
      role: role as Role,
      requestId: request.headers.get('x-request-id') ?? randomUUID(),
      source: 'trusted-auth-proxy',
    };
  }

  const role = request.headers.get('x-demo-role');

  return {
    actorId: request.headers.get('x-actor-id') ?? '00000000-0000-4000-8000-000000000001',
    role: role && validRoles.includes(role as Role) ? (role as Role) : defaultRole,
    requestId: request.headers.get('x-request-id') ?? randomUUID(),
    source: 'web',
  };
}
