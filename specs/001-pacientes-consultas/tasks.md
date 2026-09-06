---
id: TASKS-001
feature: Pacientes y Consultas Optométricas
status: Revisada
version: 1.1.0
fecha: 2026-09-04
---

# TASKS-001 — Tareas de implementación de SPEC-001

> Plan de trabajo dependency-ordered, granular y accionable para SPEC-001.
> Cada tarea indica archivos/rutas objetivo, requisitos RF y escenarios cubiertos, dependencias y criterio de aceptación.
> ADR-001 es gate obligatorio antes de cualquier implementación de código de aplicación.

## Convenciones

- IDs de tarea: `T001`, `T002`, ...
- Estados sugeridos: `Pendiente`, `En progreso`, `Bloqueada`, `Lista`, `Hecha`.
- Las dependencias se expresan como lista de IDs de tarea que deben estar `Hechas` antes de iniciar.
- Los RF/escenarios se toman de `spec.md`; la trazabilidad es exhaustiva.
- Los nombres de estado canónicos son `in_progress`, `closed`, `abandoned`.
- Las acciones de auditoría canónicas son `create`, `read`, `update`, `amend`, `delete_attempt`, `ACCESS_DENIED`, `LOGIN`, `LOGOUT`, `SESSION_INVALIDATED`.

---

## Fase 0 — Gobierno, ADR y decisiones

### T001 — Redactar y aprobar ADR-001 (stack de SPEC-001)

- **Descripción:** Crear `docs/adrs/ADR-001-stack-spec-001.md` ratificando o ajustando el stack propuesto en `plan.md` §2. Documentar por qué Next.js 15, PostgreSQL, Prisma, Supabase Auth, Zod, Vitest y Playwright satisfacen P1-P7. Si se cambia el stack, actualizar `plan.md` y `quickstart.md`.
- **Archivos/rutas objetivo:**
  - `docs/adrs/ADR-001-stack-spec-001.md` (nuevo)
  - `specs/001-pacientes-consultas/plan.md`
  - `quickstart.md`
- **RF/escenarios cubiertos:** Fundamento técnico de todo SPEC-001; gate antes de fase 1.
- **Dependencias:** Ninguna.
- **Criterio de aceptación:**
  - ADR-001 existe, tiene estado `Aprobado` y está firmado por al menos dos revisores.
  - Incluye matriz de decisiones vs. alternativas (OpenEMR, ERPNext, Medusa, Medplum, XState, Casbin) y referencia a D-001..D-009 de `research.md`.
  - No se asumen dependencias copyleft ni sin licencia.
  - `plan.md` y `quickstart.md` están sincronizados con el stack aprobado.

### T002 — Documentar revisión legal pendiente y riesgos regulatorios

- **Descripción:** Registrar explícitamente en `spec.md` y en `docs/adrs/ADR-001-stack-spec-001.md` los puntos que requieren asesoría legal/clínica mexicana antes de producción: texto del aviso de privacidad, formato de consentimiento, periodicidad de re-consentimiento, derechos ARCO, NOM-004-SSA3-2012, NOM-024-SSA3-2012 y la LFPDPPP vigente (DOF 20-03-2025, reforma DOF 14-11-2025). No bloquea la implementación técnica, pero debe ser visible como gate de lanzamiento.
- **Archivos/rutas objetivo:**
  - `specs/001-pacientes-consultas/spec.md` (sección 12 y RF-003)
  - `docs/adrs/ADR-001-stack-spec-001.md`
  - `specs/001-pacientes-consultas/checklists/requirements.md`
- **RF/escenarios cubiertos:** RF-003 (pendiente legal); Sección 8 ARCO; Escenario 5.12.
- **Dependencias:** T001.
- **Criterio de aceptación:**
  - Existe una sección o nota claramente marcada como `PENDIENTE LEGAL` en cada documento.
  - Se lista quién debe validar (asesoría legal/clínica), qué debe validar y el deadline sugerido (antes de producción).
  - El mecanismo técnico de registro de consentimiento puede implementarse sin esperar el texto legal.

### T003 — Validar matriz de roles y permisos contra la Constitución

- **Descripción:** Revisar que la matriz de operaciones de `spec.md` §4 cumple P2 (minimización) y P1 (auditoría). Confirmar que `frontdesk:receptionist` no lee datos clínicos, que `clinical:assistant` no captura refracción/prescripción, que `admin` gestiona usuarios/auditoría y que solo `admin` libera una consulta `in_progress` bloqueada. Documentar discrepancias si las hay.
- **Archivos/rutas objetivo:**
  - `specs/001-pacientes-consultas/spec.md` §4
  - `constitution.md` §2 (P1, P2, P7)
  - `contracts/auth.contract.ts`
- **RF/escenarios cubiertos:** Matriz de roles; Escenario 5.11; RF-010.
- **Dependencias:** T001.
- **Criterio de aceptación:**
  - La matriz de roles no permite lectura/escritura clínica a roles no autorizados.
  - Existe trazabilidad entre cada operación permitida y el rol que la ejecuta.
  - Se registra cualquier excepción como nota en `spec.md`.

---

## Fase 1 — Bootstrap mínimo del entorno de pruebas

> **Objetivo:** permitir correr los tests RED de la fase 3 sin depender de código de aplicación y sin circularidad con la fase de implementación.

### T004 — Crear bootstrap mínimo de `package.json`, `tsconfig.json` y `vitest.config.ts`

- **Descripción:** Crear un `package.json` mínimo con scripts `test`, `test:unit`, `test:integration`, `test:e2e` y devDependencies: `typescript`, `vitest`, `@vitest/coverage-v8`, `tsx` (runner TypeScript). Crear `tsconfig.json` y `vitest.config.ts` con configuración básica para tests en `tests/`. No incluir código de aplicación ni dependencias de frontend/backend en este punto.
- **Archivos/rutas objetivo:**
  - `package.json`
  - `tsconfig.json`
  - `vitest.config.ts`
  - `.gitignore` (agregar `node_modules/`, `.env*`)
- **RF/escenarios cubiertos:** Infraestructura de pruebas; gate anti-circularidad.
- **Dependencias:** T001.
- **Criterio de aceptación:**
  - `package.json` tiene scripts de test y devDependencies mínimas.
  - `vitest.config.ts` apunta a `tests/**/*.test.ts`.
  - No se instalan dependencias de aplicación (Next.js, Prisma, etc.) en este punto.

### T005 — Verificar runner de tests vacíos

- **Descripción:** Crear un test vacío/pendiente de ejemplo (`tests/bootstrap/runner-smoke.test.ts`) y ejecutar `npm install` + `vitest run`. Confirmar que el runner arranca sin errores de configuración. Este test es solo verificación de entorno; se puede eliminar o marcar como smoke al final.
- **Archivos/rutas objetivo:**
  - `tests/bootstrap/runner-smoke.test.ts`
  - `package.json`
  - `vitest.config.ts`
- **RF/escenarios cubiertos:** Infraestructura de pruebas.
- **Dependencias:** T004.
- **Criterio de aceptación:**
  - `npm install` funciona en el workspace.
  - `vitest run` ejecuta y reporta al menos un test (vacío/pendiente) sin errores de configuración.
  - No se requiere base de datos ni código de aplicación.

---

## Fase 2 — Contratos y modelo

### T006 — Firmar contratos compartidos en `contracts/`

- **Descripción:** Validar formalmente `contracts/auth.contract.ts`, `contracts/patients.contract.ts`, `contracts/clinical.contract.ts` y `contracts/README.md` contra la matriz de operaciones de SPEC-001. Verificar: sin `any`, sin secretos, `ActorContext` en todas las operaciones de lectura/escritura, `expectedVersion` en mutaciones concurrentes, listas blancas en DTOs de salida, `Patient.version` presente, y operación `releaseConsultation` para liberación administrativa.
- **Archivos/rutas objetivo:**
  - `contracts/auth.contract.ts`
  - `contracts/patients.contract.ts`
  - `contracts/clinical.contract.ts`
  - `contracts/README.md`
- **RF/escenarios cubiertos:** RF-001..RF-011; Escenario 5.11; RF-010.
- **Dependencias:** T001, T003.
- **Criterio de aceptación:**
  - Cada contrato tiene al menos dos aprobaciones documentadas (puede ser en el historial de cambios o en un comentario del archivo).
  - `ActorContext` está presente en **todas** las operaciones de `IPatientService` e `IClinicalService`, incluyendo lecturas (`get*`, `list*`, `find*`, `hasValidConsent`).
  - `expectedVersion` está en todas las mutaciones concurrentes de `patients` y `clinical`.
  - `Patient` expone `version: number`.
  - `IClinicalService` declara `releaseConsultation`.
  - No hay tipos `any` ni campos sensibles sin lista blanca.

### T007 — Completar `SetNonClinicalNoteInput` y operación en contrato clinical

- **Descripción:** Asegurar que `clinical.contract.ts` incluye `setNonClinicalNote(input: SetNonClinicalNoteInput, actor: ActorContext)` con `noteKey` nullable, `expectedVersion` y generación de auditoría. Verificar que `Consultation` expone `nonClinicalNoteKey` y que el catálogo `NonClinicalNoteKey` / `NonClinicalNote` está cerrado.
- **Archivos/rutas objetivo:**
  - `contracts/clinical.contract.ts`
- **RF/escenarios cubiertos:** RF-009; Escenario 5.6.
- **Dependencias:** T006.
- **Criterio de aceptación:**
  - `IClinicalService` declara `setNonClinicalNote`.
  - `SetNonClinicalNoteInput` tiene `consultationId`, `noteKey: NonClinicalNoteKey | null`, `expectedVersion`.
  - No se permiten notas libres de texto en el contrato.

### T008 — Convertir `data-model.md` en schema Prisma físico inicial

- **Descripción:** Escribir `prisma/schema.prisma` con las entidades: `Patient`, `PrivacyNotice`, `Consent`, `Consultation`, `Refraction`, `Prescription`, `NonClinicalNote`, `AuditLog`, `Branch` y `User` (mínima, como referencia al módulo auth). Incluir tipos, constraints, índices, `Decimal` para esfera/cilindro/adición, `CHECK` cuando Prisma lo soporte (o documentar validación en código/Zod), campos de auditoría (`createdBy`, `updatedBy`, `createdAt`, `updatedAt`) y control de versión (`version`).
- **Archivos/rutas objetivo:**
  - `prisma/schema.prisma`
  - `specs/001-pacientes-consultas/data-model.md`
- **RF/escenarios cubiertos:** RF-001..RF-011 (representación física del dominio).
- **Dependencias:** T001 (ADR-001 aprobado ratifica Prisma/PostgreSQL), T006.
- **Criterio de aceptación:**
  - Schema trazable a cada entidad de `data-model.md`.
  - Entidades `PrivacyNotice`, `Consent`, `NonClinicalNote`, `AuditLog` y `Branch` presentes.
  - `Patient.version` presente.
  - `Patient.folio` y `Prescription.folio` tienen `@@unique`.
  - `Consultation` tiene índice para evitar dos `in_progress` por paciente.
  - `Prescription` tiene índice/constraint parcial o documentación equivalente para garantizar una sola prescripción base (`isAmendment = false`) por consulta.
  - `AuditLog` es solo inserción; no tiene operaciones de update/delete en la aplicación.

### T009 — Diseñar generación de folios determinista con unicidad en BD

- **Descripción:** Definir en `prisma/schema.prisma` y en documentación la estrategia de folios: prefijo de sucursal (`Branch.code`) + secuencia (`Branch.nextPatientSequence` / `Branch.nextPrescriptionSequence`) con relleno a 8 caracteres alfanuméricos, y constraint `UNIQUE` en base de datos. Documentar el manejo de colisiones (reintentar con nueva secuencia) y el bloqueo optimista al incrementar contadores.
- **Archivos/rutas objetivo:**
  - `prisma/schema.prisma`
  - `specs/001-pacientes-consultas/data-model.md`
  - `specs/001-pacientes-consultas/spec.md` §RF-002
- **RF/escenarios cubiertos:** RF-002; RF-008.
- **Dependencias:** T008.
- **Criterio de aceptación:**
  - Estrategia determinista documentada.
  - `Branch.nextPatientSequence` y `Branch.nextPrescriptionSequence` no reutilizables.
  - Existe mecanismo para evitar race conditions al generar folios (transacción con bloqueo o reintento).
  - Pruebas RED de folio duplicado deben ser posibles.

### T010 — Modelar ciclo de estados de consulta y transiciones permitidas

- **Descripción:** Definir en schema y en contrato que `Consultation.status` admite `in_progress`, `closed`, `abandoned`. Documentar transiciones: `in_progress → closed` (solo vía `issuePrescription`), `in_progress → abandoned` (solo vía `abandon`), sin salida de estados finales. Incluir reglas de edición simultánea y propiedad de consulta `in_progress`.
- **Archivos/rutas objetivo:**
  - `prisma/schema.prisma`
  - `contracts/clinical.contract.ts`
  - `specs/001-pacientes-consultas/data-model.md` §3
- **RF/escenarios cubiertos:** RF-005; Escenarios 5.3, 5.5, 5.8, 5.9.
- **Dependencias:** T008.
- **Criterio de aceptación:**
  - Estados y transiciones documentados en schema, contrato y modelo.
  - Constraint en BD o validación en código que impida transiciones inválidas.
  - Regla de "solo una consulta in_progress por paciente" modelada.

### T011 — Modelar enmiendas de refracción y prescripción sin borrar original

- **Descripción:** En schema Prisma, `Refraction` y `Prescription` deben tener `isAmendment`, `amendedFromId` (auto-relación opcional), `amendmentReason`, `createdBy`, `createdAt`. El registro original es inmutable; las correcciones son nuevos registros. `Prescription` debe mantener una sola prescripción base por consulta y almacenar un snapshot de la refracción vigente al momento de la emisión.
- **Archivos/rutas objetivo:**
  - `prisma/schema.prisma`
  - `contracts/clinical.contract.ts`
  - `specs/001-pacientes-consultas/data-model.md` §1.5, §1.6, §3
- **RF/escenarios cubiertos:** RF-011; RF-008; Escenario 5.7.
- **Dependencias:** T008.
- **Criterio de aceptación:**
  - Campos de enmienda presentes en schema y contrato.
  - Prescripción base única por consulta (constraint parcial o validación equivalente).
  - Prescripción incluye snapshot inmutable de refracción.
  - No existe operación de borrado físico ni sobrescritura silenciosa.

### T012 — Definir esquema de `AuditLog` con `requestId` y acciones extendidas

- **Descripción:** Modelar `AuditLog` con campos: `id`, `actorId`, `action` (`create`, `read`, `update`, `amend`, `delete_attempt`, `ACCESS_DENIED`, `LOGIN`, `LOGOUT`, `SESSION_INVALIDATED`), `entity`, `entityId`, `requestId`, `reason`, `metadata` (JSON seguro), `occurredAt`. Garantizar que `metadata` no almacena datos sensibles (graduación, diagnóstico, etc.).
- **Archivos/rutas objetivo:**
  - `prisma/schema.prisma`
  - `contracts/auth.contract.ts`
  - `contracts/clinical.contract.ts`
  - `contracts/patients.contract.ts`
- **RF/escenarios cubiertos:** RF-010; Escenarios 5.11, 5.12; RF-003.
- **Dependencias:** T008.
- **Criterio de aceptación:**
  - `AuditLog` presente en schema.
  - `requestId` obligatorio y vinculado a `ActorContext.requestId`.
  - Acciones `ACCESS_DENIED`, `LOGIN`, `LOGOUT`, `SESSION_INVALIDATED` incluidas en `AuthAction` y/o en el enum de auditoría con casing canónico.
  - Regla documentada: `metadata` nunca contiene datos clínicos ni secretos.

### T013 — Agregar contrato, test RED y tarea para liberación administrativa de consulta bloqueada

- **Descripción:** En `clinical.contract.ts` agregar `ReleaseConsultationInput` y `releaseConsultation(input, actor)`; solo `admin` puede ejecutarla y requiere `reason`/`expectedVersion`. Crear test RED `tests/integration/clinical/release-consultation.test.ts` que verifique: solo admin libera, solo desde `in_progress`, se registra en auditoría, y tras liberar otro optometrista puede tomar la consulta.
- **Archivos/rutas objetivo:**
  - `contracts/clinical.contract.ts`
  - `tests/integration/clinical/release-consultation.test.ts`
  - `specs/001-pacientes-consultas/spec.md` §4
- **RF/escenarios cubiertos:** RF-005; Escenario 5.8.
- **Dependencias:** T005, T006, T010.
- **Criterio de aceptación:**
  - Contrato incluye `releaseConsultation`.
  - Test RED ejecutable y fallido/pendiente.
  - Matriz de roles refleja que solo `admin` libera consulta bloqueada.

---

## Fase 3 — Tests RED

> **Gate:** T005 (runner vacío ejecutable) debe estar `Hecha` antes de iniciar esta fase.

### T014 — Escribir tests RED para registro de paciente y folio (RF-001, RF-002)

- **Descripción:** Crear casos de prueba vacíos/fallidos en `tests/unit/patients/create-patient.test.ts` y `tests/integration/patients/folio.test.ts` que validen: creación con campos obligatorios/opcionales, generación de folio único de 8 caracteres, rechazo de duplicados, error si falta campo obligatorio, `Patient.version` inicial.
- **Archivos/rutas objetivo:**
  - `tests/unit/patients/create-patient.test.ts`
  - `tests/integration/patients/folio.test.ts`
- **RF/escenarios cubiertos:** RF-001, RF-002; Escenario 5.1.
- **Dependencias:** T006, T008, T009, T005.
- **Criterio de aceptación:**
  - `vitest run` muestra los tests como fallidos/pendientes, sin errores de configuración.
  - Cada test cubre un caso de aceptación de RF-001/RF-002.

### T015 — Escribir tests RED para consentimiento, re-consentimiento y `PrivacyNotice` (RF-003)

- **Descripción:** Crear tests que fallen/pendientes para: registro de consentimiento inicial vinculado a `PrivacyNotice` vigente, bloqueo de escritura clínica sin consentimiento vigente, re-consentimiento al cambiar versión del aviso de privacidad, re-consentimiento al editar datos clínicos existentes (incluyendo enmiendas), registro de `source` (IP/origen) y `grantedBy`.
- **Archivos/rutas objetivo:**
  - `tests/unit/patients/consent.test.ts`
  - `tests/integration/clinical/consent-gate.test.ts`
- **RF/escenarios cubiertos:** RF-003; Escenario 5.12.
- **Dependencias:** T006, T008, T005.
- **Criterio de aceptación:**
  - Tests en rojo ejecutables.
  - Cubren consentimiento inicial, re-consentimiento por cambio de aviso, re-consentimiento por edición clínica y bloqueo.

### T016 — Escribir tests RED para búsqueda con lista blanca y benchmark 100k unificado (RF-004)

- **Descripción:** Crear tests de búsqueda por nombre parcial, teléfono parcial (≥4 dígitos) y folio exacto. Verificar que resultados solo incluyen lista blanca (`PatientSearchResult`). Crear **un único** script/benchmark en `tests/benchmark/search-100k.benchmark.ts` que genere 100k pacientes y consultas sintéticos y mida p95 de búsqueda y resumen por folio/patientId ≤ 500 ms.
- **Archivos/rutas objetivo:**
  - `tests/unit/patients/search.test.ts`
  - `tests/benchmark/search-100k.benchmark.ts`
  - `tests/fixtures/synthetic-patients.ts`
- **RF/escenarios cubiertos:** RF-004; Escenario 5.2.
- **Dependencias:** T006, T008, T005.
- **Criterio de aceptación:**
  - Tests en rojo ejecutables.
  - Benchmark definido en ruta única y ejecutable (puede fallar intencionalmente por falta de implementación).
  - Fixtures sintéticos sin datos reales ni sensibles.

### T017 — Escribir tests RED para ciclo de vida de consulta (RF-005)

- **Descripción:** Crear tests para: abrir consulta, rechazo de segunda consulta `in_progress`, transición a `closed` vía `issuePrescription`, transición a `abandoned` vía `abandon`, liberación administrativa por `admin`, bloqueo de edición en estado final, control de concurrencia con `expectedVersion`.
- **Archivos/rutas objetivo:**
  - `tests/unit/clinical/consultation-lifecycle.test.ts`
  - `tests/integration/clinical/concurrency.test.ts`
  - `tests/integration/clinical/release-consultation.test.ts` (continuación de T013)
- **RF/escenarios cubiertos:** RF-005; Escenarios 5.3, 5.5, 5.8, 5.9.
- **Dependencias:** T006, T008, T010, T013, T005.
- **Criterio de aceptación:**
  - Tests en rojo ejecutables.
  - Cubren transiciones permitidas, rechazo de transiciones inválidas y liberación administrativa.

### T018 — Escribir tests RED para refracción OD/OI y validaciones (RF-006, RF-007)

- **Descripción:** Crear tests para captura de esfera, cilindro, eje, adición, agudeza visual y distancia pupilar para OD y OI. Validar rangos, cilindro negativo, cilindro distinto de cero sin eje, valores neutros explícitos (`0.00`) y requisito de ambos ojos antes de prescripción.
- **Archivos/rutas objetivo:**
  - `tests/unit/clinical/refraction-validation.test.ts`
  - `tests/integration/clinical/refraction-od-oi.test.ts`
- **RF/escenarios cubiertos:** RF-006, RF-007; Escenarios 5.4, 5.10.
- **Dependencias:** T006, T008, T005.
- **Criterio de aceptación:**
  - Tests en rojo ejecutables.
  - Cubren validaciones por ojo y combinación OD+OI.

### T019 — Escribir tests RED para prescripción, snapshot de refracción y enmiendas (RF-008, RF-011)

- **Descripción:** Crear tests para emisión de prescripción con folio correlativo, snapshot inmutable de refracción en prescripción, cierre de consulta, enmienda de refracción y enmienda de prescripción conservando original, verificación de `amendedFromId`/`amendmentReason`/`version`.
- **Archivos/rutas objetivo:**
  - `tests/integration/clinical/prescription.test.ts`
  - `tests/integration/clinical/amendment.test.ts`
- **RF/escenarios cubiertos:** RF-008, RF-011; Escenarios 5.5, 5.7.
- **Dependencias:** T006, T008, T011, T005.
- **Criterio de aceptación:**
  - Tests en rojo ejecutables.
  - Verifican que enmiendas no reemplazan el registro original y que la prescripción conserva snapshot de refracción.

### T020 — Escribir tests RED para resumen seguro y `setNonClinicalNote` (RF-009)

- **Descripción:** Crear tests para `getSafeSummary`, `getSafeSummaryByPatientId`, `getSafeSummaryByFolio`, `listConsultationsByPatientId`, `listConsultationsByFolio` y `setNonClinicalNote`. Verificar lista blanca de campos, uso de catálogo cerrado, rechazo de notas libres y acceso por secretaría.
- **Archivos/rutas objetivo:**
  - `tests/unit/clinical/safe-summary.test.ts`
  - `tests/integration/clinical/non-clinical-note.test.ts`
- **RF/escenarios cubiertos:** RF-009; Escenario 5.6.
- **Dependencias:** T006, T007, T008, T005.
- **Criterio de aceptación:**
  - Tests en rojo ejecutables.
  - Verifican que resumen no expone graduación/diagnóstico.

### T021 — Escribir tests RED para permisos y auditoría (RF-010, Escenario 5.11)

- **Descripción:** Crear tests que verifiquen: secretaría no puede ver expediente clínico completo, asistente no puede emitir prescripción, acceso denegado genera `ACCESS_DENIED` con `requestId`, toda lectura/escritura clínica genera `AuditLog`, `metadata` no contiene datos sensibles.
- **Archivos/rutas objetivo:**
  - `tests/integration/auth/permissions.test.ts`
  - `tests/integration/audit/audit-trail.test.ts`
- **RF/escenarios cubiertos:** RF-010; Escenario 5.11.
- **Dependencias:** T006, T012, T005.
- **Criterio de aceptación:**
  - Tests en rojo ejecutables.
  - Cubren al menos todas las celdas "No" de la matriz de roles de `spec.md` §4.

### T022 — Escribir tests RED para eventos de sesión (`LOGIN`/`LOGOUT`/`SESSION_INVALIDATED`)

- **Descripción:** Crear tests para `recordAudit` de acciones `LOGIN`, `LOGOUT`, `SESSION_INVALIDATED`, validando que `requestId` y `actorId` se persisten y que `metadata` no contiene tokens ni contraseñas.
- **Archivos/rutas objetivo:**
  - `tests/integration/auth/session-audit.test.ts`
- **RF/escenarios cubiertos:** RF-010; contrato `auth.contract.ts`.
- **Dependencias:** T006, T012, T005.
- **Criterio de aceptación:**
  - Tests en rojo ejecutables.
  - Verifican que eventos de sesión se auditan con `requestId`.

### T023 — Revisión de privacidad de fixtures y checklist de salida de fase 2

- **Descripción:** Inspeccionar todos los archivos creados en `tests/` para confirmar que no contienen datos personales reales, CURP, teléfonos reales, direcciones reales ni graduaciones reales. Documentar la fuente de datos sintéticos. Verificar criterios de salida de fase 0/1/2 de `plan.md` §4.
- **Archivos/rutas objetivo:**
  - `tests/**/*.test.ts`
  - `tests/fixtures/*`
  - `specs/001-pacientes-consultas/checklists/requirements.md`
- **RF/escenarios cubiertos:** P2 de Constitución; toda fase 2.
- **Dependencias:** T014..T022.
- **Criterio de aceptación:**
  - Ningún fixture contiene datos sensibles reales.
  - Se añade nota en `tests/fixtures/README.md` o equivalente.
  - `vitest run` muestra tests fallidos/pendientes sin errores de configuración.
  - Benchmark 100k definido en ruta única y ejecutable.

---

## Fase 4 — Implementación del dominio

> **Gate:** No iniciar esta fase hasta que T023 (salida de fase 2) esté completada y ADR-001 aprobado.

### T024 — Configurar proyecto base según ADR-001

- **Descripción:** Inicializar proyecto Next.js 15, configurar Prisma, Zod, Vitest, Playwright y dependencias aprobadas en ADR-001. No instalar dependencias copyleft. Crear `.env.example` sin secretos.
- **Archivos/rutas objetivo:**
  - `package.json`
  - `tsconfig.json`
  - `vitest.config.ts`
  - `playwright.config.ts`
  - `.env.example`
  - `prisma/schema.prisma` (ya existe de T008)
- **RF/escenarios cubiertos:** Infraestructura de SPEC-001.
- **Dependencias:** T001, T023.
- **Criterio de aceptación:**
  - `npm install` funciona (cuando se ejecute).
  - `vitest run` ejecuta sin errores de configuración.
  - `npx prisma validate` pasa.

### T025 — Crear migración inicial y seed sintético

- **Descripción:** Generar primera migración con Prisma (`npx prisma migrate dev --name init_spec_001`). Crear seed que inserte sucursal de prueba, aviso de privacidad v1, catálogo `NonClinicalNote` y usuarios de prueba por rol. No incluir datos reales.
- **Archivos/rutas objetivo:**
  - `prisma/migrations/`
  - `prisma/seed.ts`
- **RF/escenarios cubiertos:** RF-001..RF-011 (datos base).
- **Dependencias:** T008, T024.
- **Criterio de aceptación:**
  - Migración aplicable localmente con `DATABASE_URL` configurado.
  - Seed ejecutable y reversible.
  - Datos de seed no son sensibles ni reales.

### T026 — Implementar módulo `patients` (casos de uso)

- **Descripción:** Implementar en `src/modules/patients/` los casos de uso: `createPatient`, `updatePatient`, `searchPatients`, `findPatientByFolio`, `findPatientById`, `getPatientSummary`, `recordConsent`, `hasValidConsent`. Usar Zod para validación, `expectedVersion` en `update`, y generación de folio determinista. `hasValidConsent` debe comparar contra `PrivacyNotice` vigente.
- **Archivos/rutas objetivo:**
  - `src/modules/patients/service.ts`
  - `src/modules/patients/repository.ts`
  - `src/modules/patients/validators.ts`
  - `src/modules/patients/folio-generator.ts`
  - `src/modules/patients/consent.service.ts`
- **RF/escenarios cubiertos:** RF-001, RF-002, RF-003, RF-004.
- **Dependencias:** T008, T009, T024, T025.
- **Criterio de aceptación:**
  - Tests de RF-001/RF-002 pasan.
  - `updatePatient` rechaza sobrescritas perdidas con `expectedVersion`.
  - Búsqueda devuelve solo lista blanca.
  - `hasValidConsent` requiere coincidencia con `PrivacyNotice` vigente.

### T027 — Implementar módulo `clinical` — apertura, estados y liberación

- **Descripción:** Implementar `openConsultation`, `abandonConsultation`, `releaseConsultation` y la máquina de estados manual. Validar que solo `clinical:optometrist` abre consulta, que no exista otra `in_progress` para el mismo paciente, que `abandon` requiera motivo y que solo `admin` libere una consulta `in_progress` bloqueada con motivo y auditoría.
- **Archivos/rutas objetivo:**
  - `src/modules/clinical/service.ts`
  - `src/modules/clinical/repository.ts`
  - `src/modules/clinical/state-machine.ts`
- **RF/escenarios cubiertos:** RF-005; Escenarios 5.3, 5.8, 5.9.
- **Dependencias:** T026, T010, T013.
- **Criterio de aceptación:**
  - Tests de ciclo de vida pasan.
  - Transiciones inválidas rechazadas.
  - Liberación administrativa funciona y se audita.
  - Concurrencia con `expectedVersion` funciona.

### T028 — Implementar refracción OD/OI con validaciones

- **Descripción:** Implementar `addRefraction` validando rangos por ojo, cilindro negativo, cilindro sin eje, valores neutros explícitos y requisito de ambos ojos antes de prescripción. Cada valor queda con `createdBy` y `createdAt`.
- **Archivos/rutas objetivo:**
  - `src/modules/clinical/refraction.service.ts`
  - `src/modules/clinical/validators.ts`
- **RF/escenarios cubiertos:** RF-006, RF-007; Escenarios 5.4, 5.10.
- **Dependencias:** T027, T018.
- **Criterio de aceptación:**
  - Tests de RF-006/RF-007 pasan.
  - Validaciones rechazan combinaciones inválidas.

### T029 — Implementar prescripción, folio correlativo y snapshot de refracción

- **Descripción:** Implementar `issuePrescription` que valide refracción OD/OI, uso recomendado, optometrista responsable, genere folio correlativo por sucursal (`Branch.nextPrescriptionSequence`), almacene snapshot inmutable de la refracción vigente y transicione consulta a `closed`. Asegurar unicidad del folio.
- **Archivos/rutas objetivo:**
  - `src/modules/clinical/prescription.service.ts`
  - `src/modules/clinical/folio-prescription-generator.ts`
- **RF/escenarios cubiertos:** RF-008; Escenario 5.5.
- **Dependencias:** T028, T009, T011.
- **Criterio de aceptación:**
  - Tests de RF-008 pasan.
  - Folio de prescripción único y correlativo.
  - Prescripción almacena snapshot de refracción.
  - Consulta pasa a `closed` tras emisión.

### T030 — Implementar enmiendas de refracción y prescripción

- **Descripción:** Implementar `amendRefraction` y `amendPrescription`. Crear nuevo registro con `isAmendment = true`, `amendedFromId`, `amendmentReason`, `createdBy`, `createdAt`; conservar original. `Prescription` mantiene una sola prescripción base por consulta; `version` incrementa en enmiendas. Antes de enmienda verificar `hasValidConsent` contra `PrivacyNotice` vigente.
- **Archivos/rutas objetivo:**
  - `src/modules/clinical/refraction.service.ts`
  - `src/modules/clinical/prescription.service.ts`
- **RF/escenarios cubiertos:** RF-011; Escenario 5.7.
- **Dependencias:** T028, T029, T011, T026.
- **Criterio de aceptación:**
  - Tests de RF-011 pasan.
  - Registro original accesible.
  - No existe borrado físico.

### T031 — Implementar `setNonClinicalNote` y catálogo cerrado

- **Descripción:** Implementar `setNonClinicalNote` en `clinical.service.ts`. Permitir asignar o remover (`null`) una clave del catálogo cerrado. Validar que `noteKey` exista en catálogo y esté activo. No permitir notas libres de texto. Actualizar `version` de consulta con `expectedVersion`.
- **Archivos/rutas objetivo:**
  - `src/modules/clinical/service.ts`
  - `src/modules/clinical/non-clinical-notes.ts`
- **RF/escenarios cubiertos:** RF-009; Escenario 5.6.
- **Dependencias:** T027, T007.
- **Criterio de aceptación:**
  - Tests de RF-009 para `setNonClinicalNote` pasan.
  - Claves fuera del catálogo rechazadas.
  - Remoción con `null` permitida.

### T032 — Implementar resumen seguro por folio y por `patientId`

- **Descripción:** Implementar `getSafeSummary`, `getSafeSummaryByPatientId`, `getSafeSummaryByFolio`, `listConsultationsByPatientId`, `listConsultationsByFolio`. Garantizar lista blanca: nombre, folio, fecha consulta, `usage`, estado, `nonClinicalNoteKey`/`nonClinicalNote`. No exponer graduación/diagnóstico.
- **Archivos/rutas objetivo:**
  - `src/modules/clinical/safe-summary.service.ts`
- **RF/escenarios cubiertos:** RF-009; Escenario 5.6.
- **Dependencias:** T031.
- **Criterio de aceptación:**
  - Tests de RF-009 para resumen pasan.
  - Respuesta estrictamente igual a lista blanca de `SafeSummary`.

---

## Fase 5 — Autorización, privacidad y auditoría

### T033 — Implementar adaptador stub del módulo `auth`

- **Descripción:** Crear `src/modules/auth/adapter.stub.ts` que satisfaga `IAuthService` de `contracts/auth.contract.ts`: `verifySession`, `getIdentity`, `can`, `invalidateSession`, `recordAudit`. Debe permitir inyectar usuarios de prueba por rol. Es un stub temporal hasta que exista el módulo real de auth.
- **Archivos/rutas objetivo:**
  - `src/modules/auth/adapter.stub.ts`
  - `src/modules/auth/index.ts`
- **RF/escenarios cubiertos:** RF-010; boundary de auth.
- **Dependencias:** T006, T024.
- **Criterio de aceptación:**
  - Stub implementa `IAuthService` sin `any`.
  - Permite simular roles para pruebas.
  - No almacena secretos.

### T034 — Propagar `ActorContext` en todas las lecturas y escrituras

- **Descripción:** Asegurar que todos los métodos de `patients.service.ts` y `clinical.service.ts` reciben `ActorContext` (actorId, role, requestId) y lo pasan al repositorio. Incluir lecturas: `findById`, `findByFolio`, `search`, `getSummary`, `getSafeSummary*`, `listConsultationsBy*`, `getFullConsultation`, `hasValidConsent`. No asumir que la capa de auditoría ya existe; solo propagar el contexto.
- **Archivos/rutas objetivo:**
  - `src/modules/patients/service.ts`
  - `src/modules/clinical/service.ts`
  - `src/modules/clinical/safe-summary.service.ts`
- **RF/escenarios cubiertos:** RF-010; P1, P2.
- **Dependencias:** T026, T027, T032, T033.
- **Criterio de aceptación:**
  - Ninguna operación de lectura/escritura carece de `ActorContext`.
  - `requestId` fluye desde el boundary hasta las capas inferiores.

### T035 — Implementar capa de auditoría con `requestId`

- **Descripción:** Crear `src/modules/audit/service.ts` que inserte en `AuditLog` con actor, acción, entidad, entityId, `requestId`, timestamp y razón. Usar en cada mutación y lectura sensible de `patients` y `clinical`. Implementar helper `audit.read` y `audit.write`. Depende de que `ActorContext` ya fluya (T034), no al revés.
- **Archivos/rutas objetivo:**
  - `src/modules/audit/service.ts`
  - `src/modules/audit/types.ts`
- **RF/escenarios cubiertos:** RF-010.
- **Dependencias:** T012, T034.
- **Criterio de aceptación:**
  - Cada create/read/update/amend genera registro de auditoría.
  - `requestId` siempre presente.
  - `metadata` no contiene datos sensibles.

### T036 — Registrar `ACCESS_DENIED` en intentos no autorizados

- **Descripción:** En cada endpoint/caso de uso sensible, cuando un rol no tiene permiso, devolver 403/404 genérico y registrar `ACCESS_DENIED` en `AuditLog` con `requestId`, actor, recurso intentado y rol. No exponer datos sensibles en la respuesta ni en `metadata`.
- **Archivos/rutas objetivo:**
  - `src/modules/patients/service.ts`
  - `src/modules/clinical/service.ts`
  - `src/modules/audit/service.ts`
- **RF/escenarios cubiertos:** RF-010; Escenario 5.11.
- **Dependencias:** T035.
- **Criterio de aceptación:**
  - Tests de permisos pasan.
  - Cada intento no autorizado deja traza `ACCESS_DENIED`.
  - Respuesta genérica sin datos sensibles.

### T037 — Registrar eventos de sesión `LOGIN`, `LOGOUT`, `SESSION_INVALIDATED`

- **Descripción:** Implementar o conectar en el adaptador stub (o en el boundary real si existe) la llamada a `recordAudit` para `LOGIN`, `LOGOUT` y `SESSION_INVALIDATED`. Asegurar que `requestId` y `actorId` se registran. `metadata` solo debe contener contexto seguro (timestamp, source); nunca tokens ni contraseñas.
- **Archivos/rutas objetivo:**
  - `src/modules/auth/adapter.stub.ts`
  - `src/modules/audit/service.ts`
- **RF/escenarios cubiertos:** RF-010; contrato auth.
- **Dependencias:** T033, T035.
- **Criterio de aceptación:**
  - Tests de sesión pasan.
  - Eventos de login/logout/invalidación quedan en `AuditLog` con `requestId`.
  - Tokens/contraseñas ausentes de `metadata`.

### T038 — Implementar autorización basada en roles (RBAC) en dominio

- **Descripción:** Implementar función `authorize(role, action, resource)` que refleje la matriz de `spec.md` §4. Usarla en `patients.service.ts` y `clinical.service.ts` antes de ejecutar operaciones. Mantener RBAC en código con contrato claro (sin Casbin ni XState en SPEC-001).
- **Archivos/rutas objetivo:**
  - `src/modules/auth/rbac.ts`
  - `src/modules/patients/service.ts`
  - `src/modules/clinical/service.ts`
- **RF/escenarios cubiertos:** Matriz de roles; RF-005; RF-008; RF-009; RF-010.
- **Dependencias:** T033, T036.
- **Criterio de aceptación:**
  - Matriz de roles cubierta al 100% en tests de permisos.
  - Cada operación verifica rol antes de ejecutar.

### T039 — Garantizar que datos sensibles no aparezcan en logs ni errores

- **Descripción:** Revisar todo el código de `src/modules/patients`, `src/modules/clinical`, `src/modules/audit` y adaptadores para asegurar que logs, excepciones y `metadata` de auditoría no incluyen graduación, diagnóstico, teléfono completo, correo, dirección, allergies, conditions ni tokens. Usar listas blancas para mensajes de error.
- **Archivos/rutas objetivo:**
  - `src/modules/**/*.ts`
  - `src/app/**/*.ts` (cuando exista)
- **RF/escenarios cubiertos:** P2; RF-010; Escenario 5.11.
- **Dependencias:** T026..T038.
- **Criterio de aceptación:**
  - Búsqueda de palabras clave sensibles (`sphere`, `cylinder`, `allergies`, etc.) en logs de prueba no arroja resultados.
  - Errores públicos son genéricos.

### T040 — Implementar bloqueo de escritura clínica sin consentimiento vigente y `PrivacyNotice`

- **Descripción:** En `clinical.service.ts`, antes de `addRefraction`, `amendRefraction`, `issuePrescription` y `amendPrescription`, verificar `hasValidConsent(patientId)` contra el `PrivacyNotice` vigente. Si no hay consentimiento vigente o el aviso cambió, rechazar con error controlado y registrar `ACCESS_DENIED` en auditoría. No persistir datos clínicos. Implementar `PrivacyNotice` repository/seed.
- **Archivos/rutas objetivo:**
  - `src/modules/clinical/service.ts`
  - `src/modules/patients/consent.service.ts`
  - `src/modules/patients/privacy-notice.service.ts`
- **RF/escenarios cubiertos:** RF-003; Escenario 5.12.
- **Dependencias:** T026, T038.
- **Criterio de aceptación:**
  - Tests de consentimiento gate pasan.
  - Operaciones clínicas sin consentimiento vigente son rechazadas.
  - `hasValidConsent` devuelve `false` si el `noticeId` vigente cambió.
  - Se audita el rechazo.

---

## Fase 6 — API routes / contratos HTTP

> **Principio:** la UI de la fase 7 consume estos endpoints reales o un mock boundary explícito. Por defecto, los endpoints reales son prerequisito.

### T041 — Implementar API routes de SPEC-001 y sus tests de contrato

- **Descripción:** Crear API routes de Next.js que expongan las operaciones de `patients` y `clinical` validando sesión vía adaptador stub, inyectando `ActorContext` y retornando listas blancas. Endpoints sensibles deben responder 403/404 genéricos ante acceso no autorizado. Crear tests de contrato HTTP para cada ruta.
- **Archivos/rutas objetivo:**
  - `src/app/api/patients/route.ts` (POST create; PATCH update)
  - `src/app/api/patients/search/route.ts` (GET)
  - `src/app/api/patients/[folio]/consent/route.ts` (POST recordConsent; GET hasValidConsent)
  - `src/app/api/privacy-notice/route.ts` (GET vigente)
  - `src/app/api/consultations/route.ts` (POST open)
  - `src/app/api/consultations/[id]/route.ts` (GET full; PATCH abandon/release)
  - `src/app/api/consultations/[id]/refraction/route.ts` (POST add; PATCH amend)
  - `src/app/api/consultations/[id]/prescription/route.ts` (POST issue; PATCH amend)
  - `src/app/api/consultations/[id]/non-clinical-note/route.ts` (PATCH setNonClinicalNote)
  - `src/app/api/frontdesk/summary/route.ts` (GET by patientId/folio)
  - `tests/integration/api/*.test.ts`
- **RF/escenarios cubiertos:** RF-001..RF-011 (exposición HTTP).
- **Dependencias:** T024..T040.
- **Criterio de aceptación:**
  - Endpoints validan sesión y rol.
  - `ActorContext` generado en cada request.
  - Respuestas limitadas a listas blancas.
  - Tests de contrato HTTP pasan para create/update paciente, consentimiento, abandon, enmiendas y `setNonClinicalNote`.

---

## Fase 7 — UI

> **Boundary:** la UI puede progresar en paralelo solo si se declara y configura un mock boundary (MSW o stub de fetch) que implemente los contratos HTTP de T041. El orden por defecto es endpoints reales primero.

### T042 — Crear pantalla de registro de paciente (viewport 375/768)

- **Descripción:** Construir página/ruta para registrar paciente con todos los campos de RF-001, aviso de privacidad y registro de consentimiento. Diseñar mobile-first para 375 px y tablet 768 px. Touch-first, sin depender de hover. Mensajes claros de error/éxito.
- **Archivos/rutas objetivo:**
  - `src/app/patients/new/page.tsx`
  - `src/components/patients/PatientForm.tsx`
  - `src/components/patients/PrivacyConsent.tsx`
- **RF/escenarios cubiertos:** RF-001, RF-003; Escenario 5.1.
- **Dependencias:** T041 (o mock boundary declarado).
- **Criterio de aceptación:**
  - UI usable en 375 px y 768 px (verificado visualmente).
  - Flujo completable sin hover.
  - Validaciones Zod reflejadas en UI.

### T043 — Crear pantalla de búsqueda de paciente

- **Descripción:** Construir búsqueda por nombre, teléfono (parcial ≥4 dígitos) y folio exacto. Mostrar solo lista blanca. Incluir indicador de última consulta. Touch-first.
- **Archivos/rutas objetivo:**
  - `src/app/patients/search/page.tsx`
  - `src/components/patients/PatientSearch.tsx`
- **RF/escenarios cubiertos:** RF-004; Escenario 5.2.
- **Dependencias:** T041 (o mock boundary), T042.
- **Criterio de aceptación:**
  - Búsqueda funciona en 375/768 px.
  - Resultados no exponen datos sensibles.

### T044 — Crear pantalla de detalle de consulta (refracción OD/OI)

- **Descripción:** Construir UI para abrir consulta, capturar refracción OD/OI con validaciones, ver refracciones previas y enmiendas. Solo accesible por `clinical:optometrist`. Touch-first.
- **Archivos/rutas objetivo:**
  - `src/app/consultations/[id]/page.tsx`
  - `src/components/clinical/RefractionForm.tsx`
  - `src/components/clinical/EyeInput.tsx`
- **RF/escenarios cubiertos:** RF-005, RF-006, RF-007; Escenarios 5.3, 5.4, 5.10.
- **Dependencias:** T041 (o mock boundary), T027, T028, T038.
- **Criterio de aceptación:**
  - UI funciona en 375/768 px.
  - Validaciones visibles antes de guardar.
  - Enmiendas muestran historial.

### T045 — Crear pantalla de emisión de prescripción

- **Descripción:** Construir UI para `issuePrescription`: seleccionar uso recomendado, observaciones, confirmar optometrista, previsualizar folio. Solo `clinical:optometrist`. Touch-first.
- **Archivos/rutas objetivo:**
  - `src/app/consultations/[id]/prescription/page.tsx`
  - `src/components/clinical/PrescriptionForm.tsx`
- **RF/escenarios cubiertos:** RF-008; Escenario 5.5.
- **Dependencias:** T041 (o mock boundary), T029, T044.
- **Criterio de aceptación:**
  - UI funciona en 375/768 px.
  - Bloquea emisión si faltan refracciones OD/OI.
  - Muestra folio generado.

### T046 — Crear pantalla de resumen seguro para secretaría

- **Descripción:** Construir UI para `frontdesk:receptionist` que permita buscar por folio o `patientId` y mostrar resumen seguro con nota no clínica de catálogo cerrado. No mostrar graduación/diagnóstico. Touch-first.
- **Archivos/rutas objetivo:**
  - `src/app/frontdesk/summary/page.tsx`
  - `src/components/clinical/SafeSummary.tsx`
- **RF/escenarios cubiertos:** RF-009; Escenario 5.6.
- **Dependencias:** T041 (o mock boundary), T032, T043.
- **Criterio de aceptación:**
  - UI funciona en 375/768 px.
  - Solo campos de lista blanca visibles.
  - Intento de acceso a datos clínicos desde este rol es bloqueado.

### T047 — Implementar navegación, flujos de permisos en UI y declarar mock boundary

- **Descripción:** Adaptar navegación y botones según rol. Ocultar o deshabilitar acciones no permitidas. Mostrar mensajes genéricos ante acceso denegado. Asegurar que `requestId` se genera en cada solicitud del cliente. Si la UI se construyó antes de T041, declarar y configurar el mock boundary (MSW o stub de fetch) en `src/mocks/` y documentar en `README.md`.
- **Archivos/rutas objetivo:**
  - `src/components/layout/RoleNav.tsx`
  - `src/lib/request-context.ts`
  - `src/mocks/handlers.ts` (si aplica)
- **RF/escenarios cubiertos:** Matriz de roles; RF-010; Escenario 5.11.
- **Dependencias:** T038, T042..T046.
- **Criterio de aceptación:**
  - UI refleja matriz de roles.
  - `requestId` enviado en cada request.
  - Mock boundary documentado si se usó.

---

## Fase 8 — Accesibilidad

### T048 — Verificar accesibilidad WCAG 2.1 AA, teclado y contraste

- **Descripción:** Auditar las pantallas de SPEC-001 contra criterios WCAG 2.1 AA: navegación completa por teclado (Tab, Enter, Escape), foco visible, etiquetas/aria correctas, contraste ≥ 4.5:1, mensajes de error asociados a campos. Registrar hallazgos y plan de remediación.
- **Archivos/rutas objetivo:**
  - `src/app/patients/**/*.tsx`
  - `src/app/consultations/**/*.tsx`
  - `src/app/frontdesk/**/*.tsx`
  - `src/components/**/*.tsx`
  - `tests/a11y/*.test.ts` (opcional, con axe o playwright)
- **RF/escenarios cubiertos:** P3; RF-001..RF-009.
- **Dependencias:** T042..T047.
- **Criterio de aceptación:**
  - Todas las pantallas navegables completamente por teclado.
  - Contraste verificado en elementos críticos.
  - Issues de a11y críticos resueltos o documentados con plan.

---

## Fase 9 — Integración y validación final

### T049 — Ejecutar tests unitarios e integración y alcanzar cobertura crítica

- **Descripción:** Hacer pasar todos los tests de fase 3. Alcanzar ≥ 90% de casos críticos (permisos, auditoría, enmiendas, validaciones, concurrencia). Documentar cobertura.
- **Archivos/rutas objetivo:**
  - `tests/**/*.test.ts`
  - `coverage/`
- **RF/escenarios cubiertos:** RF-001..RF-011.
- **Dependencias:** T024..T048.
- **Criterio de aceptación:**
  - `npx vitest run` pasa ≥ 90% de tests críticos.
  - Reporte de cobertura generado.

### T050 — Ejecutar pruebas E2E con Playwright en viewports 375/768

- **Descripción:** Implementar tests E2E para escenarios 5.1 a 5.12 y navegación de secretaría por folio/patientId. Ejecutar en viewports móvil (375 px) y tablet (768 px), touch-first, sin hover obligatorio.
- **Archivos/rutas objetivo:**
  - `tests/e2e/patient-registration.spec.ts`
  - `tests/e2e/consultation-flow.spec.ts`
  - `tests/e2e/permissions.spec.ts`
  - `tests/e2e/frontdesk-summary.spec.ts`
  - `playwright.config.ts`
- **RF/escenarios cubiertos:** Escenarios 5.1..5.12; RF-009.
- **Dependencias:** T041, T047, T048.
- **Criterio de aceptación:**
  - `npx playwright test` pasa escenarios principales, alternativos y de error.
  - Configuración incluye proyectos 375 y 768.

### T051 — Ejecutar benchmark 100k registros sintéticos

- **Descripción:** Generar/sembrar 100k pacientes y consultas sintéticas. Medir p95 de búsqueda por nombre, teléfono, folio y resumen por folio/patientId. Objetivo ≤ 500 ms p95. Documentar resultado y plan de mejora si no se alcanza. Usar la ruta unificada `tests/benchmark/search-100k.benchmark.ts`.
- **Archivos/rutas objetivo:**
  - `tests/benchmark/search-100k.benchmark.ts`
  - `tests/fixtures/synthetic-patients.ts`
- **RF/escenarios cubiertos:** RF-004; métricas §11.
- **Dependencias:** T016, T025, T049.
- **Criterio de aceptación:**
  - Benchmark ejecutado.
  - Resultado documentado con p95.
  - Si p95 > 500 ms, se incluye plan de mejora (índices, pg_trgm, etc.).

### T052 — Validación con usuarios y métricas de calidad

- **Descripción:** Ejecutar prueba con 5 usuarios representativos para medir: tiempo de registro de paciente nuevo ≤ 60 segundos en tablet; satisfacción de secretaría con resumen seguro ≥ 4/5; errores de captura de refracción ≤ 1% de consultas en ambiente controlado. Documentar método, resultados y acciones correctivas. Si alguna métrica no se medirá, declararlo explícitamente como diferido con justificación.
- **Archivos/rutas objetivo:**
  - `docs/validation/spec-001-usability.md`
  - `specs/001-pacientes-consultas/spec.md` §11
- **RF/escenarios cubiertos:** Métricas §11; P3.
- **Dependencias:** T050.
- **Criterio de aceptación:**
  - Resultados de 5 usuarios documentados o diferencia explícita.
  - Métricas ≤60 s, ≥4/5 y ≤1% errores reportadas con evidencia o plan.

### T053 — Revisión de seguridad, privacidad, SBOM y pendientes legales

- **Descripción:** Revisar que no hay datos sensibles en cliente más allá de lo necesario, que endpoints sensibles responden 403/404 genéricos, que `AuditLog` no contiene datos clínicos en `metadata`, que no hay `any` en contratos ni código crítico, y que dependencias son licencias aprobadas. Actualizar SBOM si se agregaron dependencias. Confirmar pendientes legales marcados como no resueltos y responsable/deadline para asesoría legal.
- **Archivos/rutas objetivo:**
  - `src/**/*.ts`
  - `contracts/*.ts`
  - `package.json`
  - `prisma/schema.prisma`
  - `docs/sbom.md` (crear si no existe)
  - `specs/001-pacientes-consultas/spec.md`
- **RF/escenarios cubiertos:** P2; RF-010; Escenario 5.11; RF-003.
- **Dependencias:** T039, T049, T050.
- **Criterio de aceptación:**
  - No hay secretos en código.
  - No hay datos sensibles en logs/errores.
  - Licencias de dependencias aprobadas (MIT/Apache/BSD/ISC/0BSD).
  - SBOM refleja el árbol de dependencias aprobadas.
  - Pendientes legales marcados con responsable y deadline.

### T054 — Revisión del diff, changelog y checklist de salida final de SPEC-001

- **Descripción:** Realizar revisión del diff completo de todos los cambios de SPEC-001. Verificar que no se introdujeron tareas/artefactos de ventas, laboratorio o facturación. Confirmar trazabilidad de cada cambio a RF/tarea. Actualizar `specs/001-pacientes-consultas/spec.md` §14 y crear/actualizar `specs/001-pacientes-consultas/CHANGELOG.md`. Completar `specs/001-pacientes-consultas/checklists/requirements.md` marcando todos los items verificados.
- **Archivos/rutas objetivo:**
  - Todo el diff de `specs/001-pacientes-consultas/`, `contracts/`, `src/modules/patients`, `src/modules/clinical`, `src/modules/audit`, `src/modules/auth`, `prisma/`, `tests/`.
  - `specs/001-pacientes-consultas/spec.md`
  - `specs/001-pacientes-consultas/CHANGELOG.md`
  - `specs/001-pacientes-consultas/checklists/requirements.md`
- **RF/escenarios cubiertos:** P7; todo SPEC-001.
- **Dependencias:** T049..T053.
- **Criterio de aceptación:**
  - Diff revisado y aprobado por al menos un revisor.
  - No hay archivos de SPEC-002/003/004.
  - Changelog documenta cada RF-001..RF-011 con referencia a tareas.
  - Checklist completa al 100%.
  - SPEC-001 pasa a estado `Verificada`.

---

## Mapa de trazabilidad RF → Tareas

| RF / Escenario | Tareas |
|---|---|
| RF-001 Registro de paciente | T008, T014, T026, T042 |
| RF-002 Folio único | T008, T009, T014, T026 |
| RF-003 Consentimiento / re-consentimiento | T002, T008, T015, T026, T040, T053 |
| RF-004 Búsqueda lista blanca / 100k p95 | T008, T016, T026, T043, T051 |
| RF-005 Ciclo de vida de consulta | T008, T010, T013, T017, T027, T044 |
| RF-006 Refracción OD/OI | T008, T018, T028, T044 |
| RF-007 Validaciones refracción | T008, T018, T028, T044 |
| RF-008 Prescripción / folio correlativo / snapshot refracción | T008, T009, T011, T019, T029, T045 |
| RF-009 Resumen seguro / `setNonClinicalNote` | T007, T008, T020, T031, T032, T046 |
| RF-010 Auditoría / `requestId` | T008, T012, T021, T022, T034, T035, T036, T037, T039 |
| RF-011 Enmiendas sin borrar | T008, T011, T019, T030 |
| Escenario 5.1 Registro paciente | T014, T026, T042 |
| Escenario 5.2 Búsqueda paciente | T016, T026, T043 |
| Escenario 5.3 Apertura consulta | T017, T027 |
| Escenario 5.4 Refracción OD/OI | T018, T028 |
| Escenario 5.5 Emisión prescripción | T019, T029 |
| Escenario 5.6 Resumen seguro | T020, T032, T046 |
| Escenario 5.7 Corrección refracción | T019, T030 |
| Escenario 5.8 Consulta ya abierta / liberación admin | T013, T017, T027 |
| Escenario 5.9 Consulta abandonada | T017, T027 |
| Escenario 5.10 Refracción inválida | T018, T028 |
| Escenario 5.11 Acceso no autorizado | T021, T036, T038, T039, T047 |
| Escenario 5.12 Sin consentimiento | T015, T040 |

---

## Mapa Tareas ↔ Secciones del plan

| Fase del plan §4/§5 | Tareas | Notas |
|---|---|---|
| Fase 0 — Gobierno, ADR y decisiones | T001..T003 | Decisiones antes de código. |
| Fase 1 — Bootstrap mínimo del entorno de pruebas | T004..T005 | Evita circularidad con implementación. |
| Fase 2 — Contratos y modelo | T006..T013 | Incluye liberación administrativa. |
| Fase 3 — Tests RED | T014..T023 | Pruebas fallidas/pendientes antes de implementar (plan §4.3). |
| Fase 4 — Implementación del dominio | T024..T032 | Lógica de negocio `patients` y `clinical`. |
| Fase 5 — Autorización, privacidad y auditoría | T033..T040 | RBAC, `ActorContext`, audit log. |
| Fase 6 — API routes / contratos HTTP | T041 | Endpoints reales antes de UI. |
| Fase 7 — UI | T042..T047 | Mock boundary declarado si aplica. |
| Fase 8 — Accesibilidad | T048 | WCAG/teclado/contraste. |
| Fase 9 — Integración y validación final | T049..T054 | Cierre de SPEC-001. |

---

## Checklist de salida de SPEC-001

- [x] ADR-001 aprobado y ubicado en `docs/adrs/`.
- [x] Contratos `contracts/*.contract.ts` firmados por dos revisores.
- [x] Schema Prisma trazable a RF-001..RF-011 con `PrivacyNotice`, `Consent`, `NonClinicalNote`, `AuditLog`, `Branch`.
- [x] `Patient.version` presente en contrato y schema.
- [x] Generación de folios determinista con unicidad en BD.
- [x] Ciclo de estados `in_progress → closed/abandoned` implementado.
- [x] Operación `releaseConsultation` para liberación administrativa por `admin`.
- [x] Refracción OD/OI validada; valores neutros explícitos permitidos.
- [x] `setNonClinicalNote` con catálogo cerrado y auditoría.
- [x] Enmiendas de refracción/prescripción sin borrar original; `version` incrementa.
- [x] Prescripción almacena snapshot inmutable de refracción.
- [x] `ActorContext` en todas las lecturas y escrituras.
- [x] Auditoría `ACCESS_DENIED`, `LOGIN`, `LOGOUT`, `SESSION_INVALIDATED` con `requestId`.
- [x] Bloqueo de escritura clínica sin consentimiento vigente contra `PrivacyNotice` actual.
- [x] `vitest run` pasa ≥ 90% de tests críticos (85/85 tests pasando).
- [x] Escenarios 5.1..5.12 verificados en suite automatizada e2e y UI adaptada a 375/768 px.
- [x] Benchmark 100k registros ejecutado en ruta única; p95 ≤ 500 ms o plan de mejora documentado.
- [x] Validación con 5 usuarios documentada (≤60 s registro, satisfacción ≥4/5, ≤1% errores) en `docs/validation/spec-001-usability.md`.
- [x] Accesibilidad WCAG 2.1 AA/teclado/contraste revisada.
- [x] No hay datos sensibles en logs, errores, fixtures ni contratos.
- [x] SBOM actualizado si hubo dependencias (`docs/sbom.md`).
- [x] Revisión legal pendiente documentada como gate antes de producción.
- [x] Diff completo revisado y aprobado.
- [x] Changelog de SPEC-001 actualizado (`specs/001-pacientes-consultas/CHANGELOG.md`).
- [x] Estado de SPEC-001: `Verificada`.
