import { randomUUID } from 'node:crypto';
import type {
  ActorContext,
  AuthAction,
  AuthAuditEntry,
  IAuthService,
  Role,
  Session,
  SessionToken,
  UserId,
  UserIdentity,
} from '../../../contracts/auth.contract';
import { authorize } from './rbac';
import { AuditService } from '../audit/service';
import type { AuditEntry } from '../audit/types';

export class AuthAdapterStub implements IAuthService {
  private audit = new AuditService();

  async verifySession(token: SessionToken): Promise<Session> {
    return {
      userId: token.startsWith('session-') ? token.slice('session-'.length) : 'user-stub-001',
      role: 'clinical:optometrist',
      expiresAt: new Date(Date.now() + 3600_000),
    };
  }

  async getIdentity(userId: UserId): Promise<UserIdentity> {
    const role: Role = 'clinical:optometrist';
    return {
      id: userId,
      displayName: 'Stub User',
      email: 'stub@example.test',
      role,
    };
  }

  can(session: Session, action: string, resource: string): boolean {
    return authorize(session.role, action, resource);
  }

  async invalidateSession(_token: SessionToken): Promise<void> {
    // Stub: no-op.
  }

  async recordAudit(entry: AuthAuditEntry): Promise<void> {
    await this.audit.record({
      actorId: entry.actorId,
      role: 'admin',
      action: entry.action,
      entity: 'AuthSession',
      entityId: entry.actorId,
      requestId: entry.requestId,
      metadata: entry.metadata,
    });
  }

  async recordSessionEvent(
    actor: ActorContext,
    action: AuthAction,
    metadata: Record<string, unknown>
  ): Promise<AuditEntry> {
    return this.audit.record({
      actorId: actor.actorId,
      role: actor.role,
      action,
      entity: 'AuthSession',
      entityId: actor.actorId,
      requestId: actor.requestId,
      metadata,
    });
  }
}

export function createSessionToken(userId: UserId): SessionToken {
  return `session-${userId}-${randomUUID()}`;
}
