---
id: TASKS-002
feature: Ventas, Inventario Práctico y Ticket Óptico
status: Borrador
version: 1.0.0
fecha: 2026-09-06
---

# TASKS-002 — Tareas de Implementación de SPEC-002

> Plan de trabajo dependency-ordered y granular para SPEC-002.

---

## Fase 0 — Gobierno, Contratos y Esquema

### T101 — Validar y ratificar contratos `inventory` y `sales`
- **Archivos:** `contracts/inventory.contract.ts`, `contracts/sales.contract.ts`
- **Criterio:** Contratos tipados sin `any`, métodos y DTOs trazables a RF-101..RF-110, `ActorContext` presente en todas las firmas.

### T102 — Extender Schema Prisma con entidades comerciales
- **Archivos:** `prisma/schema.prisma`
- **Criterio:** Modelos `Product`, `InventoryMovement`, `SaleOrder`, `SaleOrderItem`, `Payment` con índices de búsqueda rápida y restricciones `UNIQUE`.

---

## Fase 1 — Suite de Pruebas RED (TDD)

### T103 — Tests RED para Generador de Códigos Internos y Alta Rápida (RF-101, RF-102)
- **Archivos:** `tests/unit/inventory/code-generator.test.ts`, `tests/unit/inventory/batch-intake.test.ts`
- **Criterio:** Verifica generación consecutiva de folios (ej. `ARM-0001` a `ARM-0050`), creación de N productos en una sola llamada y rechazo de duplicados.

### T104 — Tests RED para Bajas por Merma, Rotura y Devolución (RF-104, RF-110)
- **Archivos:** `tests/unit/inventory/adjustments.test.ts`
- **Criterio:** Valida que una baja reste stock, genere un `InventoryMovement` inmutable con motivo y no permita stock negativo salvo autorización.

### T105 — Tests RED para Reconciliación Rápida por Escaneo (RF-104)
- **Archivos:** `tests/unit/inventory/reconciliation.test.ts`
- **Criterio:** Compara array de códigos escaneados contra el stock registrado y reporta faltantes/sobrantes con precisión.

### T106 — Tests RED para Configurador de Lentes y Máquina de Estados (RF-105, RF-106)
- **Archivos:** `tests/unit/sales/order-state-machine.test.ts`, `tests/unit/sales/lens-configurator.test.ts`
- **Criterio:** Calcula costo total (armazón + micas + tratamientos), valida transiciones de orden (`quote → confirmed_in_process → ready → delivered`).

### T107 — Tests RED para Anticipos, Saldos y Formato de Ticket (RF-106, RF-107, RF-108)
- **Archivos:** `tests/unit/sales/payments.test.ts`, `tests/unit/sales/ticket.test.ts`
- **Criterio:** Valida registro de abonos parciales, saldo restante y estructura de datos para ticket de 80 mm / 58 mm.

---

## Fase 2 — Implementación del Dominio de Inventario

### T108 — Implementar generador de códigos internos y repositorio de inventario
- **Archivos:** `src/modules/inventory/code-generator.ts`, `src/modules/inventory/repository.ts`
- **Criterio:** Genera códigos cortos legibles y almacena existencias con control de concurrencia.

### T109 — Implementar servicio de inventario (`InventoryService`)
- **Archivos:** `src/modules/inventory/service.ts`, `src/modules/inventory/validators.ts`
- **Criterio:** Resuelve `quickBatchIntake`, `recordAdjustment`, `search` y `reconcileCount` haciendo pasar los tests RED.

---

## Fase 3 — Implementación del Dominio de Ventas (POS)

### T110 — Implementar máquina de estados de órdenes de venta
- **Archivos:** `src/modules/sales/state-machine.ts`
- **Criterio:** Garantiza transiciones válidas e impide entregar lentes con saldo pendiente sin registro de pago.

### T111 — Implementar servicio de ventas (`SalesService`)
- **Archivos:** `src/modules/sales/service.ts`, `src/modules/sales/repository.ts`, `src/modules/sales/ticket.service.ts`
- **Criterio:** Creación de cotizaciones/ventas, descuento automático de stock, abonos y generación de datos de ticket.

---

## Fase 4 — API Routes HTTP

### T112 — Endpoints de Inventario
- **Archivos:**
  - `src/app/api/inventory/intake/route.ts` (POST alta rápida)
  - `src/app/api/inventory/products/route.ts` (GET búsqueda, POST alta individual)
  - `src/app/api/inventory/adjustments/route.ts` (POST baja/merma/ajuste)
  - `src/app/api/inventory/reconcile/route.ts` (POST escaneo de vitrina)
- **Criterio:** Endpoints tipados con RBAC y auditoría.

### T113 — Endpoints de Ventas y Pagos
- **Archivos:**
  - `src/app/api/sales/orders/route.ts` (POST crear orden/cotización, GET listar)
  - `src/app/api/sales/orders/[id]/route.ts` (GET detalle de orden)
  - `src/app/api/sales/orders/[id]/payments/route.ts` (POST registrar abono/liquidación)
  - `src/app/api/sales/orders/[id]/ticket/route.ts` (GET datos formateados para impresión)
- **Criterio:** Manejo de concurrencia y validación de cobro.

---

## Fase 5 — Pantallas e Interfaces de Usuario

### T114 — Pantalla de Alta Rápida / Etiquetado (`/inventory/intake`)
- Formulario de recepción ágil por lote para cajas desordenadas del proveedor.
- Generación visual e impresión de etiquetas con código interno.

### T115 — Pantalla de Catálogo y Bajas por Merma (`/inventory/products`)
- Buscador rápido por código o nombre.
- Modal en ≤ 3 clics para reportar merma/rotura o devolución a proveedor.

### T116 — Pantalla de Punto de Venta / Configurador de Lentes (`/sales/pos`)
- Selección de armazón (por escáner o búsqueda).
- Selector de micas y tratamientos con cálculo en tiempo real.
- Registro de anticipo y promesa de entrega.

### T117 — Pantalla de Órdenes y Entrega de Lentes (`/sales/orders`)
- Lista de pedidos por estado (`en taller`, `listo para entrega`, `entregado`).
- Cobro de saldo pendiente contra entrega y cierre de orden.

### T118 — Vista de Impresión de Ticket Térmico (`/sales/orders/[id]/ticket`)
- Vista optimizada para 80 mm / 58 mm lista para imprimir.

---

## Fase 6 — Integración, Pruebas y Cierre

### T119 — Pruebas de integración E2E de ciclo comercial completo
- Simulación: Recepción rápida de armazones -> Configuración de lentes con prescripción de SPEC-001 -> Anticipo del 50% -> Notificación listo para entrega -> Liquidación y entrega final -> Auditoría de stock.

### T120 — Actualización de checklist, CHANGELOG y cierre de SPEC-002
