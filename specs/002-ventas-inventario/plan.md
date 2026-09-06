---
id: PLAN-002
feature: Ventas, Inventario Práctico y Ticket Óptico
status: Borrador
version: 1.0.0
fecha: 2026-09-06
---

# PLAN-002 — Plan de Implementación de SPEC-002

## 1. Resumen

Implementación del módulo comercial y de existencias para resolver el inventario desordenado y el punto de venta de la óptica, conectando las prescripciones clínicas de SPEC-001 con el cobro, configuración de lentes y entrega.

## 2. Decisiones Arquitectónicas (ADR-002 propuesto)

| Área | Decisión | Fundamento |
|---|---|---|
| **Estructura de Catálogo** | Patrón Product + Movement inmutable (inspirado en Medusa) | Modela productos físicos con stock y servicios/micas parametrizadas sin la sobrecarga de un ERP completo. |
| **Generador de Códigos** | Prefijos cortos correlativos por categoría (`ARM-0001`, `SOL-0001`) con bloqueo o incremento atómico | Permite imprimir etiquetas adhesivas legibles para armazones sin código de barras del proveedor. |
| **Máquina de Estados de Órdenes** | Máquina de estados finitos tipada en TypeScript | Transiciones auditables: `quote → pending_deposit → confirmed_in_process → ready_for_delivery → delivered_paid`. Impide entrega sin saldo cubierto. |
| **Punto de Venta Touch** | Formulario rápido en Next.js con búsqueda por código o nombre | Minimiza pasos para la recepcionista en mostrador. |
| **Generación de Ticket** | Componente de ticket térmico monocromático (80 mm / 58 mm) imprimible vía navegador | Funciona con cualquier miniprinter USB o térmica sin drivers propietarios. |

## 3. Fases de Ejecución

### Fase 0 — Contratos y Modelo
- Crear `contracts/inventory.contract.ts` y `contracts/sales.contract.ts`.
- Extender `prisma/schema.prisma` con `Product`, `InventoryMovement`, `SaleOrder`, `SaleOrderItem`, `Payment`.
- Validar control de concurrencia y privacidad (costos restringidos a rol `admin`).

### Fase 1 — Suite de Pruebas RED
- Pruebas unitarias de alta rápida por lote (Fast-Intake) y generación de códigos.
- Pruebas de bajas por merma/rotura y ajustes por conteo físico.
- Pruebas de máquina de estados de órdenes de venta.
- Pruebas de cálculo de anticipos, saldos pendientes y validación de cobro.

### Fase 2 — Implementación del Dominio de Inventario
- Servicio de inventario (`src/modules/inventory/`): alta rápida, generador de códigos internos, registro de movimientos y reconciliación de vitrina.

### Fase 3 — Implementación del Dominio de Ventas (POS)
- Servicio de ventas (`src/modules/sales/`): configurador de lentes (armazón + micas + tratamientos), control de anticipos, registro de abonos y generación de ticket.

### Fase 4 — API Routes HTTP
- Endpoints en `src/app/api/inventory/` y `src/app/api/sales/`.

### Fase 5 — Interfaces de Usuario (Mostrador e Inventario)
- Pantalla de recepción rápida de inventario / etiquetado (`/inventory/intake`).
- Pantalla de catálogo y bajas por merma (`/inventory/products`).
- Pantalla de Punto de Venta / Cotizador (`/sales/pos`).
- Pantalla de seguimiento de órdenes y entrega de lentes (`/sales/orders`).
- Vista de impresión de ticket térmico.

### Fase 6 — Verificación y Cierre
- Suite de pruebas completa pasando al 100%.
- Benchmark de rendimiento en inventario.
- Checklist de cierre de SPEC-002.
