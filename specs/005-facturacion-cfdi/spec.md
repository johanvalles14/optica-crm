---
id: SPEC-005
feature: Facturación Electrónica CFDI 4.0 con PAC
status: Verificada
version: 1.0.0
fecha: 2026-09-06
---

# SPEC-005 — Facturación Electrónica CFDI 4.0 con PAC

## 1. Resumen ejecutivo

Define la emisión, timbrado y cancelación de comprobantes fiscales digitales por internet (CFDI 4.0) compatibles con las disposiciones del Servicio de Administración Tributaria (SAT) en México. Permite a los pacientes deducir el gasto de sus lentes oftálmicos graduados (Uso de CFDI `D07`) mediante un **formulario express en mostrador** al momento de liquidar la entrega (modalidad PUE). Se integra mediante un adaptador de Proveedor Autorizado de Certificación (PAC) compatible con **FacturAPI**.

## 2. Objetivo y problema

**Objetivo de negocio.**
Permitir al mostrador emitir facturas fiscales válidas en menos de 30 segundos cuando el paciente recoge y liquida sus lentes, sin obligar al paciente a lidiar con portales de autofacturación lentos ni requerir catálogos fiscales engorrosos.

**Problemas actuales en ópticas independientes.**
1. **Pérdida de ventas por falta de deducción:** Pacientes que exigen deducir sus lentes graduados en su declaración anual de personas físicas (`D07`) y se van si la óptica no factura de inmediato.
2. **Rechazos del SAT por CFDI 4.0:** Errores por no coincidir exactamente el Nombre o Razón Social con la Constancia de Situación Fiscal (sin S.A. de C.V.) o por discrepancias en el Código Postal fiscal.
3. **Complejidad de anticipos:** Manejar facturación en dos tiempos (anticipo PPD + complemento de recepción de pagos) genera una carga contable excesiva para una óptica pequeña.

## 3. Alcance

### Dentro del alcance
- **Emisión Express PUE en Entrega:**
  - La factura se genera al momento de liquidar el 100% de la orden de venta en `/sales/orders`.
  - Captura directa de los 4 datos fiscales indispensables del SAT:
    1. **RFC** del receptor (Persona Física o Moral con validación de estructura).
    2. **Nombre o Razón Social** (en mayúsculas exactas según constancia fiscal).
    3. **Código Postal** del domicilio fiscal del receptor.
    4. **Régimen Fiscal** del receptor (ej. `605` Sueldos, `612` Actividades Empresariales, `626` RESICO).
    5. **Uso de CFDI:** Predeterminado en `D07 - Gastos médicos por lentes ópticos graduados` (con opción a `G03 - Gastos en general` o `CP01 - Pagos`).
- **Claves de Productos y Servicios SAT (Catálogos Oficiales):**
  - Armazones y lentes: `42142900` (Lentes, anteojos y armazones graduados).
  - Soluciones / gotas: `42142901`.
  - Unidad de medida: `H87` (Pieza).
  - Objeto de impuesto: `02` (Sí objeto de impuesto, IVA 16% o exento según producto).
- **Timbrado Digital vía PAC:**
  - Adaptador desacoplado compatible con FacturAPI (MIT, decisión D-002 de `research.md`).
  - Obtención de UUID (Folio Fiscal del SAT), fecha y hora de certificación, sello digital del emisor, sello del SAT y cadena original.
- **Representación Gráfica y Archivo Fiscal:**
  - Descarga de XML oficial sellado por el SAT.
  - Representación impresa (PDF) con código bidimensional QR fiscal y desglose.
  - Envío opcional por correo electrónico al paciente.
- **Cancelación Fiscal con Motivos SAT:**
  - Cancelación ante el SAT con motivo obligatorio:
    - `01`: Comprobante emitido con errores con relación.
    - `02`: Comprobante emitido con errores sin relación.
    - `03`: No se llevó a cabo la operación.
    - `04`: Operación nominativa relacionada en la factura global.

### Fuera del alcance
- Factura global consolidada al público en general (RFC `XAXX010101000`) de fin de mes; se abordará en un módulo contable centralizado.
- Emisión de nómina o retenciones.

## 4. Actores y Permisos

| Operación | `frontdesk:receptionist` | `admin` |
|---|---|---|
| Capturar datos fiscales y timbrar CFDI | Sí | Sí |
| Descargar XML y PDF de factura | Sí | Sí |
| Reenviar factura por correo | Sí | Sí |
| Cancelar CFDI ante el SAT | No | Sí (requiere clave admin) |

## 5. Requisitos Funcionales Verificables

- **RF-401 (Validación de RFC y Datos Fiscales):** El sistema valida formato de RFC (12 caracteres para morales, 13 para físicas), código postal de 5 dígitos y régimen fiscal compatible con el uso de CFDI.
- **RF-402 (Mapeo Automático de Claves SAT):** Mapeo automático de los items de la orden de venta (`SaleOrderItem`) a las claves de producto/servicio `42142900` y unidad `H87`.
- **RF-403 (Modalidad PUE):** Toda factura se emite como `PUE` (Pago en Una sola Exhibición) vinculada a la forma de pago real de la venta (`01` Efectivo, `03` Transferencia, `04` Tarjeta de crédito, `28` Tarjeta de débito).
- **RF-404 (Timbrado y Obtención de UUID):** El servicio genera o simula el timbrado exitoso devolviendo UUID de 36 caracteres, sellos digitales y fecha de timbrado.
- **RF-405 (Inmutabilidad de Factura):** Una vez timbrada, una factura no puede editarse físicamente; cualquier corrección requiere cancelación ante el SAT.
- **RF-406 (Descarga de XML y Representación PDF):** Acceso inmediato para descargar el archivo `.xml` y ver el comprobante con QR fiscal.
- **RF-407 (Cancelación Formal SAT):** Cancelación con motivo oficial (`01` a `04`) y registro en auditoría.
