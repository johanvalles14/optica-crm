---
id: SPEC-002
feature: Ventas, Inventario Práctico y Ticket Óptico
status: Verificada
version: 1.0.0
fecha: 2026-09-06
---

# SPEC-002 — Ventas, Inventario Práctico y Ticket Óptico

## 1. Resumen ejecutivo

Define el sistema de inventario adaptable y punto de venta (POS) para ópticas independientes mexicanas. Resuelve de forma prioritaria el problema del **inventario caótico** (embarques de proveedores sin códigos estandarizados ni empaques uniformes) mediante **altas rápidas por lote**, **generación automática de códigos internos legibles** y **bajas operativas inmediatas** (venta, merma, rotura en taller, devolución a proveedor o ajuste por conteo físico). Integra la cotización y venta de lentes completos (armazón + micas + tratamientos), control de anticipos (enganches) y emisión de ticket de venta térmico.

## 2. Objetivo y problema

**Objetivo de negocio.**
Permitir a la óptica tener visibilidad y control confiable de sus existencias físicas en minutos, sin trámites burocráticos de catalogación pesada, y agilizar la venta de mostrador vinculando prescripciones optométricas (SPEC-001) con anticipos, saldos pendientes y entrega de tickets claros al cliente.

**Problema del inventario caótico actual.**
1. **Embarques desordenados:** Los proveedores entregan cajas mezcladas de armazones con etiquetas rotas, sin código de barras, con descripciones variables o códigos de fabricante que cambian en cada pedido.
2. **Cuello de botella en el alta:** Si el personal tiene que capturar 15 campos obligatorios por armazón (marca, sub-marca, modelo, color, puente, varilla, calibre, material, proveedor, costo, precio...), las cajas se quedan semanas sin ingresar al sistema.
3. **Pérdida de trazabilidad en mostrador:** Al vender, no se encuentra el armazón en sistema porque nunca se dio de alta con exactitud, o se descuenta un producto genérico sin control de stock.
4. **Falta de mecanismo ágil de bajas:** Las roturas en taller, las mermas de exhibición o las piezas devueltas al proveedor no se descuentan a tiempo, falseando el stock real.

## 3. Alcance

### Dentro del alcance
- **Inventario práctico adaptativo:**
  - Alta rápida individual y por lote (Fast-Intake): generación de código interno secuencial único (ej. `ARM-0104`) con etiqueta imprimible.
  - Soporte para código de barras de proveedor si existe, o código autogenerado si no existe.
  - Agrupación por gamas de precio / familias cuando no se cuenta con modelo exacto.
  - Catálogo de productos: Armazones, Lentes de contacto, Accesorios/Soluciones y Micas/Tratamientos parametrizados.
  - Bajas y ajustes de inventario con motivo obligatorio: `venta`, `merma_rotura`, `devolucion_proveedor`, `garantia`, `ajuste_conteo`.
  - Conteo ciego y reconciliación rápida de vitrina (escaneo físico vs existencia teórica).
- **Punto de Venta Óptico (POS):**
  - Configurador de lentes: Armazón (stock) + Micas (material: CR-39, Policarbonato, Alto Índice, etc.) + Tratamientos (Antirreflejante, Blue Block, Fotocromático) + Mano de obra/biselado.
  - Vinculación opcional con Prescripción emitida en SPEC-001 mediante folio de consulta o paciente.
  - Cotizaciones guardadas para pacientes.
  - Registro de ventas con anticipo (enganche), saldo restante y fecha prometida de entrega.
  - Métodos de pago múltiples: Efectivo, Tarjeta de Débito/Crédito, Transferencia (SPEI).
- **Ticket de venta térmico:**
  - Formato adaptable a impresoras POS (80 mm y 58 mm) y visualización en pantalla.
  - Desglose transparente: armazón, micas, tratamientos, anticipo pagado, saldo pendiente y promesa de entrega.

### Fuera del alcance
- Facturación electrónica CFDI 4.0 ante el SAT (SPEC-004).
- Seguimiento detallado de fases del taller de biselado / laboratorio óptico (SPEC-003).
- Compras a crédito de proveedores y cuentas por pagar complejas (módulo ERP posterior).
- Pasarelas de cobro online con tarjeta (Stripe/Openpay en web); el POS actual registra el cobro físico en terminal bancaria o efectivo.

## 4. Actores y Matriz de Permisos

| Rol | Descripción |
|---|---|
| `frontdesk:receptionist` | Realiza ventas, cotizaciones, consulta existencias, aplica anticipos e imprime tickets. |
| `inventory:manager` | Da altas rápidas, genera etiquetas, registra bajas por merma/rotura y realiza conteos. |
| `clinical:optometrist` | Consulta catálogo de micas/tratamientos y vincula prescripciones a cotizaciones. |
| `admin` | Consulta costos de compra, márgenes de ganancia, autoriza bajas extraordinarias y cancelaciones. |

### Matriz de operaciones

| Operación | `frontdesk` | `inventory:manager` | `optometrist` | `admin` |
|---|---|---|---|---|
| Alta rápida de producto / lote | No | Sí | No | Sí |
| Ver precio de venta al público | Sí | Sí | Sí | Sí |
| Ver costo de compra del proveedor | No | No | No | Sí |
| Registrar baja por merma / rotura | No | Sí | No | Sí |
| Realizar conteo y reconciliación | No | Sí | No | Sí |
| Crear cotización | Sí | No | Sí | Sí |
| Concretar venta y recibir anticipo | Sí | No | No | Sí |
| Registrar saldo / liquidación en entrega | Sí | No | No | Sí |
| Cancelar venta / revertir stock | No | No | No | Sí |

## 5. Escenarios de Uso

### 5.1 Alta Rápida de Embarque Desordenado (Fast-Intake)
**Given** el encargado de inventario recibe una caja con 30 armazones surtidos de un proveedor sin código uniforme  
**When** selecciona la categoría "Armazón", asigna gama de precio ($850 MXN) y marca "Generar códigos en serie" para 30 piezas  
**Then** el sistema crea 30 registros con folios únicos consecutivos (ej. `ARM-0201` a `ARM-0230`), incrementa el stock de esa gama y permite imprimir una hoja de etiquetas con código de barras para pegarlas de inmediato en las varillas.

### 5.2 Venta con Prescripción y Anticipo
**Given** un paciente atendido en gabinete con prescripción vigente (SPEC-001) pasa al mostrador  
**When** la secretaria escanea el armazón `ARM-0215`, selecciona micas "Policarbonato" con tratamiento "Antirreflejante + Filtro Azul", vincula el folio del paciente y registra un anticipo de $500 MXN en efectivo sobre un total de $1,450 MXN  
**Then** el sistema descuenta 1 unidad del armazón `ARM-0215`, crea la orden de venta en estado `pending_balance`, registra el pago de $500, calcula el saldo de $950 y emite el ticket térmico con la fecha tentativa de entrega.

### 5.3 Baja por Rotura en Exhibición / Taller (Merma)
**Given** un armazón se fractura durante el montaje o en manipulación en vitrina  
**When** el encargado escanea el código del armazón, selecciona tipo de baja "Merma por rotura", especifica el motivo y confirma  
**Then** el sistema descuenta inmediatamente la pieza de las existencias disponibles, genera un movimiento de auditoría de inventario inmutable y no permite que se venda dicha pieza.

### 5.4 Reconciliación Rápida por Escaneo Ciego
**Given** el encargado realiza el inventario semanal de una vitrina de 50 armazones  
**When** activa el modo "Conteo rápido" y pasa el lector de código de barras por cada pieza física presente  
**Then** el sistema compara las lecturas con el stock registrado, resalta piezas faltantes o sobrantes y genera un reporte de ajuste con un solo clic previa aprobación.

### 5.5 Liquidación de Saldo y Entrega
**Given** el paciente regresa por sus lentes terminados y tiene un saldo pendiente de $950 MXN  
**When** la recepcionista busca la orden por folio o nombre de paciente y registra el pago restante con tarjeta  
**Then** la orden pasa a estado `delivered_paid`, se genera el ticket de liquidación y se concluye el ciclo comercial.

## 6. Requisitos Funcionales Verificables

- **RF-101 (Identificador Interno Único):** Todo producto físico posee un código interno alfanumérico secuencial único (ej. `ARM-XXXXX`, `ACC-XXXXX`) generado automáticamente, independiente de si el proveedor incluye código propio.
- **RF-102 (Alta Rápida por Lotes):** Capacidad de ingresar N unidades en un solo paso definiendo categoría, marca/línea general y precio de venta, generando los N códigos correspondientes.
- **RF-103 (Catálogo Paramétrico de Micas):** Las micas y tratamientos se cotizan mediante matriz de reglas (Material x Tratamiento x Rango de graduación) sin requerir altas unitarias por graduación en el stock físico de armazones.
- **RF-104 (Control de Movimientos Inmutable):** Toda entrada, salida, venta, merma o ajuste crea un registro de movimiento (`InventoryMovement`) con actor, fecha, cantidad, motivo y costo/precio asociado.
- **RF-105 (Configurador de Lentes):** El módulo de venta permite combinar 1 armazón físico + 1 par de micas + N tratamientos + mano de obra, calculando automáticamente el importe total.
- **RF-106 (Venta con Saldo Pendiente):** Soporte nativo para anticipos mínimos configurables (ej. 50%), saldo restante, fecha de entrega y estados de orden: `quote` (cotización), `confirmed_deposit` (anticipo recibido), `ready_for_pickup` (listo para entrega), `completed` (liquidado y entregado), `cancelled` (cancelado con reversión de stock).
- **RF-107 (Múltiples Formas de Pago):** Cada pago (anticipo o liquidación) registra monto, método (`cash`, `card_debit`, `card_credit`, `transfer`), referencia bancaria opcional y cajero responsable.
- **RF-108 (Ticket Térmico Formateado):** Generación de ticket en texto plano o HTML optimizado para impresoras térmicas de 80 mm y 58 mm, con políticas de garantía y aviso de entrega.
- **RF-109 (Protección de Márgenes y Costos):** Los roles de mostrador (`frontdesk`) no tienen acceso en ninguna respuesta de API al costo del proveedor ni margen bruto (Principio P2 de minimización).
- **RF-110 (Bajas Ágiles por Merma):** Procedimiento en ≤ 3 clics para dar de baja piezas dañadas o devueltas al proveedor con motivo tipificado.

## 7. Plan de Licencias y Dependencias (P5)

- No se incorpora el framework completo de Medusa ni ERPNext. Se adoptan únicamente sus **patrones de diseño de catálogo (Product, Variant, PriceSet, InventoryItem)** modelados limpiamente en TypeScript y Prisma.
- Para la máquina de estados de órdenes de venta se evalúa **XState** (MIT) conforme a la recomendación de investigación D-008.
- Para el cálculo monetario se usan enteros (centavos) o tipos `Decimal` para evitar errores de coma flotante.
- Todas las dependencias son evaluadas bajo licencia MIT o Apache 2.0.
