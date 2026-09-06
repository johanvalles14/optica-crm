# Modelo de Datos — SPEC-004 Caja, Arqueos Diarios y Reportes

> Entidades relacionales para apertura de turno, gastos menores y arqueo ciego.

---

## 1. Entidad `CashShift` (Turno de Caja)

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador del turno |
| `branchId` | UUID | FK -> Branch | Sucursal de la caja |
| `cashierId` | UUID | FK -> User | Cajero responsable del turno |
| `status` | Enum | Default open | `open` o `closed` |
| `openedAt` | Timestamptz | Default now() | Fecha y hora de apertura de caja |
| `closedAt` | Timestamptz | Opcional | Fecha y hora de corte y cierre |
| `initialFloat` | Decimal(10,2) | NOT NULL | Fondo de cambio inicial (morralla) |
| `expensesTotal` | Decimal(10,2) | Default 0.00 | Suma acumulada de gastos menores en efectivo |
| `expectedCash` | Decimal(10,2) | Opcional | Efectivo calculado al cerrar (`fondo + ingresos - gastos`) |
| `declaredCash` | Decimal(10,2) | Opcional | Efectivo físico contado en el arqueo ciego |
| `cashDifference` | Decimal(10,2) | Opcional | Diferencia del arqueo (`declarado - esperado`) |
| `cardTotal` | Decimal(10,2) | Opcional | Total cobrado con tarjetas de débito/crédito |
| `transferTotal` | Decimal(10,2) | Opcional | Total cobrado vía transferencia (SPEI) |
| `totalCollected` | Decimal(10,2) | Opcional | Total consolidado de ingresos del turno |
| `notes` | String(500) | Opcional | Justificación de descuadre o comentarios de entrega |
| `version` | Int | Default 1 | Concurrencia optimista |
| `createdAt` | Timestamptz | Default now() | Creación del registro |
| `updatedAt` | Timestamptz | Auto | Última actualización |

---

## 2. Entidad `CashExpense` (Salidas Menores / Caja Chica)

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador del gasto menor |
| `shiftId` | UUID | FK -> CashShift | Turno en el que ocurrió la salida de dinero |
| `amount` | Decimal(10,2) | NOT NULL | Importe pagado en efectivo |
| `description` | String(255) | NOT NULL | Concepto obligatorio (garrafón, mensajería, etc.) |
| `receiptNumber` | String(64) | Opcional | Número de nota o folio de recibo |
| `actorId` | UUID | FK -> User | Usuario que registró la salida |
| `occurredAt` | Timestamptz | Default now() | Momento de la salida de dinero |
