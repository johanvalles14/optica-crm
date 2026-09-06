# Graph Report - optica-crm  (2026-09-04)

## Corpus Check
- 62 files · ~34,297 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 628 nodes · 1166 edges · 31 communities (30 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- clinical/repository.ts
- patients/service.ts
- auth.contract.ts
- SPEC-001 — Pacientes y Consultas Optométricas
- ActorContext
- clinical/service.ts
- Research — Óptica CRM
- compilerOptions
- package.json
- 4. Fases
- 1. Entidades principales
- ADR-001: Decisión de stack tecnológico para Óptica CRM
- 2. Principios no negociables
- Checklist de requisitos — SPEC-001 Pacientes y Consultas Optométricas
- TASKS-001 — Tareas de implementación de SPEC-001
- ADR-001 — Stack de SPEC-001
- Quickstart — Planificación y validación de SPEC-001
- Fase 3 — Tests RED
- prescription.service.ts
- Fase 4 — Implementación del dominio
- Fase 2 — Contratos y modelo
- Fase 5 — Autorización, privacidad y auditoría
- Fase 7 — UI
- Fase 9 — Integración y validación final
- Contratos de SPEC-001
- Fase 0 — Gobierno, ADR y decisiones
- fixtures/README.md
- refraction.service.ts
- seed.ts

## God Nodes (most connected - your core abstractions)
1. `ActorContext` - 60 edges
2. `authorize()` - 29 edges
3. `ClinicalService` - 26 edges
4. `PatientId` - 24 edges
5. `ClinicalRepository` - 23 edges
6. `PatientRepository` - 22 edges
7. `UserId` - 19 edges
8. `Consultation` - 18 edges
9. `compilerOptions` - 18 edges
10. `IClinicalService` - 17 edges

## Surprising Connections (you probably didn't know these)
- `ClinicalService` --implements--> `IClinicalService`  [EXTRACTED]
  src/modules/clinical/service.ts → contracts/clinical.contract.ts
- `Branch` --references--> `BranchId`  [EXTRACTED]
  src/modules/patients/repository.ts → contracts/patients.contract.ts
- `PatientService` --implements--> `IPatientService`  [EXTRACTED]
  src/modules/patients/service.ts → contracts/patients.contract.ts
- `AuditEntry` --references--> `UserId`  [EXTRACTED]
  src/modules/audit/types.ts → contracts/auth.contract.ts
- `AuditRecordInput` --references--> `UserId`  [EXTRACTED]
  src/modules/audit/types.ts → contracts/auth.contract.ts

## Import Cycles
- None detected.

## Communities (31 total, 1 thin omitted)

### Community 0 - "clinical/repository.ts"
Cohesion: 0.11
Nodes (10): Consultation, ConsultationId, Eye, PrescriptionId, Refraction, RefractionId, BranchId, ClinicalRepository (+2 more)

### Community 1 - "patients/service.ts"
Cohesion: 0.08
Nodes (29): Consent, ConsentId, ConsentInput, EmergencyContact, Patient, PatientId, PatientInput, PatientSearchQuery (+21 more)

### Community 2 - "auth.contract.ts"
Cohesion: 0.09
Nodes (21): AuthAction, AuthAuditEntry, IAuthService, RequestId, Role, Session, SessionToken, UserId (+13 more)

### Community 3 - "SPEC-001 — Pacientes y Consultas Optométricas"
Cohesion: 0.04
Nodes (44): 10. Estrategia de pruebas, 11. Criterios de éxito medibles, 12. Supuestos, fuera de alcance y riesgos, 13. Decisiones de reutilización y licencias, 14. Historial de cambios, 1. Resumen ejecutivo, 2. Objetivo y problema, 3. Alcance (+36 more)

### Community 4 - "ActorContext"
Cohesion: 0.15
Nodes (3): ActorContext, IClinicalService, IPatientService

### Community 5 - "clinical/service.ts"
Cohesion: 0.09
Nodes (27): AbandonConsultationInput, ConsultationSummary, FullConsultation, LensUsage, NonClinicalNote, NonClinicalNoteKey, OpenConsultationInput, ReleaseConsultationInput (+19 more)

### Community 6 - "Research — Óptica CRM"
Cohesion: 0.06
Nodes (34): 1. Hallazgo Principal, 2.1 Sistemas de Historial Clínico Electrónico (EHR/EMR), 2.2 Sistemas de Gestión Óptica Específicos, 2.3 Plataformas de Retail / E-commerce, 2.4 Librerías de Facturación Electrónica (CFDI), 2.5 Librerías de Infraestructura, 2. Catálogo de Soluciones Evaluadas, 3.1 Marco de Decisión (+26 more)

### Community 7 - "compilerOptions"
Cohesion: 0.07
Nodes (29): contracts/**/*, coverage, dist, ES2022, .next, node_modules, prisma/**/*, src/**/* (+21 more)

### Community 8 - "package.json"
Cohesion: 0.05
Nodes (41): dependencies, @prisma/client, description, devDependencies, prisma, tsx, @types/node, typescript (+33 more)

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

### Community 18 - "prescription.service.ts"
Cohesion: 0.14
Nodes (13): ConsultationStatus, IssuePrescriptionInput, Prescription, PrescriptionAmendmentInput, PrescriptionService, stateMachine, toSnapshot(), ConsultationStateMachine (+5 more)

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

### Community 29 - "refraction.service.ts"
Cohesion: 0.14
Nodes (20): PrescriptionRefractionSnapshot, RefractionAmendmentInput, RefractionInput, RefractionValue, RefractionService, isQuarterStep(), isValidVisualAcuity(), validateRefraction() (+12 more)

### Community 30 - "seed.ts"
Cohesion: 0.40
Nodes (3): notes, prisma, users

## Knowledge Gaps
- **294 isolated node(s):** `ConsentId`, `EmergencyContact`, `name`, `version`, `private` (+289 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ActorContext` connect `ActorContext` to `clinical/repository.ts`, `patients/service.ts`, `auth.contract.ts`, `clinical/service.ts`, `prescription.service.ts`, `refraction.service.ts`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `PatientRepository` connect `patients/service.ts` to `clinical/repository.ts`, `prescription.service.ts`, `clinical/service.ts`, `refraction.service.ts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `TASKS-001 — Tareas de implementación de SPEC-001` connect `TASKS-001 — Tareas de implementación de SPEC-001` to `Fase 3 — Tests RED`, `Fase 4 — Implementación del dominio`, `Fase 2 — Contratos y modelo`, `Fase 5 — Autorización, privacidad y auditoría`, `Fase 7 — UI`, `Fase 9 — Integración y validación final`, `Fase 0 — Gobierno, ADR y decisiones`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `ConsentId`, `EmergencyContact`, `name` to the rest of the system?**
  _294 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `clinical/repository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `patients/service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07924984875983061 - nodes in this community are weakly interconnected._
- **Should `auth.contract.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._