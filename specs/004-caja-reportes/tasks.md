---
id: TASKS-004
feature: Caja, Arqueos Diarios y Reportes Operativos
status: Borrador
version: 1.0.0
fecha: 2026-09-06
---

# TASKS-004 — Tareas de Implementación de SPEC-004

---

## Fase 0 — Contratos y Esquema de Base de Datos
- **T301:** Ratificar contrato `contracts/cash-shift.contract.ts`.
- **T302:** Extender `prisma/schema.prisma` con modelos `CashShift`, `CashExpense` y enum `ShiftStatus`.

## Fase 1 — Suite de Pruebas RED
- **T303:** Tests de apertura de turno con fondo inicial (`tests/unit/cash/open-shift.test.ts`).
- **T304:** Tests de registro de gastos menores de caja chica (`tests/unit/cash/expenses.test.ts`).
- **T305:** Tests de arqueo ciego y cálculo de descuadre (`tests/unit/cash/blind-audit.test.ts`).
- **T306:** Tests de reporte de saldos en la calle (`tests/unit/cash/accounts-receivable.test.ts`).

## Fase 2 — Implementación del Dominio de Caja
- **T307:** Repositorio y servicio `CashService` (`src/modules/cash/service.ts`, `repository.ts`).
- **T308:** Integración con módulo de ventas para cálculo de cobros por método durante el turno.

## Fase 3 — API Routes HTTP
- **T309:** `src/app/api/cash/shift/route.ts` (GET turno actual, POST abrir turno).
- **T310:** `src/app/api/cash/shift/[id]/expense/route.ts` (POST registrar salida menor).
- **T311:** `src/app/api/cash/shift/[id]/close/route.ts` (POST arqueo ciego y cierre).
- **T312:** `src/app/api/cash/reports/accounts-receivable/route.ts` (GET saldos en la calle).

## Fase 4 — Interfaces de Usuario
- **T313:** Pantalla de Apertura y Estado de Turno de Caja (`/cash/shift`).
- **T314:** Pantalla de Arqueo Ciego y Corte Diario (`/cash/close`).
- **T315:** Reporte de Saldos por Cobrar en Mostrador (`/cash/receivables`).

## Fase 5 — Verificación y Cierre
- **T316:** Suite completa de tests pasando (100%).
- **T317:** Verificación de compilación de producción con Next.js y actualización del grafo Graphify.
