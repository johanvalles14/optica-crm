import { randomUUID } from 'node:crypto';
import type { ActorContext, Role } from '../../contracts/auth.contract';

const defaultRole: Role = 'clinical:optometrist';

export function actorFromRequest(request: Request): ActorContext {
  const role = request.headers.get('x-demo-role');
  const validRoles: Role[] = [
    'clinical:optometrist',
    'clinical:assistant',
    'frontdesk:receptionist',
    'inventory:manager',
    'admin',
  ];

  return {
    actorId: request.headers.get('x-actor-id') ?? '00000000-0000-4000-8000-000000000001',
    role: role && validRoles.includes(role as Role) ? (role as Role) : defaultRole,
    requestId: request.headers.get('x-request-id') ?? randomUUID(),
    source: 'web',
  };
}
