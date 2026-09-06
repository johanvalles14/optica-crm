# Checklist de Requisitos — SPEC-004 Caja, Arqueos Diarios y Reportes

## Control de Turno y Caja
- [x] **RF-301:** Apertura de turno con fondo inicial en efectivo y prevención de turnos duplicados.
- [x] **RF-302:** Registro de gastos menores en efectivo con motivo obligatorio (`CashExpense`).
- [x] **RF-303:** Arqueo ciego: el cajero captura el efectivo físico sin conocer el monto del sistema.
- [x] **RF-304:** Cálculo exacto de descuadre: `diferencia = declarado - (fondo + cobros - gastos)`.
- [x] **RF-305:** Desglose multiforma agrupando efectivo, tarjeta de débito/crédito y transferencias.
- [x] **RF-306:** Reporte en tiempo real de saldos por cobrar de lentes en proceso (`/cash/receivables`).
- [x] **RF-307:** Congelamiento inmutable del turno tras el cierre.
