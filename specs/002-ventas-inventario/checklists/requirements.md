# Checklist de Requisitos — SPEC-002 Ventas e Inventario Práctico

> Lista de verificación para SPEC-002.

## Inventario Adaptativo y Alta Rápida
- [x] **RF-101:** Todo producto físico genera un código interno secuencial único (ej. `ARM-XXXX`) para etiquetado.
- [x] **RF-102:** Función de alta rápida por lote (Fast-Intake) para registrar cajas desordenadas en 1 paso por categoría/gama de precio.
- [x] **RF-103:** Catálogo de micas y tratamientos parametrizado sin requerir stock unitario previo.
- [x] **RF-104:** Registro inmutable de todos los movimientos de inventario (`InventoryMovement`) con actor, fecha, motivo y stock previo/posterior.
- [x] **RF-110:** Procedimiento de baja por rotura en taller/exhibición (merma) en ≤ 3 clics con motivo tipificado.
- [x] Módulo de escaneo ciego para reconciliación de vitrina.

## Punto de Venta (POS) y Lentes
- [x] **RF-105:** Configurador de lentes que combina armazón de stock + par de micas + tratamientos + biselado con cálculo automático.
- [x] Vinculación opcional con Prescripción médica emitida en SPEC-001.
- [x] **RF-106:** Manejo de anticipos (enganches), cálculo de saldo pendiente y fecha estimada de entrega.
- [x] Máquina de estados de orden: `quote`, `pending_deposit`, `confirmed_in_process`, `ready_for_delivery`, `delivered_paid`, `cancelled`.
- [x] **RF-107:** Registro de múltiples formas de pago (efectivo, tarjeta, transferencia).

## Tickets y Seguridad
- [x] **RF-108:** Generación de ticket térmico monocromático adaptable a impresoras de 80 mm y 58 mm.
- [x] **RF-109:** Protección estricta de costos y márgenes de compra: no visibles para secretaría o mostrador.
- [x] Auditoría de todas las ventas y anulaciones.
