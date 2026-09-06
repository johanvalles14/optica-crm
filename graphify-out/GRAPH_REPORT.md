# Graph Report - optica-crm  (2026-09-06)

## Corpus Check
- 125 files · ~55,645 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 961 nodes · 1862 edges · 61 communities (50 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- ActorContext
- TASKS-002 — Tareas de Implementación de SPEC-002
- auth.contract.ts
- SPEC-001 — Pacientes y Consultas Optométricas
- patients.contract.ts
- actors.ts
- Research — Óptica CRM
- compilerOptions
- scripts
- 4. Fases
- 1. Entidades principales
- ADR-001: Decisión de stack tecnológico para Óptica CRM
- 2. Principios no negociables
- Checklist de requisitos — SPEC-001 Pacientes y Consultas Optométricas
- TASKS-001 — Tareas de implementación de SPEC-001
- ADR-001 — Stack de SPEC-001
- Quickstart — Planificación y validación de SPEC-001
- Fase 3 — Tests RED
- devDependencies
- Fase 4 — Implementación del dominio
- Fase 2 — Contratos y modelo
- Fase 5 — Autorización, privacidad y auditoría
- Fase 7 — UI
- Fase 9 — Integración y validación final
- Contratos de SPEC-001
- Fase 0 — Gobierno, ADR y decisiones
- fixtures/README.md
- clinical/service.ts
- seed.ts
- actorFromRequest
- search/page.tsx
- next.config.mjs
- next-env.d.ts
- sales.contract.ts
- SPEC-002 — Ventas, Inventario Práctico y Ticket Óptico
- 3. Fases de Ejecución
- dependencies
- Despliegue de Óptica CRM
- 2. Entidades del Dominio de Ventas (POS)
- Changelog — SPEC-001 Pacientes y Consultas Optométricas
- BranchId
- Software Bill of Materials (SBOM) — Óptica CRM
- Validación de Usabilidad y Métricas de Calidad — SPEC-001
- [id]/page.tsx
- summary/page.tsx
- prescription/page.tsx
- package.json
- Checklist de Requisitos — SPEC-002 Ventas e Inventario Práctico
- overrides
- pos/page.tsx
- intake/page.tsx
- products/page.tsx
- orders/page.tsx
- typescript

## God Nodes (most connected - your core abstractions)
1. `ActorContext` - 91 edges
2. `authorize()` - 38 edges
3. `actorFromRequest()` - 35 edges
4. `BranchId` - 31 edges
5. `PatientId` - 30 edges
6. `UserId` - 27 edges
7. `ClinicalService` - 27 edges
8. `PatientRepository` - 25 edges
9. `ClinicalRepository` - 23 edges
10. `compilerOptions` - 23 edges

## Surprising Connections (you probably didn't know these)
- `AuditEntry` --references--> `UserId`  [EXTRACTED]
  src/modules/audit/types.ts → contracts/auth.contract.ts
- `AuditRecordInput` --references--> `UserId`  [EXTRACTED]
  src/modules/audit/types.ts → contracts/auth.contract.ts
- `ClinicalService` --implements--> `IClinicalService`  [EXTRACTED]
  src/modules/clinical/service.ts → contracts/clinical.contract.ts
- `InventoryService` --implements--> `IInventoryService`  [EXTRACTED]
  src/modules/inventory/service.ts → contracts/inventory.contract.ts
- `Branch` --references--> `BranchId`  [EXTRACTED]
  src/modules/patients/repository.ts → contracts/patients.contract.ts

## Import Cycles
- None detected.

## Communities (61 total, 11 thin omitted)

### Community 0 - "ActorContext"
Cohesion: 0.09
Nodes (5): ActorContext, IClinicalService, IInventoryService, IPatientService, ISalesService

### Community 1 - "TASKS-002 — Tareas de Implementación de SPEC-002"
Cohesion: 0.07
Nodes (28): Fase 0 — Gobierno, Contratos y Esquema, Fase 1 — Suite de Pruebas RED (TDD), Fase 2 — Implementación del Dominio de Inventario, Fase 3 — Implementación del Dominio de Ventas (POS), Fase 4 — API Routes HTTP, Fase 5 — Pantallas e Interfaces de Usuario, Fase 6 — Integración, Pruebas y Cierre, T101 — Validar y ratificar contratos `inventory` y `sales` (+20 more)

### Community 2 - "auth.contract.ts"
Cohesion: 0.08
Nodes (20): AuthAction, AuthAuditEntry, IAuthService, RequestId, Role, Session, SessionToken, UserIdentity (+12 more)

### Community 3 - "SPEC-001 — Pacientes y Consultas Optométricas"
Cohesion: 0.04
Nodes (44): 10. Estrategia de pruebas, 11. Criterios de éxito medibles, 12. Supuestos, fuera de alcance y riesgos, 13. Decisiones de reutilización y licencias, 14. Historial de cambios, 1. Resumen ejecutivo, 2. Objetivo y problema, 3. Alcance (+36 more)

### Community 4 - "patients.contract.ts"
Cohesion: 0.06
Nodes (39): UserId, Consent, ConsentId, ConsentInput, EmergencyContact, Folio, Patient, PatientId (+31 more)

### Community 5 - "actors.ts"
Cohesion: 0.11
Nodes (20): admin(), assistant(), extractUserSuffix(), inventoryManager(), optometrist(), receptionist(), makePatientInput(), additionOutOfRange (+12 more)

### Community 6 - "Research — Óptica CRM"
Cohesion: 0.06
Nodes (34): 1. Hallazgo Principal, 2.1 Sistemas de Historial Clínico Electrónico (EHR/EMR), 2.2 Sistemas de Gestión Óptica Específicos, 2.3 Plataformas de Retail / E-commerce, 2.4 Librerías de Facturación Electrónica (CFDI), 2.5 Librerías de Infraestructura, 2. Catálogo de Soluciones Evaluadas, 3.1 Marco de Decisión (+26 more)

### Community 7 - "compilerOptions"
Cohesion: 0.05
Nodes (40): contracts/**/*, coverage, dist, DOM, DOM.Iterable, ES2022, .next, .next/types/**/*.ts (+32 more)

### Community 8 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, db:generate, db:migrate, db:seed, db:validate, dev, lint (+6 more)

### Community 9 - "4. Fases"
Cohesion: 0.08
Nodes (23): 1. Resumen, 2. Stack propuesto (ADR pendiente), 3. Constitution check, 4. Fases, 5. Tareas ordenadas resumidas (todo el plan), 6. Seguridad, privacidad y auditoría, 7. Riesgos y mitigaciones, 8. Criterios de salida del plan (+15 more)

### Community 10 - "1. Entidades principales"
Cohesion: 0.09
Nodes (21): 1.10 Branch (Sucursal), 1.1 Patient (Paciente), 1.2 PrivacyNotice (Aviso de privacidad), 1.3 Consent (Consentimiento), 1.4 Consultation (Consulta), 1.5 Refraction (Refracción), 1.6 Prescription (Prescripción), 1.7 NonClinicalNote (Catálogo cerrado de notas no clínicas) (+13 more)

### Community 11 - "ADR-001: Decisión de stack tecnológico para Óptica CRM"
Cohesion: 0.11
Nodes (17): ADR-001: Decisión de stack tecnológico para Óptica CRM, Alternativas consideradas, Autenticación, Base de datos, Consecuencias negativas, Consecuencias positivas, Contexto, Decisión (+9 more)

### Community 12 - "2. Principios no negociables"
Cohesion: 0.14
Nodes (13): 1. Propósito y alcance, 2. Principios no negociables, 3. Dominios iniciales, 4. Gobierno de cada spec, 5. Revisión legal y de seguridad, Constitución del Proyecto — Óptica CRM, P1 — Expediente clínico íntegro y auditable, P2 — Privacidad y minimización (+5 more)

### Community 13 - "Checklist de requisitos — SPEC-001 Pacientes y Consultas Optométricas"
Cohesion: 0.14
Nodes (13): Auditoría y permisos, Checklist de requisitos — SPEC-001 Pacientes y Consultas Optométricas, Consentimiento, Consulta, Derechos ARCO y dependencias, Escenarios alternativos y error, Fase 0 — Gobierno, No funcionales y experiencia (+5 more)

### Community 14 - "TASKS-001 — Tareas de implementación de SPEC-001"
Cohesion: 0.15
Nodes (12): Checklist de salida de SPEC-001, Convenciones, Fase 1 — Bootstrap mínimo del entorno de pruebas, Fase 6 — API routes / contratos HTTP, Fase 8 — Accesibilidad, Mapa de trazabilidad RF → Tareas, Mapa Tareas ↔ Secciones del plan, T004 — Crear bootstrap mínimo de `package.json`, `tsconfig.json` y `vitest.config.ts` (+4 more)

### Community 15 - "ADR-001 — Stack de SPEC-001"
Cohesion: 0.17
Nodes (11): ADR-001 — Stack de SPEC-001, Alternativas consideradas, Aprobación, Consecuencias, Contexto, Decisión, Licencias y seguridad, Negativas (+3 more)

### Community 16 - "Quickstart — Planificación y validación de SPEC-001"
Cohesion: 0.18
Nodes (10): 1. Antes de empezar, 2. Estructura esperada del feature, 3. Comandos futuros (pendientes), 4. Checklist de validación manual, 5. Checklist de cierre de SPEC-001, 6. Notas importantes, Configuración de base de datos, Ejecución de pruebas (+2 more)

### Community 17 - "Fase 3 — Tests RED"
Cohesion: 0.18
Nodes (11): Fase 3 — Tests RED, T014 — Escribir tests RED para registro de paciente y folio (RF-001, RF-002), T015 — Escribir tests RED para consentimiento, re-consentimiento y `PrivacyNotice` (RF-003), T016 — Escribir tests RED para búsqueda con lista blanca y benchmark 100k unificado (RF-004), T017 — Escribir tests RED para ciclo de vida de consulta (RF-005), T018 — Escribir tests RED para refracción OD/OI y validaciones (RF-006, RF-007), T019 — Escribir tests RED para prescripción, snapshot de refracción y enmiendas (RF-008, RF-011), T020 — Escribir tests RED para resumen seguro y `setNonClinicalNote` (RF-009) (+3 more)

### Community 18 - "devDependencies"
Cohesion: 0.11
Nodes (19): magicast, devDependencies, magicast, prisma, tsx, @types/node, @types/react, @types/react-dom (+11 more)

### Community 19 - "Fase 4 — Implementación del dominio"
Cohesion: 0.20
Nodes (10): Fase 4 — Implementación del dominio, T024 — Configurar proyecto base según ADR-001, T025 — Crear migración inicial y seed sintético, T026 — Implementar módulo `patients` (casos de uso), T027 — Implementar módulo `clinical` — apertura, estados y liberación, T028 — Implementar refracción OD/OI con validaciones, T029 — Implementar prescripción, folio correlativo y snapshot de refracción, T030 — Implementar enmiendas de refracción y prescripción (+2 more)

### Community 20 - "Fase 2 — Contratos y modelo"
Cohesion: 0.22
Nodes (9): Fase 2 — Contratos y modelo, T006 — Firmar contratos compartidos en `contracts/`, T007 — Completar `SetNonClinicalNoteInput` y operación en contrato clinical, T008 — Convertir `data-model.md` en schema Prisma físico inicial, T009 — Diseñar generación de folios determinista con unicidad en BD, T010 — Modelar ciclo de estados de consulta y transiciones permitidas, T011 — Modelar enmiendas de refracción y prescripción sin borrar original, T012 — Definir esquema de `AuditLog` con `requestId` y acciones extendidas (+1 more)

### Community 21 - "Fase 5 — Autorización, privacidad y auditoría"
Cohesion: 0.22
Nodes (9): Fase 5 — Autorización, privacidad y auditoría, T033 — Implementar adaptador stub del módulo `auth`, T034 — Propagar `ActorContext` en todas las lecturas y escrituras, T035 — Implementar capa de auditoría con `requestId`, T036 — Registrar `ACCESS_DENIED` en intentos no autorizados, T037 — Registrar eventos de sesión `LOGIN`, `LOGOUT`, `SESSION_INVALIDATED`, T038 — Implementar autorización basada en roles (RBAC) en dominio, T039 — Garantizar que datos sensibles no aparezcan en logs ni errores (+1 more)

### Community 22 - "Fase 7 — UI"
Cohesion: 0.29
Nodes (7): Fase 7 — UI, T042 — Crear pantalla de registro de paciente (viewport 375/768), T043 — Crear pantalla de búsqueda de paciente, T044 — Crear pantalla de detalle de consulta (refracción OD/OI), T045 — Crear pantalla de emisión de prescripción, T046 — Crear pantalla de resumen seguro para secretaría, T047 — Implementar navegación, flujos de permisos en UI y declarar mock boundary

### Community 23 - "Fase 9 — Integración y validación final"
Cohesion: 0.29
Nodes (7): Fase 9 — Integración y validación final, T049 — Ejecutar tests unitarios e integración y alcanzar cobertura crítica, T050 — Ejecutar pruebas E2E con Playwright en viewports 375/768, T051 — Ejecutar benchmark 100k registros sintéticos, T052 — Validación con usuarios y métricas de calidad, T053 — Revisión de seguridad, privacidad, SBOM y pendientes legales, T054 — Revisión del diff, changelog y checklist de salida final de SPEC-001

### Community 24 - "Contratos de SPEC-001"
Cohesion: 0.40
Nodes (4): Archivos, Contratos de SPEC-001, Reglas, Uso previsto

### Community 25 - "Fase 0 — Gobierno, ADR y decisiones"
Cohesion: 0.50
Nodes (4): Fase 0 — Gobierno, ADR y decisiones, T001 — Redactar y aprobar ADR-001 (stack de SPEC-001), T002 — Documentar revisión legal pendiente y riesgos regulatorios, T003 — Validar matriz de roles y permisos contra la Constitución

### Community 29 - "clinical/service.ts"
Cohesion: 0.06
Nodes (45): AbandonConsultationInput, Consultation, ConsultationId, ConsultationStatus, ConsultationSummary, Eye, FullConsultation, IssuePrescriptionInput (+37 more)

### Community 30 - "seed.ts"
Cohesion: 0.40
Nodes (3): notes, prisma, users

### Community 32 - "actorFromRequest"
Cohesion: 0.10
Nodes (35): LensUsage, MovementReason, PATCH(), RouteContext, PATCH(), POST(), RouteContext, PATCH() (+27 more)

### Community 38 - "sales.contract.ts"
Cohesion: 0.12
Nodes (21): PrescriptionId, CreateSaleOrderInput, LensConfiguration, OrderStatus, PaymentId, PaymentMethod, PaymentRecord, RecordPaymentInput (+13 more)

### Community 39 - "SPEC-002 — Ventas, Inventario Práctico y Ticket Óptico"
Cohesion: 0.12
Nodes (16): 1. Resumen ejecutivo, 2. Objetivo y problema, 3. Alcance, 4. Actores y Matriz de Permisos, 5.1 Alta Rápida de Embarque Desordenado (Fast-Intake), 5.2 Venta con Prescripción y Anticipo, 5.3 Baja por Rotura en Exhibición / Taller (Merma), 5.4 Reconciliación Rápida por Escaneo Ciego (+8 more)

### Community 40 - "3. Fases de Ejecución"
Cohesion: 0.17
Nodes (11): 1. Resumen, 2. Decisiones Arquitectónicas (ADR-002 propuesto), 3. Fases de Ejecución, Fase 0 — Contratos y Modelo, Fase 1 — Suite de Pruebas RED, Fase 2 — Implementación del Dominio de Inventario, Fase 3 — Implementación del Dominio de Ventas (POS), Fase 4 — API Routes HTTP (+3 more)

### Community 41 - "dependencies"
Cohesion: 0.18
Nodes (11): next, dependencies, next, @prisma/client, react, react-dom, zod, @prisma/client (+3 more)

### Community 42 - "Despliegue de Óptica CRM"
Cohesion: 0.22
Nodes (8): Actualizaciones, Backups locales, Despliegue de Óptica CRM, Estado actual, Instalación local, Modelos comerciales, Requisitos mínimos sugeridos para servidor local, Servicio cloud

### Community 43 - "2. Entidades del Dominio de Ventas (POS)"
Cohesion: 0.22
Nodes (8): 1.1 `Product` (Catálogo y Stock), 1.2 `InventoryMovement` (Historial Inmutable de Stock), 1. Entidades del Dominio de Inventario, 2.1 `SaleOrder` (Orden de Venta / Cotización), 2.2 `SaleOrderItem` (Partidas de la Venta), 2.3 `Payment` (Registro de Pagos y Anticipos), 2. Entidades del Dominio de Ventas (POS), Modelo de Datos — SPEC-002 Ventas e Inventario Práctico

### Community 44 - "Changelog — SPEC-001 Pacientes y Consultas Optométricas"
Cohesion: 0.33
Nodes (5): [1.0.0] — 2026-09-04 — LÍNEA BASE DE DOMINIO Y MODELO, [1.1.0] — 2026-09-06 — CIERRE Y VERIFICACIÓN COMPLETA, Añadido, Añadido, Changelog — SPEC-001 Pacientes y Consultas Optométricas

### Community 45 - "BranchId"
Cohesion: 0.12
Nodes (18): InventoryAdjustmentInput, InventoryMovement, MovementId, Product, ProductCategory, ProductCode, ProductId, ProductSearchQuery (+10 more)

### Community 46 - "Software Bill of Materials (SBOM) — Óptica CRM"
Cohesion: 0.40
Nodes (4): 1. Dependencias de Producción (Runtime), 2. Dependencias de Desarrollo (Build & Test), 3. Verificación de Riesgo Copyleft, Software Bill of Materials (SBOM) — Óptica CRM

### Community 47 - "Validación de Usabilidad y Métricas de Calidad — SPEC-001"
Cohesion: 0.50
Nodes (3): 1. Métricas Objetivo vs. Resultados Verificados, 2. Accesibilidad y Ergonomía Táctil (WCAG 2.1 AA), Validación de Usabilidad y Métricas de Calidad — SPEC-001

### Community 53 - "package.json"
Cohesion: 0.25
Nodes (7): description, engines, node, name, private, type, version

### Community 54 - "Checklist de Requisitos — SPEC-002 Ventas e Inventario Práctico"
Cohesion: 0.40
Nodes (4): Checklist de Requisitos — SPEC-002 Ventas e Inventario Práctico, Inventario Adaptativo y Alta Rápida, Punto de Venta (POS) y Lentes, Tickets y Seguridad

### Community 55 - "overrides"
Cohesion: 0.50
Nodes (4): overrides, deepmerge-ts, effect, postcss

### Community 56 - "pos/page.tsx"
Cohesion: 0.60
Nodes (4): LENS_MATERIALS, PosPage(), Product, TREATMENTS

## Knowledge Gaps
- **402 isolated node(s):** `ConsentId`, `EmergencyContact`, `SaleOrderFolio`, `LensConfiguration`, `nextConfig` (+397 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ActorContext` connect `ActorContext` to `actorFromRequest`, `auth.contract.ts`, `patients.contract.ts`, `actors.ts`, `sales.contract.ts`, `BranchId`, `clinical/service.ts`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `UserId` connect `patients.contract.ts` to `auth.contract.ts`, `BranchId`, `clinical/service.ts`, `sales.contract.ts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `BranchId` connect `BranchId` to `ActorContext`, `patients.contract.ts`, `clinical/service.ts`, `sales.contract.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `ConsentId`, `EmergencyContact`, `SaleOrderFolio` to the rest of the system?**
  _402 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ActorContext` be split into smaller, more focused modules?**
  _Cohesion score 0.08974358974358974 - nodes in this community are weakly interconnected._
- **Should `TASKS-002 — Tareas de Implementación de SPEC-002` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `auth.contract.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08484848484848485 - nodes in this community are weakly interconnected._