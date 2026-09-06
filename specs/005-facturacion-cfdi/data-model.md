# Modelo de Datos — SPEC-005 Facturación Electrónica CFDI 4.0

> Entidades relacionales para comprobantes fiscales timbrados ante el SAT.

---

## 1. Entidad `Invoice` (Factura CFDI 4.0)

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador único de la factura en el sistema |
| `saleOrderId` | UUID | UNIQUE, FK -> SaleOrder | Venta liquidada asociada (1 factura por venta) |
| `saleOrderFolio` | String(16) | NOT NULL, INDEX | Folio comercial de la venta (ej. `VTA-00104`) |
| `branchId` | UUID | FK -> Branch | Sucursal emisora |
| `uuid` | String(36) | UNIQUE | Folio Fiscal digital asignado por el SAT (UUID) |
| `folio` | String(16) | UNIQUE | Serie y folio interno (ej. `FAC-00104`) |
| `rfc` | String(13) | NOT NULL, INDEX | RFC del receptor (12 o 13 caracteres) |
| `legalName` | String(255) | NOT NULL | Nombre fiscal exacto en mayúsculas |
| `zipCode` | String(10) | NOT NULL | Código postal fiscal del receptor |
| `taxSystem` | String(10) | NOT NULL | Clave de régimen fiscal SAT (ej. `605`, `612`, `626`) |
| `cfdiUse` | String(10) | NOT NULL | Clave de uso de CFDI (ej. `D07` para lentes graduados) |
| `paymentFormSat` | String(10) | NOT NULL | Clave SAT de forma de pago (`01` Efectivo, `03`, `04`, `28`) |
| `subtotal` | Decimal(10,2) | NOT NULL | Subtotal antes de impuestos |
| `tax` | Decimal(10,2) | NOT NULL | Monto de IVA trasladado |
| `total` | Decimal(10,2) | NOT NULL | Total de la factura timbrada |
| `status` | Enum | Default issued | `issued` (vigente timbrada) o `cancelled` (cancelada ante el SAT) |
| `issuedAt` | Timestamptz | Default now() | Fecha y hora de timbrado oficial |
| `cancelledAt` | Timestamptz | Opcional | Fecha de cancelación |
| `cancellationMotive` | String(10) | Opcional | Motivo oficial SAT (`01`, `02`, `03`, `04`) |
| `xmlContent` | Text | Opcional | Contenido íntegro del archivo XML sellado |
| `pdfUrl` | String(255) | Opcional | Enlace para descarga o visualización PDF |
| `version` | Int | Default 1 | Concurrencia optimista |
| `createdAt` | Timestamptz | Default now() | Creación del registro |
| `updatedAt` | Timestamptz | Auto | Última actualización |

---

## 2. Relaciones con otros módulos
* **`SaleOrder`:** Se vincula bidireccionalmente con `SaleOrder` (1 a 1 opcional). Una orden liquidada puede emitir a lo sumo un CFDI.
* **`Branch`:** Sucursal con su RFC emisor y certificado de sello digital (CSD) configurado en el PAC.
