# ADR-001 — Stack de SPEC-001

- **Estado:** Aprobado con excepción documentada
- **Fecha:** 2026-09-04
- **Feature:** SPEC-001 — Pacientes y Consultas Optométricas
- **Decisión:** Construir SPEC-001 como monolito modular TypeScript con Next.js, PostgreSQL y Prisma.
- **Aprobadores:** Propietario del proyecto, en los roles de arquitectura y producto/cumplimiento

## Contexto

SPEC-001 necesita registrar datos personales y clínicos sensibles, mantener trazabilidad de lecturas y escrituras, impedir sobrescritas perdidas y ofrecer una interfaz táctil para gabinete y mostrador. La solución debe respetar P1-P7 de `constitution.md`, evitar dependencias copyleft no aprobadas y permitir evolución hacia ventas, inventario y facturación en specs posteriores.

La investigación de `research.md` fundamenta las decisiones D-001..D-009. Este ADR ratifica únicamente las decisiones necesarias para SPEC-001; las decisiones de dominios futuros no quedan aprobadas por este documento.

## Decisión

| Capa | Tecnología | Motivo | Estado |
|---|---|---|---|
| Aplicación | Next.js 15, App Router | Unifica UI y API routes en TypeScript y permite validar el boundary HTTP antes de la UI | Propuesta |
| Lenguaje | TypeScript, Node.js 20+ | Tipado compartido entre contratos, dominio y endpoints | Aprobada técnicamente |
| Persistencia | PostgreSQL | Transacciones ACID, índices, constraints, JSONB y soporte para concurrencia | Propuesta |
| Acceso a datos | Prisma | Schema tipado, migraciones y acceso transaccional | Propuesta |
| Validación | Zod | Validación explícita compartida entre boundary y dominio | Propuesta |
| Auth boundary | Contrato propio; proveedor no fijado | Desacopla `patients`/`clinical` del proveedor de identidad | Aprobada |
| Pruebas unitarias/integración | Vitest | Runner TypeScript rápido y compatible con el proyecto | Propuesta |
| Pruebas E2E | Playwright | Viewports táctiles de 375 y 768 px y flujos completos | Propuesta |
| Estados | Campo `status` + máquina manual en código | El flujo de SPEC-001 es pequeño y auditable; evita dependencia adicional | Aprobada |
| Autorización | RBAC explícito en código | Los roles son finitos y la matriz es estable para SPEC-001 | Aprobada |

La implementación debe comenzar por contratos, modelo y pruebas. El schema Prisma, migraciones, seed y endpoints son prerequisitos de la UI, salvo que se declare explícitamente un mock boundary conforme al plan.

## Alternativas consideradas

| Alternativa | Decisión | Razón |
|---|---|---|
| OpenEMR | Rechazada | GPLv3 y dominio más amplio que optometría; se usa solo como referencia conceptual. D-001. |
| Medplum | Diferida | Apache-2.0 y FHIR-native, pero requiere spike de adaptación y no bloquea la línea base. D-005. |
| ERPNext | Rechazada | GPLv3 y modelo ERP genérico; no se incorpora código. D-003. |
| Medusa | Diferida | Puede evaluarse para SPEC-002, pero requiere validar versión, licencia y componentes Enterprise. D-006. |
| Casbin | Diferida | Apache-2.0, pero RBAC propio es más simple para el alcance actual; spike posterior. D-007. |
| XState | Diferida | MIT, pero el ciclo actual se cubre con transiciones manuales auditables; spike posterior. D-008. |
| Modelo propio | Elegida | Representa refracción OD/OI, prescripción, snapshots, enmiendas y privacidad sin adaptar un EHR genérico. D-001. |

Facturación no forma parte de SPEC-001. Para SPEC-004 se evaluarán FacturAPI y CfdiUtils conforme a D-002 y D-009; no se incorporan ahora.

## Licencias y seguridad

- No se incorpora código de OpenEMR, ERPNext ni repositorios sin licencia.
- Cada dependencia nueva debe registrar versión, repositorio, licencia, mantenimiento y vulnerabilidades, y actualizar el SBOM.
- Se prefieren MIT, Apache-2.0, BSD, ISC y 0BSD; GPL, LGPL, AGPL, MPL, SSPL y BUSL requieren revisión legal previa.
- Los contratos no contienen secretos, usan listas blancas y propagan `ActorContext` en lecturas y escrituras.
- `AuditLog.metadata` no puede contener graduaciones, diagnósticos, credenciales ni tokens.

## Pendiente legal: gate de producción

Antes de producción, asesoría legal y clínica mexicana debe validar:

- texto vigente del aviso de privacidad y formato de consentimiento;
- periodicidad y condiciones de re-consentimiento;
- procedimiento, plazos y acuse de derechos ARCO;
- aplicabilidad de NOM-004-SSA3-2012 y NOM-024-SSA3-2012;
- obligaciones de la LFPDPPP vigente.

Este pendiente no bloquea implementar el mecanismo técnico de consentimiento, pero sí bloquea el lanzamiento a producción. Responsable: producto con asesoría legal/clínica. Deadline sugerido: antes de la primera operación real.

## Consecuencias

### Positivas

- Un solo repositorio y boundary modular con bajo costo operativo inicial.
- Tipos compartidos y validación consistente entre dominio, API y UI.
- Persistencia preparada para constraints de unicidad y concurrencia.
- El proveedor de identidad puede cambiar sin modificar los módulos clínicos.

### Negativas

- La aplicación debe controlar cuidadosamente límites entre módulos.
- El stack no resuelve por sí mismo cumplimiento legal ni seguridad operacional.
- La migración posterior a FHIR o un motor de políticas requeriría un spike y una decisión nueva.

## Aprobación

El propietario del proyecto registró las dos aprobaciones requeridas en roles separados. Como excepción de gobierno, ambas aprobaciones corresponden a la misma persona; se recomienda una revisión independiente antes de producción.

| Revisor | Rol | Fecha | Decisión |
|---|---|---|---|
| Propietario del proyecto | Arquitectura | 2026-09-04 | Aprobado |
| Propietario del proyecto | Producto/cumplimiento | 2026-09-04 | Aprobado |

## Referencias

- `constitution.md` — principios P1-P7
- `research.md` — D-001..D-009 y referencias de licencias
- `specs/001-pacientes-consultas/plan.md`
- `specs/001-pacientes-consultas/spec.md`
