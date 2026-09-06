---
id: PLAN-001
feature: Pacientes y Consultas Optométricas
status: Revisada
version: 1.1.0
fecha: 2026-09-04
---

# PLAN-001 — Plan de implementación de SPEC-001

## 1. Resumen

Este plan describe cómo implementar SPEC-001 (Pacientes y Consultas Optométricas) usando un **monolito modular pragmático** aprobado provisionalmente. No es una decisión arquitectónica definitiva: el stack se declara como propuesta ADR pendiente de ratificación al finalizar la fase 0.

## 2. Stack propuesto (ADR pendiente)

| Capa | Propuesta | Justificación preliminar | Estado |
|---|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack TypeScript, SSR/SSG, API routes, equipo familiarizado | Pendiente ADR-001 |
| Base de datos | PostgreSQL | ACID, JSONB para extensiones, maduro en producción | Pendiente ADR-001 |
| ORM / acceso a datos | Prisma | Tipado fuerte, migraciones, validación de constraints | Pendiente ADR-001 |
| Autenticación | Supabase Auth | Auth lista, gestión de usuarios, JWT, opción self-host | Pendiente ADR-001 |
| Validación | Zod | Esquemas compartidos frontend/backend, mensajes claros | Pendiente ADR-001 |
| Pruebas unitarias / integración | Vitest | Rápido, compatible con Vite/Next.js, mocks simples | Pendiente ADR-001 |
| Pruebas E2E | Playwright | Flujos táctiles, móvil/tablet, screenshots comparativos | Pendiente ADR-001 |
| Estado / autorización | Campos `status` + validación en código; sin XState/Casbin | Se evita asumir dependencias pendientes de spike (D-007, D-008) | Confirmado por constitución |

**Nota ADR:** Antes de comenzar la fase 1 se debe crear `docs/adrs/ADR-001-stack-spec-001.md` y validar que no exista un stack institucional distinto.

## 3. Constitution check

| Principio | Cumplimiento en este plan | Verificación |
|---|---|---|
| P1 — Expediente íntegro y auditable | Todas las escrituras clínicas generan audit log; las correcciones son enmiendas; no hay `DELETE` físico de consultas/prescripciones | Revisión de diff + pruebas de auditoría |
| P2 — Privacidad y minimización | Listas blancas en contratos; resumen seguro para frontdesk; datos sensibles no en logs ni errores | Pruebas de permisos + escaneo de fixtures/logs |
| P3 — Experiencia gabinete/mostrador | UI mobile-first 375/768 px; touch-first; sin hover obligatorio | Playwright en viewports táctiles |
| P4 — Modularidad pragmática | Módulos `patients` y `clinical` separados por contrato; sin acceso cruzado informal | Revisión de imports/arquitectura |
| P5 — Reutilización responsable | No se incorporan dependencias copyleft; XState/Casbin no se asumen | Validación de licencias en ADR |
| P6 — Especificación y pruebas antes de implementación | Fase 0 define contratos, modelo y pruebas antes de código de aplicación | Checklist de salida de fase 0 |
| P7 — Trazabilidad y revisión | Cada tarea referencia RF-XXX; changelog obligatorio | Revisión de diff completo |

## 4. Fases

### Fase 0 — Gobierno, ADR y decisiones

Objetivo: ratificar el stack y validar la matriz de roles antes de cualquier código.

Tareas ordenadas:

1. **ADR-001** — Ratificar o ajustar el stack propuesto (responsable: arquitecto).
2. **Revisión legal** — Documentar pendientes regulatorios (texto de aviso de privacidad, consentimiento, NOM-004/NOM-024, LFPDPPP) como gate antes de producción.
3. **Matriz de roles** — Validar que `frontdesk:receptionist` no lee clínica, `clinical:assistant` no prescribe, `admin` libera consultas bloqueadas.

**Criterios de salida de fase 0:**
- ADR-001 aprobado.
- Pendientes legales marcados en `spec.md`, ADR-001 y checklist.
- Matriz de roles trazable a contratos.

### Fase 1 — Bootstrap mínimo del entorno de pruebas

Objetivo: eliminar circularidad entre tests RED y configuración del proyecto. Crear `package.json`, `tsconfig.json`, `vitest.config.ts` y un runner de smoke tests **sin código de aplicación**.

**Criterios de salida de fase 1:**
- `npm install` funciona.
- `vitest run` ejecuta tests vacíos/pendientes sin errores de configuración.
- No se instalan dependencias de frontend/backend (Next.js, Prisma, etc.).

### Fase 2 — Contratos y modelo

Objetivo: dejar listos los artefactos que las fases siguientes implementarán.

Tareas ordenadas:

1. **Contratos** — Validar `contracts/auth.contract.ts`, `patients.contract.ts`, `clinical.contract.ts` y `README.md` contra la matriz de operaciones. Incluir `Patient.version`, `releaseConsultation` y `PrivacyNotice`.
2. **ActorContext y auditoría** — `ActorContext` en todas las operaciones de lectura/escritura; acciones canónicas `ACCESS_DENIED`, `LOGIN`, `LOGOUT`, `SESSION_INVALIDATED`.
3. **Concurrencia** — `expectedVersion` en mutaciones concurrentes.
4. **Rutas seguras para secretaría** — Resumen seguro y listados por `patientId` o folio en `clinical.contract.ts`.
5. **Modelo de datos** — Schema Prisma inicial con `Patient`, `PrivacyNotice`, `Consent`, `Consultation`, `Refraction`, `Prescription`, `NonClinicalNote`, `AuditLog`, `Branch`.
6. **Folios** — Estrategia determinista con `UNIQUE` en BD.
7. **Estados de consulta** — `in_progress → closed/abandoned`, liberación administrativa.
8. **Enmiendas** — `Refraction`/`Prescription` inmutables con `isAmendment`, `amendedFromId`, `version`; snapshot de refracción en prescripción.

**Criterios de salida de fase 2:**
- Contratos firmados por dos revisores.
- `ActorContext`, `expectedVersion` y `Patient.version` presentes.
- Schema trazable a RF-001..RF-011.
- Ningún secreto o dato clínico real en el repositorio.

### Fase 3 — Tests RED

Objetivo: escribir la suite de pruebas fallidas/pendientes antes de implementar.

Tareas ordenadas:

1. RF-001, RF-002: registro y folio.
2. RF-003: consentimiento inicial, re-consentimiento por cambio de aviso, re-consentimiento al editar clínica.
3. RF-004: búsqueda con lista blanca y **benchmark único** `tests/benchmark/search-100k.benchmark.ts`.
4. RF-005: ciclo de vida, concurrencia, liberación administrativa.
5. RF-006, RF-007: refracción OD/OI, valores neutros explícitos.
6. RF-008, RF-011: prescripción con snapshot de refracción y enmiendas.
7. RF-009: resumen seguro y `setNonClinicalNote`.
8. RF-010: permisos y auditoría.
9. Auth boundary: `LOGIN`, `LOGOUT`, `SESSION_INVALIDATED`.
10. Revisión de privacidad de fixtures y checklist de salida.

**Criterios de salida de fase 3:**
- `vitest run` muestra tests fallidos/pendientes sin errores de configuración.
- Benchmark 100k definido en ruta única.
- Ningún dato sensible en fixtures.

### Fase 4 — Implementación del dominio

Objetivo: implementar la lógica de negocio de `patients` y `clinical` con pruebas pasando.

Tareas ordenadas:

1. **Configurar proyecto base** — Next.js 15, Prisma, Zod, Vitest, Playwright (solo si ADR-001 ratifica el stack).
2. **Schema Prisma + migración inicial + seed**.
3. **Módulo `patients`** — crear, buscar, actualizar, consentimiento (`hasValidConsent` vs `PrivacyNotice` vigente).
4. **Módulo `clinical`** — apertura, estados, liberación administrativa.
5. **Refracción OD/OI** con validaciones.
6. **Prescripción** — folio correlativo, snapshot de refracción.
7. **Enmiendas** sin borrar original.
8. **`setNonClinicalNote`** con catálogo cerrado.
9. **Resumen seguro** por folio y `patientId`.

**Criterios de salida de fase 4:**
- Tests de fase 3 pasan.
- Schema migrado y seed ejecutable localmente.

### Fase 5 — Autorización, privacidad y auditoría

Objetivo: cerrar seguridad y trazabilidad.

Tareas ordenadas:

1. Adaptador stub de `auth`.
2. Propagar `ActorContext` (sin asumir auditoría).
3. Capa de auditoría con `requestId`.
4. `ACCESS_DENIED` en intentos no autorizados.
5. Eventos `LOGIN`/`LOGOUT`/`SESSION_INVALIDATED`.
6. RBAC en dominio.
7. Datos sensibles ausentes de logs/errores.
8. Bloqueo de escritura clínica sin consentimiento vigente.

### Fase 6 — API routes / contratos HTTP

Objetivo: exponer operaciones vía endpoints de Next.js antes de construir la UI.

Tareas ordenadas:

1. Endpoints para pacientes (`create`, `update`, `search`, `consent`).
2. Endpoints para consultas (`open`, `abandon`, `release`, `refraction`, `prescription`, `non-clinical-note`).
3. Endpoint `frontdesk/summary`.
4. Tests de contrato HTTP.

**Boundary opcional:** si la UI progresa antes, declarar y configurar mock boundary (MSW o stub de fetch) que implemente estos contratos.

### Fase 7 — UI

Objetivo: construir la interfaz táctil consumiendo los endpoints de la fase 6 (o su mock boundary declarado).

Tareas ordenadas:

1. Pantallas: registro de paciente, búsqueda, detalle de consulta, emisión de prescripción, resumen seguro.
2. Navegación y flujos de permisos.
3. `requestId` en cada solicitud del cliente.

### Fase 8 — Accesibilidad

Objetivo: verificar WCAG 2.1 AA.

Tareas ordenadas:

1. Navegación completa por teclado.
2. Foco visible y contraste ≥ 4.5:1.
3. Etiquetas/ARIA y mensajes de error asociados.

### Fase 9 — Integración y validación final

Objetivo: cerrar SPEC-001.

Tareas ordenadas:

1. Tests unitarios e integración; cobertura crítica ≥ 90%.
2. E2E con Playwright en 375/768 px.
3. Benchmark 100k.
4. Validación con 5 usuarios: ≤60 s registro, satisfacción ≥4/5, ≤1% errores de captura (o diferido explícito).
5. Revisión de seguridad, privacidad, SBOM y pendientes legales.
6. Revisión del diff, changelog y checklist de salida.

**Criterios de salida de fase 9:**
- Playwright pasa escenarios 5.1..5.12.
- Métricas de SPEC-001 §11 alcanzadas o documentadas con plan de mejora.
- Diff revisado y aprobado.
- SPEC-001 estado `Verificada`.

## 5. Tareas ordenadas resumidas (todo el plan)

1. ADR-001 stack.
2. Revisión legal y matriz de roles.
3. Bootstrap mínimo de pruebas (`package.json`, `vitest.config.ts`).
4. Validar contratos (`Patient.version`, `releaseConsultation`, `PrivacyNotice`).
5. Modelo de datos conceptual → schema Prisma.
6. Escribir pruebas en rojo (benchmark en ruta única).
7. Revisión privacidad de fixtures.
8. Configurar proyecto base según ADR-001.
9. Schema + migración + seed.
10. Módulo `patients`.
11. Módulo `clinical` (estados + liberación administrativa).
12. Refracción OD/OI.
13. Prescripción con snapshot de refracción.
14. Enmiendas sin borrar original.
15. `setNonClinicalNote` y resumen seguro.
16. Adaptador auth stub.
17. Propagar `ActorContext`.
18. Capa de auditoría con `requestId`.
19. `ACCESS_DENIED` y RBAC.
20. Eventos de sesión auditables.
21. Bloqueo sin consentimiento vigente vs `PrivacyNotice`.
22. API routes / contratos HTTP.
23. UI (con mock boundary declarado si aplica).
24. Accesibilidad WCAG/teclado/contraste.
25. Pruebas E2E y benchmark 100k.
26. Validación con usuarios y métricas de calidad.
27. Revisión seguridad/privacidad/SBOM/legal.
28. Diff, changelog y cierre SPEC-001.

## 6. Seguridad, privacidad y auditoría

### Seguridad
- Autenticación vía Supabase Auth (contrato `auth.contract.ts`).
- Autorización basada en roles y listas blancas de recursos.
- Sin `any`; todos los DTOs validados con Zod.
- Endpoints sensibles responden 403/404 genéricos ante acceso no autorizado.
- No se exponen identificadores internos secuenciales en URLs públicas.

### Privacidad
- Datos sensibles mínimos en cada respuesta (P2).
- Resumen seguro para `frontdesk:receptionist` (RF-009).
- Consentimiento vigente bloquea escritura clínica (RF-003).
- Logs de aplicación sin contenido clínico.

### Auditoría
- Tabla `AuditLog` con: actor, acción, entidad, id de registro, timestamp, razón y `requestId` de `ActorContext`.
- Toda lectura y escritura de datos personales o clínicos recibe `ActorContext` y genera traza.
- Enmiendas vinculan al registro original (RF-011).

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Stack provisional no ratificado | ADR-001 obligatorio antes de fase 1 |
| Fuga de datos sensibles al frontdesk | Lista blanca en contrato + pruebas de permisos automatizadas |
| Sobrescritura perdida en consulta | Control de versión + pruebas de concurrencia |
| Dependencia de Supabase Auth | Adaptador de contrato permite cambiar proveedor |
| XState/Casbin no disponibles | Máquina de estados manual; RBAC en código con contrato claro |

## 8. Criterios de salida del plan

SPEC-001 se considera terminada cuando:

1. ADR-001 está aprobado.
2. Los contratos en `contracts/` están aprobados, incluyendo `Patient.version`, `releaseConsultation` y `PrivacyNotice`.
3. Las pruebas críticas (permisos, auditoría con `ActorContext`, enmiendas, snapshot de refracción, validaciones de ambos ojos, concurrencia con `expectedVersion`, liberación administrativa) pasan.
4. Playwright cubre los 12 escenarios de SPEC-001 y la navegación de secretaría por folio/patientId.
5. Benchmark de búsqueda y resumen con 100k registros sintéticos cumple ≤ 500 ms (p95) en la ruta unificada.
6. Validación con usuarios documenta ≤ 60 s de registro, satisfacción ≥ 4/5 y ≤ 1% de errores de captura, o declara explícitamente el diferimiento.
7. Accesibilidad WCAG 2.1 AA (teclado, contraste, etiquetas) revisada.
8. No hay datos sensibles reales en el repositorio.
9. SBOM actualizado si se agregaron dependencias; licencias aprobadas.
10. Pendientes legales marcados con responsable y deadline antes de producción.
11. Changelog de SPEC-001 documenta cada RF satisfecho.
12. Revisión de diff completo aprobada por al menos un revisor.

## 9. Historial de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1.1.0 | 2026-09-04 | Alineación con TASKS-001 v1.1.0: bootstrap de pruebas antes de tests RED; fase de API routes antes de UI; liberación administrativa de consulta; validación con usuarios; accesibilidad; `Patient.version`; snapshot de refracción en prescripción; casing canónico de estados y acciones de auditoría. |
| 1.0.2 | 2026-09-03 | Correcciones pre-tareas: `setNonClinicalNote` en módulo `clinical`; versionado y unicidad parcial de `Prescription`; acciones de auditoría extendidas (`ACCESS_DENIED`, `LOGIN`, `LOGOUT`, `SESSION_INVALIDATED`) y `requestId`. |
| 1.0.1 | 2026-09-03 | Revisión post-NO-GO: `ActorContext` y auditoría en lecturas; `expectedVersion` en mutaciones; resumen/listado por folio/patientId; pruebas RED y benchmark 100k; boundary de auth; ubicación de contratos en `contracts/`. |
| 1.0.0 | 2026-09-03 | Versión inicial. Stack provisional, fases 0/1/2, constitution check. |
