import type { ActorContext } from '../../contracts/auth.contract';

function extractUserSuffix(requestId: string, prefix: string): string {
  const match = requestId.match(new RegExp(`${prefix}-(\\d+)`));
  return match ? match[1].padStart(3, '0') : '001';
}

export const optometrist = (requestId = 'req-opt-001'): ActorContext => ({
  actorId: `user-opt-${extractUserSuffix(requestId, 'opt')}`,
  role: 'clinical:optometrist',
  requestId,
  source: '127.0.0.1',
});

export const assistant = (requestId = 'req-ast-001'): ActorContext => ({
  actorId: 'user-ast-001',
  role: 'clinical:assistant',
  requestId,
  source: '127.0.0.1',
});

export const receptionist = (requestId = 'req-rec-001'): ActorContext => ({
  actorId: 'user-rec-001',
  role: 'frontdesk:receptionist',
  requestId,
  source: '127.0.0.1',
});

export const admin = (requestId = 'req-adm-001'): ActorContext => ({
  actorId: 'user-adm-001',
  role: 'admin',
  requestId,
  source: '127.0.0.1',
});

export const inventoryManager = (requestId = 'req-inv-001'): ActorContext => ({
  actorId: 'user-inv-001',
  role: 'inventory:manager',
  requestId,
  source: '127.0.0.1',
});
