# Contratos de SPEC-001

Este directorio contiene los contratos TypeScript entre módulos para SPEC-001.

## Archivos

- `auth.contract.ts` — Identidad, sesión, roles y auditoría de autenticación.
- `patients.contract.ts` — Ficha de paciente, búsqueda y consentimiento.
- `clinical.contract.ts` — Consultas, refracción, prescripción y resumen seguro.

## Reglas

- Sin `any`: todos los tipos son explícitos.
- Sin secretos: no se incluyen contraseñas, tokens ni datos clínicos reales.
- Listas blancas: los DTOs de salida reflejan exactamente los campos que cada rol puede ver.
- Permisos: los roles y operaciones permitidas se definen en SPEC-001 §4.
- ActorContext: toda operación —lectura o escritura— recibe `ActorContext` con `actorId`, `role` y `requestId`, y es auditable.
- Concurrencia: las mutaciones sobre registros versionables reciben `expectedVersion` para detectar sobrescritas perdidas.

## Uso previsto

Los contratos se usan para:

1. Validar que los módulos `patients` y `clinical` no acceden informalmente a datos internos.
2. Escribir pruebas de integración antes de la implementación.
3. Generar Zod schemas compartidos en fase 1.
