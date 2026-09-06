# Checklist de Requisitos — SPEC-005 Facturación Electrónica CFDI 4.0

## Datos Fiscales y Reglas SAT
- [x] **RF-401:** Validación de RFC (12/13 caracteres), código postal fiscal y régimen fiscal.
- [x] **RF-402:** Mapeo automático a clave producto `42142900` (lentes) y unidad `H87`.
- [x] **RF-403:** Emisión obligatoria en modalidad `PUE` vinculada a la forma de pago real de la venta.

## Timbrado y Cancelación
- [x] **RF-404:** Timbrado con PAC generando UUID fiscal de 36 caracteres, sellos y cadena original.
- [x] **RF-405:** Inmutabilidad de la factura timbrada.
- [x] **RF-406:** Generación y descarga de archivo XML sellado y representación gráfica PDF con código QR fiscal.
- [x] **RF-407:** Cancelación ante el SAT con motivo oficial (`01` a `04`) y clave de administrador.
