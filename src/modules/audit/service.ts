import { randomUUID } from 'node:crypto';
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
    store.insert(entry);
    return entry;
  }

  async findByEntity(entity: string, entityId: string): Promise<AuditEntry[]> {
    return store.findByEntity(entity, entityId);
  }

  async findByRequestId(requestId: string): Promise<AuditEntry[]> {
    return store.findByRequestId(requestId);
  }
}
