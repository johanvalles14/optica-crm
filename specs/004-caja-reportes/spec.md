---
id: SPEC-004
feature: Caja, Arqueos Diarios y Reportes Operativos
status: Verificada
version: 1.0.0
fecha: 2026-09-06
---

# SPEC-004 — Caja, Arqueos Diarios y Reportes Operativos

## 1. Resumen ejecutivo

Define el control financiero y operativo de los cobros en mostrador. Resuelve el descontrol de efectivo y cobranza mediante:
1. **Apertura de turno** con fondo de cambio inicial (morralla).
2. **Registro de gastos menores** de caja chica justificados (mensajería, garrafón, papelería).
3. **Arqueo ciego de cierre:** el cajero cuenta y declara el efectivo físico sin conocer el total del sistema. El sistema calcula al centavo la diferencia (cuadrado, faltante o sobrante).
4. **Desglose multiforma:** separación exacta de efectivo, tarjetas bancarias y transferencias SPEI.
5. **Reporte de saldos en la calle:** visibilidad inmediata de las cuentas por cobrar pendientes de lentes en proceso.

## 2. Objetivo y problema

**Objetivo de negocio.**
Garantizar que todo el dinero que entra y sale por el mostrador cuadre al final del día sin fugas de efectivo, y permitir al dueño de la óptica conocer exactamente cuántos ingresos se generaron y cuánto dinero está pendiente de cobro en la calle.

**Problemas actuales.**
- **Falta de registro de gastos chicos:** Salidas de $50 o $100 pesos para compras menores de la óptica que no se anotan, haciendo imposible cuadrar la caja en la noche.
- **Arqueos sesgados:** Si el sistema le dice a la secretaria cuánto dinero debería haber, se presta a simular el conteo físico en lugar de contar billete por billete.
- **Mezcla de medios de pago:** Dificultad para conciliar los vouchers de tarjeta bancaria y transferencias contra el efectivo real del cajón.
- **Saldos olvidados:** Desconocimiento del dinero total que los clientes deben en pedidos aún no entregados.

## 3. Alcance

### Dentro del alcance
- **Apertura de Turno (`CashShift`):**
  - Registro de fondo de inicio en efectivo (ej. $500 MXN).
  - Validación de que no existan dos turnos abiertos simultáneos en la misma sucursal/caja.
- **Gastos Menores (`CashExpense`):**
  - Salidas de efectivo con motivo obligatorio y comprobante/folio opcional.
- **Arqueo Ciego y Cierre de Turno:**
  - Declaración ciega de efectivo físico.
  - Cálculo de efectivo esperado: `fondoInicial + cobrosEfectivo - gastosEfectivo`.
  - Cálculo de discrepancia: `efectivoDeclarado - efectivoEsperado` (diferencia $0, faltante negativo o sobrante positivo).
  - Desglose consolidado: Total Efectivo, Total Tarjetas (Débito/Crédito), Total Transferencias.
  - Cierre y congelamiento del turno con auditoría inmutable.
- **Reporte de Saldos en la Calle:**
  - Suma y lista de pedidos con `balanceDue > 0` en estado `confirmed_in_process` o `ready_for_delivery`.
- **Cancelaciones Supervisadas:**
  - Anulación de ventas con autorización de rol `admin`.

### Fuera del alcance
- Facturación electrónica CFDI 4.0 (SPEC-005).
- Conciliación bancaria automática vía API con bancos (SPEI automatizado).

## 4. Actores y Matriz de Permisos

| Operación | `frontdesk:receptionist` | `admin` |
|---|---|---|
| Abrir turno con fondo inicial | Sí | Sí |
| Registrar gasto menor de caja chica | Sí | Sí |
| Registrar pagos de venta / abonos | Sí | Sí |
| Realizar arqueo ciego y cerrar turno | Sí | Sí |
| Ver reporte de descuadre (faltante/sobrante) | Sí (al cerrar) | Sí |
| Ver reporte histórico de caja y auditoría | No | Sí |
| Cancelar venta y autorizar devolución | No | Sí |

## 5. Requisitos Funcionales Verificables

- **RF-301 (Apertura de Turno):** Se registra fondo inicial en efectivo y timestamp de apertura; impide abrir turno si ya hay uno activo.
- **RF-302 (Gastos Menores de Caja Chica):** Permite registrar egresos menores en efectivo con concepto obligatorio; se descuentan del efectivo esperado.
- **RF-303 (Arqueo Ciego):** El cajero captura el efectivo físico contado sin que la interfaz le muestre el monto calculado por el sistema.
- **RF-304 (Cálculo de Descuadre):** El sistema calcula al centavo: `esperado = fondo + ingresos_efectivo - gastos_efectivo`, `diferencia = declarado - esperado`.
- **RF-305 (Desglose por Método de Pago):** El cierre agrupa cobros en efectivo, tarjetas y transferencias con conteo de transacciones.
- **RF-306 (Reporte de Saldos en la Calle):** Consulta en tiempo real de la cartera por cobrar de ventas no liquidadas.
- **RF-307 (Congelamiento Inmutable de Turno):** Una vez cerrado el turno, no se pueden registrar cobros ni gastos asociados a ese turno.
