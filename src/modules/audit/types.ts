import type { Role, UserId, RequestId } from '../../../contracts/auth.contract';

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'amend'
  | 'delete_attempt'
  | 'ACCESS_DENIED'
  | 'LOGIN'
  | 'LOGOUT'
  | 'SESSION_INVALIDATED';

export interface AuditEntry {
  id: string;
  actorId: UserId;
  role: Role;
  action: AuditAction;
  entity: string;
  entityId: string;
  requestId: RequestId;
  reason?: string;
  metadata: Record<string, unknown>;
  occurredAt: Date;
}

export interface AuditRecordInput {
  actorId: UserId;
  role: Role;
  action: AuditAction;
  entity: string;
  entityId: string;
  requestId: RequestId;
  reason?: string;
  metadata?: Record<string, unknown>;
}
