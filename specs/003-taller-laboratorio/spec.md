---
id: SPEC-003
feature: Taller de Biselado y Laboratorio Óptico
status: Verificada
version: 1.0.0
fecha: 2026-09-06
---

# SPEC-003 — Taller de Biselado y Laboratorio Óptico

## 1. Resumen ejecutivo

Define el flujo de manufactura, montaje y control de calidad de lentes oftálmicos. Vincula las órdenes de venta con anticipo de SPEC-002 con la orden de trabajo de laboratorio (`LabOrder`). Proporciona una **ficha técnica agnóstica** (apta tanto para taller interno de biselado como para maquila en laboratorio externo), **boleta de charola imprimible**, **tablero Kanban de producción**, **aprobación de calidad en 1 clic** (que libera automáticamente la orden para entrega en mostrador) y **gestión estricta de mermas/roturas con alerta visual inmediata** en la pantalla de pedidos de la secretaria.

## 2. Objetivo y problema

**Objetivo de negocio.**
Asegurar que ningún trabajo se extravíe entre mostrador y taller, garantizar que los lentes cumplan la graduación exacta antes de ser entregados al paciente, y alertar oportunamente a mostrador si ocurre una rotura de material para evitar promesas incumplidas.

**Problemas actuales en ópticas independientes.**
1. **Pérdida de recetas y notas en papel:** Las especificaciones de biselado, distancias pupilares y alturas se anotan en papeles sueltos que se mojan o extravían en el taller.
2. **Incertidumbre sobre maquila:** Si un trabajo se envía a un laboratorio externo, el mostrador no sabe en qué fecha regresará ni qué mensajería o guía lo ampara.
3. **Falta de filtro de calidad previo a la entrega:** Pacientes que llegan a recoger sus lentes y descubren que el eje está chueco o la graduación desfasada porque nadie verificó en frontofocómetro antes de entregar.
4. **Roturas ocultas:** Cuando un biselador quiebra un armazón o mica, frecuentemente no avisa a mostrador hasta que el cliente llega a recoger sus lentes.

## 3. Alcance

### Dentro del alcance
- **Ficha Técnica de Laboratorio (`LabOrder`):**
  - Vinculación obligatoria con `SaleOrder` (SPEC-002) y datos del paciente.
  - Receta de montaje completa: Esfera, Cilindro, Eje, Adición, Distancia Pupilar (monocular/nasopupilar) y Alturas focales (centro óptico / oblea).
  - Especificaciones del armazón: código interno (`ARM-XXXX`), tipo de aro (cerrado, ranurado/nylor, al aire/tres piezas).
  - Especificaciones de micas y tratamientos: material, diseño (monofocal, bifocal, progresivo), tratamientos y curvatura base.
  - Asignación de destino agnóstica:
    - `internal_workshop`: Taller propio en el local.
    - `external_lab`: Maquila externa (nombre del laboratorio proveedor, folio externo y fecha prometida de retorno).
- **Boleta de Charola Imprimible:**
  - Formato compacto (ticket o media carta) con datos técnicos para acompañar físicamente la charola plástica de montaje.
- **Tablero Kanban de Producción:**
  - Estados: `queued` (en cola) → `in_process` (en biselado o en maquila) → `quality_control` (revisión en frontofocómetro) → `completed` (aprobado y listo para entregar) / `rework_needed` (en repetición).
- **Control de Calidad en 1 Clic:**
  - Botón *"✓ Calidad Aprobada"*: cambia la orden de laboratorio a `completed` y transiciona automáticamente la orden de venta en mostrador (`SaleOrder`) a `ready_for_delivery`.
  - Botón *"⚠️ Rechazado / Repetición"*: solicita motivo del rechazo y pasa a `rework_needed`.
- **Merma Estricta y Alerta en Mostrador:**
  - Registro de rotura que descuenta inventario (`damage_breakage`).
  - Alerta visible tipo badge en mostrador: *"⚠️ En Repetición por Merma"* con actualización de días de entrega.

### Fuera del alcance
- Conexión digital directa por protocolo OMA/VCA con biseladoras automáticas CNC (módulo industrial futuro).
- Facturación electrónica CFDI 4.0 (SPEC-005).
- Corte y arqueo de caja diario (SPEC-004).

## 4. Actores y Permisos

| Rol | Capacidades en SPEC-003 |
|---|---|
| `frontdesk:receptionist` | Consulta estado de taller, ve alertas de repetición e imprime boleta de charola. |
| `inventory:manager` | Suministra micas/armazones al taller y registra mermas de almacén. |
| `clinical:optometrist` | Consulta estado de manufactura de recetas que emitió. |
| `laboratory:technician` (o admin) | Cambia estados en Kanban, asigna maquila externa y aprueba control de calidad en 1 clic. |
| `admin` | Autoriza cancelaciones de órdenes de taller y consulta mermas acumuladas. |

## 5. Requisitos Funcionales Verificables

- **RF-201 (Creación Automática de Orden de Taller):** Al confirmarse una venta de lentes en SPEC-002 (`confirmed_in_process`), se crea automáticamente una `LabOrder` asociada en estado `queued`.
- **RF-202 (Ficha Técnica Completa):** La orden incluye graduación OD/OI, DP, alturas, tipo de bisel y código del armazón.
- **RF-203 (Modalidad Agnóstica Taller / Maquila):** Permite indicar si la orden se procesa en el local o en laboratorio externo con fecha prometida de entrega del proveedor.
- **RF-204 (Boleta de Charola Imprimible):** Generación de comprobante técnico en texto/HTML listo para imprimir y meter a la charola de trabajo.
- **RF-205 (Aprobación de Calidad en 1 Clic):** La aprobación física en frontofocómetro se confirma con 1 clic en el sistema, transicionando la `SaleOrder` a `ready_for_delivery`.
- **RF-206 (Merma con Alerta en Mostrador):** Ante una rotura, se genera movimiento de inventario `damage_breakage`, la orden pasa a `rework_needed` y la pantalla de mostrador resalta la alerta en color distintivo.
- **RF-207 (Trazabilidad y Auditoría):** Cada cambio de estación en el tablero Kanban registra técnico, fecha, hora y notas.
