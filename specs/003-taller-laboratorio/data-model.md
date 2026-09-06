# Modelo de Datos — SPEC-003 Taller y Laboratorio Óptico

> Extensión del modelo relacional para órdenes de trabajo en taller, maquila y control de calidad.

---

## 1. Entidad `LabOrder` (Ficha de Laboratorio)

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador único de la orden de taller |
| `folio` | String(16) | UNIQUE | Folio de taller secuencial (ej. `LAB-00104`) |
| `saleOrderId` | UUID | FK -> SaleOrder | Orden de venta comercial asociada |
| `saleOrderFolio` | String(16) | NOT NULL, INDEX | Folio comercial (ej. `VTA-00104`) |
| `branchId` | UUID | FK -> Branch | Sucursal operativa |
| `patientName` | String(160) | NOT NULL | Nombre del paciente |
| `destination` | Enum | Default internal | `internal_workshop` (local) o `external_lab` (maquila) |
| `externalLabName` | String(100) | Opcional | Nombre del maquilador (ej. Laboratorio Azteca, Essilor) |
| `externalGuideNumber` | String(64) | Opcional | Folio externo o número de guía de envío |
| `expectedReturnDate` | Date | Opcional | Fecha prometida de retorno por el maquilador |
| `status` | Enum | NOT NULL | `queued`, `in_process`, `quality_control`, `completed`, `rework_needed`, `cancelled` |
| `frameCode` | String(32) | NOT NULL | Código interno del armazón (`ARM-XXXX`) |
| `frameDescription` | String(255) | Opcional | Descripción o color del armazón |
| `frameMountingType` | Enum | Default full_rim | `full_rim`, `semi_rimless_groove`, `rimless_drill` |
| `lensMaterial` | String(80) | NOT NULL | CR-39, Policarbonato, Alto Índice, etc. |
| `treatments` | Json | NOT NULL | Array de tratamientos seleccionados |
| `rightEye` | Json | NOT NULL | Esfera, cilindro, eje, adición, DP, altura de OD |
| `leftEye` | Json | NOT NULL | Esfera, cilindro, eje, adición, DP, altura de OI |
| `observations` | String(500) | Opcional | Instrucciones especiales para el montador |
| `assignedTechnicianId` | UUID | Opcional, FK -> User | Técnico responsable |
| `qualityApprovedAt` | Timestamptz | Opcional | Timestamp de aprobación en frontofocómetro |
| `qualityApprovedBy` | UUID | Opcional, FK -> User | Técnico o admin que aprobó la calidad |
| `reworkReason` | String(500) | Opcional | Motivo de rechazo o reporte de rotura |
| `version` | Int | Default 1 | Concurrencia optimista |
| `createdAt` | Timestamptz | Default now() | Fecha de recepción en taller |
| `updatedAt` | Timestamptz | Auto | Última actualización |

---

## 2. Relaciones con otros módulos
* **Conexión con Mostrador (`SaleOrder`):** Cuando `LabOrder.status` pasa a `completed`, el servicio actualiza la `SaleOrder` correspondiente a `ready_for_delivery`.
* **Conexión con Inventario (`Product` / `InventoryMovement`):** Si se reporta merma o rotura en taller (`reportRework`), se descuenta automáticamente el artículo quebrado del stock (`damage_breakage`) y se alerta en mostrador.
