---
id: TASKS-005
feature: Facturación Electrónica CFDI 4.0 con PAC
status: Borrador
version: 1.0.0
fecha: 2026-09-06
---

# TASKS-005 — Tareas de Implementación de SPEC-005

---

## Fase 0 — Contratos y Esquema de Base de Datos
- **T401:** Ratificar contrato `contracts/billing.contract.ts`.
- **T402:** Extender `prisma/schema.prisma` con modelo `Invoice` y enum `InvoiceStatus`.

## Fase 1 — Suite de Pruebas RED
- **T403:** Tests de validación de datos fiscales del SAT (`tests/unit/billing/tax-validation.test.ts`).
- **T404:** Tests de timbrado CFDI 4.0 y obtención de UUID fiscal (`tests/unit/billing/invoice-issuance.test.ts`).
- **T405:** Tests de mapeo PUE y forma de pago SAT (`tests/unit/billing/sat-mapping.test.ts`).
- **T406:** Tests de cancelación formal ante el SAT con motivos `01` a `04` (`tests/unit/billing/cancellation.test.ts`).

## Fase 2 — Implementación del Dominio de Facturación
- **T407:** Adaptador PAC FacturAPI (`src/modules/billing/pac-adapter.ts`).
- **T408:** Repositorio y servicio `BillingService` (`src/modules/billing/service.ts`, `repository.ts`) conectado con `SaleOrder`.

## Fase 3 — API Routes HTTP
- **T409:** `src/app/api/billing/invoices/route.ts` (POST timbrar factura express).
- **T410:** `src/app/api/billing/invoices/[id]/route.ts` (GET detalle, DELETE cancelar ante el SAT).
- **T411:** `src/app/api/billing/invoices/[id]/xml/route.ts` (GET descargar XML sellado).

## Fase 4 — Interfaces de Usuario
- **T412:** Formulario express de facturación integrado en entrega de pedidos (`/sales/orders`).
- **T413:** Pantalla de facturas timbradas y descarga de XML/PDF (`/billing/invoices`).

## Fase 5 — Verificación y Cierre
- **T414:** Suite completa de tests pasando (100%).
- **T415:** Verificación de compilación de producción con Next.js y actualización del grafo Graphify.
