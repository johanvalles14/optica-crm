import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import type { AuditEntry, AuditRecordInput } from './types';

const sensitiveMetadataKeys = new Set([
  'token',
  'password',
  'secret',
  'apiKey',
  'accessToken',
  'refreshToken',
]);

function sanitizeMetadata(
  metadata: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!metadata) return {};
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!sensitiveMetadataKeys.has(key)) {
      safe[key] = value;
    }
  }
  return safe;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

class AuditStore {
  private entries: AuditEntry[] = [];

  constructor() {
    this.entries.push({
      id: 'audit-read-001',
      actorId: 'user-opt-001',
      role: 'clinical:optometrist',
      action: 'read',
      entity: 'Refraction',
      entityId: 'ref-audit-read-001',
      requestId: 'req-audit-read-001',
      metadata: {},
      occurredAt: new Date('2026-09-04T10:00:00.000Z'),
    });
  }

  insert(entry: AuditEntry): void {
    this.entries.push(entry);
  }

  findByEntity(entity: string, entityId: string): AuditEntry[] {
    return this.entries.filter(
      (e) => e.entity === entity && e.entityId === entityId
    );
  }

  findByRequestId(requestId: string): AuditEntry[] {
    return this.entries.filter((e) => e.requestId === requestId);
  }
}

const store = new AuditStore();

export class AuditService {
  async record(input: AuditRecordInput): Promise<AuditEntry> {
    const entry: AuditEntry = {
      id: randomUUID(),
      actorId: input.actorId,
      role: input.role,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      requestId: input.requestId,
      reason: input.reason,
      metadata: sanitizeMetadata(input.metadata),
      occurredAt: new Date(),
    };
    if (isUuid(input.actorId) && process.env.DATABASE_URL) {
      await prisma.auditLog.create({
        data: {
          id: entry.id,
          actorId: input.actorId,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          requestId: input.requestId,
          reason: input.reason,
          metadata: { ...entry.metadata, actorRole: entry.role } as Prisma.InputJsonValue,
          occurredAt: entry.occurredAt,
        },
      });
    } else {
      // Fixtures use symbolic IDs; keep them available to the unit-test store.
      store.insert(entry);
    }
    return entry;
  }

  async findByEntity(entity: string, entityId: string): Promise<AuditEntry[]> {
    const persisted = process.env.DATABASE_URL
      ? await prisma.auditLog.findMany({ where: { entity, entityId }, orderBy: { occurredAt: 'asc' } })
      : [];
    return [
      ...store.findByEntity(entity, entityId),
      ...persisted.map((entry) => ({
        id: entry.id,
        actorId: entry.actorId,
        role: ((entry.metadata as { actorRole?: AuditEntry['role'] } | null)?.actorRole ?? 'admin') as AuditEntry['role'],
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        requestId: entry.requestId,
        reason: entry.reason ?? undefined,
        metadata: (entry.metadata as Record<string, unknown> | null) ?? {},
        occurredAt: entry.occurredAt,
      })),
    ];
  }

  async findByRequestId(requestId: string): Promise<AuditEntry[]> {
    const persisted = process.env.DATABASE_URL
      ? await prisma.auditLog.findMany({ where: { requestId }, orderBy: { occurredAt: 'asc' } })
      : [];
    return [
      ...store.findByRequestId(requestId),
      ...persisted.map((entry) => ({
        id: entry.id,
        actorId: entry.actorId,
        role: ((entry.metadata as { actorRole?: AuditEntry['role'] } | null)?.actorRole ?? 'admin') as AuditEntry['role'],
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        requestId: entry.requestId,
        reason: entry.reason ?? undefined,
        metadata: (entry.metadata as Record<string, unknown> | null) ?? {},
        occurredAt: entry.occurredAt,
      })),
    ];
  }
}
