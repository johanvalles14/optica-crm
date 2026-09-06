---
id: TASKS-003
feature: Taller de Biselado y Laboratorio Óptico
status: Borrador
version: 1.0.0
fecha: 2026-09-06
---

# TASKS-003 — Tareas de Implementación de SPEC-003

---

## Fase 0 — Contratos y Esquema de Base de Datos
- **T201:** Ratificar contrato `contracts/laboratory.contract.ts`.
- **T202:** Extender `prisma/schema.prisma` con `LabOrder` y enums `LabDestination`, `LabOrderStatus`, `FrameMountingType`.

## Fase 1 — Suite de Pruebas RED
- **T203:** Tests de creación de orden de taller y ficha técnica (`tests/unit/laboratory/lab-order.test.ts`).
- **T204:** Tests de máquina de estados de taller y control de calidad en 1 clic (`tests/unit/laboratory/quality-control.test.ts`).
- **T205:** Tests de registro de merma/rotura y disparo de alerta (`tests/unit/laboratory/rework-merma.test.ts`).
- **T206:** Tests de boleta de charola (`tests/unit/laboratory/tray-slip.test.ts`).

## Fase 2 — Implementación del Dominio de Taller
- **T207:** Repositorio y máquina de estados (`src/modules/laboratory/repository.ts`, `state-machine.ts`).
- **T208:** Servicio `LaboratoryService` (`src/modules/laboratory/service.ts`, `tray-slip.service.ts`) con integración a `sales` e `inventory`.

## Fase 3 — API Routes HTTP
- **T209:** `src/app/api/laboratory/orders/route.ts` (GET listar, POST crear).
- **T210:** `src/app/api/laboratory/orders/[id]/route.ts` (GET detalle, PATCH cambiar fase/asignar maquila).
- **T211:** `src/app/api/laboratory/orders/[id]/approve/route.ts` (POST control calidad 1 clic).
- **T212:** `src/app/api/laboratory/orders/[id]/rework/route.ts` (POST reporte merma/rotura).

## Fase 4 — Interfaces de Usuario
- **T213:** Tablero Kanban de Taller (`/laboratory/kanban`).
- **T214:** Vista de Boleta de Charola para imprimir (`/laboratory/orders/[id]/slip`).
- **T215:** Badge y alerta de repetición en pantalla de mostrador (`/sales/orders`).

## Fase 5 — Verificación y Cierre
- **T216:** Suite completa de tests pasando.
- **T217:** Verificación de compilación de producción con Next.js y actualización del grafo Graphify.
