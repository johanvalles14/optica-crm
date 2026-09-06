/**
 * Contrato del módulo de autenticación/identidad para SPEC-001.
 * No contiene secretos ni credenciales.
 */

export type UserId = string;
export type SessionToken = string;
export type RequestId = string;

export type Role =
  | 'clinical:optometrist'
  | 'clinical:assistant'
  | 'frontdesk:receptionist'
  | 'inventory:manager'
  | 'laboratory:technician'
  | 'admin';

export interface UserIdentity {
  id: UserId;
  displayName: string;
  email: string;
  role: Role;
}

export interface Session {
  userId: UserId;
  role: Role;
  expiresAt: Date;
}

/**
 * Contexto de actor que toda operación sobre datos personales o clínicos debe
 * recibir, incluso las lecturas, para permitir auditoría y trazabilidad.
 */
export interface ActorContext {
  actorId: UserId;
  role: Role;
  requestId: RequestId;
  /** Origen seguro de la solicitud (ej. IP o hash de user-agent). Sin secretos. */
  source?: string;
}

export type AuthAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'SESSION_INVALIDATED'
  | 'ACCESS_DENIED';

export interface AuthAuditEntry {
  actorId: UserId;
  action: AuthAction;
  requestId: RequestId;
  occurredAt: Date;
  /** Contexto seguro: no debe incluir tokens, contraseñas ni datos clínicos. */
  metadata: Record<string, unknown>;
}

/**
 * Boundary del módulo `auth` para SPEC-001.
 *
 * El módulo real de autenticación vive fuera de SPEC-001 (ej. Supabase Auth,
 * Keycloak, etc.). Este contrato es la única superficie que `patients` y
 * `clinical` deben consumir.
 *
 * Responsabilidades del implementador:
 * - `verifySession` rechaza tokens expirados o invalidados.
 * - `invalidateSession` marca un token como no usable (logout forzado, revocación).
 * - `LOGIN`, `LOGOUT` y `SESSION_INVALIDATED` se modelan como eventos de
 *   auditoría (`AuthAction`) y se persisten vía `recordAudit`.
 * - `ACCESS_DENIED` se registra cuando una sesión válida intenta un recurso no
 *   autorizado, sin exponer datos sensibles.
 */
export interface IAuthService {
  verifySession(token: SessionToken): Promise<Session>;
  getIdentity(userId: UserId): Promise<UserIdentity>;
  can(session: Session, action: string, resource: string): boolean;
  invalidateSession(token: SessionToken): Promise<void>;
  recordAudit(entry: AuthAuditEntry): Promise<void>;
}
