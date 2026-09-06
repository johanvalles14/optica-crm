# Checklist de Requisitos — SPEC-003 Taller y Laboratorio Óptico

## Ficha Técnica y Maquila
- [x] **RF-201:** Creación de orden de taller vinculada a la venta.
- [x] **RF-202:** Ficha técnica con graduación OD/OI, DP, alturas, tipo de bisel y código del armazón.
- [x] **RF-203:** Selector agnóstico de destino (`internal_workshop` vs `external_lab`) con datos de proveedor y guía.
- [x] **RF-204:** Generación de boleta de charola imprimible (`/laboratory/orders/[id]/slip`).

## Producción y Calidad
- [x] Tablero Kanban de taller (`queued` → `in_process` → `quality_control` → `completed` / `rework_needed`).
- [x] **RF-205:** Aprobación de control de calidad en 1 clic que libera la venta en mostrador (`ready_for_delivery`).
- [x] **RF-206:** Registro de merma por rotura que descuenta inventario y resalta alerta en mostrador (`damage_breakage`).
- [x] **RF-207:** Trazabilidad y auditoría de cambios de fase en taller con `ActorContext`.
