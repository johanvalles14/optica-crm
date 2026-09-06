# Quickstart — Planificación y validación de SPEC-001

> Esta guía es de **planificación y validación**. No asume que el código o scripts existen. Los comandos marcados como `[PENDIENTE]` se ejecutarán cuando el stack esté configurado en fase 1.

## 1. Antes de empezar

1. Leer:
   - `constitution.md`
   - `research.md`
   - `specs/001-pacientes-consultas/spec.md`
   - `specs/001-pacientes-consultas/plan.md`
   - `specs/001-pacientes-consultas/data-model.md`
2. Confirmar que ADR-001 (stack) tiene dos aprobaciones humanas registradas; si ambas son del propietario, solicitar revisión independiente antes de producción.
3. Confirmar que los contratos compartidos en `contracts/` (raíz del repositorio) han sido revisados por al menos dos personas.

## 2. Estructura esperada del feature

```text
optica-crm/
├── constitution.md
├── research.md
├── quickstart.md
├── specs/
│   └── 001-pacientes-consultas/
│       ├── spec.md
│       ├── plan.md
│       ├── data-model.md
│       └── checklists/
├── contracts/
│   ├── auth.contract.ts
│   ├── patients.contract.ts
│   ├── clinical.contract.ts
│   └── README.md
├── docs/
│   └── adrs/
│       └── ADR-001-stack-spec-001.md   [PENDIENTE]
├── prisma/
│   └── schema.prisma                    [PENDIENTE]
├── src/
│   ├── modules/
│   │   ├── patients/                    [PENDIENTE]
│   │   └── clinical/                    [PENDIENTE]
│   └── app/                             [PENDIENTE]
├── tests/
│   ├── unit/                            [PENDIENTE]
│   ├── integration/                     [PENDIENTE]
│   └── e2e/                             [PENDIENTE]
```

## 3. Comandos futuros (pendientes)

### Instalación de dependencias

```bash
# [PENDIENTE] Ejecutar después de aprobar ADR-001
npm install next@15 react react-dom
npm install prisma @prisma/client zod
npm install -D vitest @vitejs/plugin-react playwright
# npm install @supabase/supabase-js  # [PENDIENTE] si se ratifica Supabase Auth
```

### Configuración de base de datos

```bash
# Requiere PostgreSQL corriendo y DATABASE_URL configurado
cp .env.example .env
npm run db:migrate
npm run db:seed
```

### Ejecución de pruebas

```bash
# [PENDIENTE] Fase 3: tests RED
npx vitest run

# [PENDIENTE] Fase 4-5: tests unitarios e integración del dominio
npx vitest run

# [PENDIENTE] Fase 9: pruebas E2E
npx playwright test
```

## 4. Checklist de validación manual

Antes de pasar de fase 2 a fase 3:

- [x] ADR-001 ubicado en `docs/adrs/` y tiene dos aprobaciones humanas registradas; queda recomendada revisión independiente.
- [x] Contratos compartidos revisados en `contracts/` (raíz del repositorio).
- [x] `contracts/*.contract.ts` no usan `any`.
- [x] `contracts/*.contract.ts` no contienen secretos.
- [x] `ActorContext` (`actorId`, `role`, `requestId`) está en todas las operaciones de lectura/escritura.
- [x] `expectedVersion` está en todas las mutaciones concurrentes de `patients` y `clinical`.
- [x] `data-model.md` traza cada RF-001..RF-011, incluyendo `PrivacyNotice`, `Consent` y `NonClinicalNote`.
- [x] Schema Prisma inicial escrito.
- [x] Suite de pruebas en rojo ejecuta sin errores de configuración.
- [x] Benchmark de búsqueda y resumen con 100k registros sintéticos definido.
- [x] Revisión de privacidad: datos sensibles no en fixtures ni logs.

## 5. Checklist de cierre de SPEC-001

- [x] Todos los RF-001..RF-011 verificables.
- [x] Cobertura de permisos en endpoints sensibles.
- [x] Auditoría de lecturas/escrituras clínicas con `ActorContext`.
- [x] Resumen seguro accesible por folio y por `patientId` desde secretaría.
- [x] Escenarios 5.1 a 5.12 cubiertos con suite E2E y navegación de secretaría.
- [x] Métricas de SPEC-001 §11 alcanzadas y documentadas en `docs/validation/spec-001-usability.md`.
- [x] Revisión de diff completo aprobada.
- [x] Changelog actualizado (`specs/001-pacientes-consultas/CHANGELOG.md`).

## 6. Notas importantes

- No ejecutar comandos de instalación hasta aprobar ADR-001.
- No crear schemas con datos reales de pacientes.
- La validación legal del aviso de privacidad es requisito previo a producción.
