# Modelo de Datos — SPEC-002 Ventas e Inventario Práctico

> Extensión del modelo de persistencia para catálogo, movimientos de stock, órdenes de venta y pagos.

---

## 1. Entidades del Dominio de Inventario

### 1.1 `Product` (Catálogo y Stock)
Representa cualquier artículo vendible. El código interno (`internalCode`) es un identificador alfanumérico secuencial autogenerado (ej. `ARM-0014`, `SOL-0005`).

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador único del producto |
| `internalCode` | String(16) | UNIQUE | Código interno generado por la óptica para etiquetado |
| `vendorBarcode` | String(64) | Opcional, INDEX | Código de barras original del fabricante si existe |
| `category` | Enum | NOT NULL | `frame`, `lens_blank`, `contact_lens`, `solution`, `accessory`, `lens_service` |
| `brand` | String(100) | Opcional | Marca o línea comercial (ej. Ray-Ban, Genérico, Clip-on) |
| `model` | String(100) | Opcional | Modelo o estilo (ej. Aviador, Caret) |
| `color` | String(60) | Opcional | Color o código de color |
| `description` | String(255) | Opcional | Descripción ampliada o gama de precio |
| `retailPrice` | Decimal(10,2) | NOT NULL | Precio de venta al público con impuestos incluidos |
| `costPrice` | Decimal(10,2) | Opcional | Costo de adquisición pagado al proveedor (restringido a admin) |
| `stock` | Int | NOT NULL, Default 0 | Cantidad física disponible en la sucursal |
| `minStockAlert` | Int | Default 2 | Umbral para alerta de reabastecimiento |
| `branchId` | UUID | FK -> Branch | Sucursal donde reside el producto |
| `active` | Boolean | Default true | Estado activo/descontinuado |
| `version` | Int | Default 1 | Control de concurrencia optimista |
| `createdAt` | Timestamptz | Default now() | Fecha de alta |
| `updatedAt` | Timestamptz | Auto | Fecha de última edición |

### 1.2 `InventoryMovement` (Historial Inmutable de Stock)
Cada cambio en las existencias (ingreso de lote, venta, merma, rotura, devolución o ajuste) genera un registro inmutable.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador del movimiento |
| `productId` | UUID | FK -> Product | Producto afectado |
| `branchId` | UUID | FK -> Branch | Sucursal del movimiento |
| `movementType` | Enum | NOT NULL | `in` (entrada), `out` (salida/baja), `adjust` (ajuste conteo) |
| `quantityChange` | Int | NOT NULL | Cambio de cantidad (+ o -) |
| `previousStock` | Int | NOT NULL | Stock antes del movimiento |
| `newStock` | Int | NOT NULL | Stock resultante después del movimiento |
| `reason` | Enum | NOT NULL | `intake_batch`, `intake_individual`, `sale`, `sale_cancelled`, `damage_breakage`, `vendor_return`, `warranty`, `physical_count`, `theft_loss` |
| `notes` | String(500) | Opcional | Justificación del movimiento o reporte de rotura |
| `actorId` | UUID | FK -> User | Usuario responsable del movimiento |
| `occurredAt` | Timestamptz | Default now() | Momento exacto del movimiento |

---

## 2. Entidades del Dominio de Ventas (POS)

### 2.1 `SaleOrder` (Orden de Venta / Cotización)
Gestiona la cotización y venta de lentes o mostrador, control de anticipos y entrega.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador de la orden |
| `folio` | String(16) | UNIQUE | Folio legible correlativo (ej. `VTA-00104`) |
| `branchId` | UUID | FK -> Branch | Sucursal de la venta |
| `patientId` | UUID | Opcional, FK -> Patient | Paciente vinculado si existe expediente |
| `prescriptionId` | UUID | Opcional, FK -> Prescription | Prescripción médica emitida en SPEC-001 |
| `status` | Enum | NOT NULL | `quote`, `pending_deposit`, `confirmed_in_process`, `ready_for_delivery`, `delivered_paid`, `cancelled` |
| `subtotal` | Decimal(10,2) | NOT NULL | Suma de importes de items |
| `discount` | Decimal(10,2) | Default 0.00 | Descuento comercial aplicado |
| `total` | Decimal(10,2) | NOT NULL | Total a pagar (`subtotal - discount`) |
| `paidAmount` | Decimal(10,2) | Default 0.00 | Suma acumulada de pagos y anticipos |
| `balanceDue` | Decimal(10,2) | NOT NULL | Saldo restante (`total - paidAmount`) |
| `promisedDeliveryDate` | Date | Opcional | Fecha prometida de entrega de lentes |
| `deliveredAt` | Timestamptz | Opcional | Fecha y hora en que el cliente recogió sus lentes |
| `notes` | String(500) | Opcional | Notas comerciales o especificaciones de entrega |
| `version` | Int | Default 1 | Concurrencia optimista |
| `createdAt` | Timestamptz | Default now() | Fecha de creación de la venta |
| `updatedAt` | Timestamptz | Auto | Última actualización |

### 2.2 `SaleOrderItem` (Partidas de la Venta)
| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador del item |
| `saleOrderId` | UUID | FK -> SaleOrder | Orden a la que pertenece |
| `productId` | UUID | Opcional, FK -> Product | Producto del catálogo si proviene de stock |
| `itemType` | Enum | NOT NULL | `frame`, `lens_complete`, `contact_lens`, `accessory`, `service` |
| `description` | String(255) | NOT NULL | Descripción del producto o servicio |
| `lensConfig` | Json | Opcional | Detalle de micas, material, tratamientos y biselado |
| `quantity` | Int | NOT NULL, Default 1 | Cantidad vendida |
| `unitPrice` | Decimal(10,2) | NOT NULL | Precio unitario |
| `totalPrice` | Decimal(10,2) | NOT NULL | Total de la partida (`quantity * unitPrice`) |

### 2.3 `Payment` (Registro de Pagos y Anticipos)
| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador del pago |
| `saleOrderId` | UUID | FK -> SaleOrder | Orden liquidada o anticipada |
| `amount` | Decimal(10,2) | NOT NULL | Monto del abono |
| `method` | Enum | NOT NULL | `cash`, `card_debit`, `card_credit`, `transfer` |
| `reference` | String(64) | Opcional | Últimos 4 dígitos o folio de voucher bancario |
| `receivedBy` | UUID | FK -> User | Cajero / secretaria que cobró |
| `paidAt` | Timestamptz | Default now() | Fecha y hora del pago |
