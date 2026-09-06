---
id: SPEC-001
feature: Pacientes y Consultas Optométricas
status: Verificada
version: 1.1.0
fecha: 2026-09-06
---

# SPEC-001 — Pacientes y Consultas Optométricas

## 1. Resumen ejecutivo

Define el flujo mínimo viable para que un gabinete de optometría mexicano registre pacientes, documente consentimiento, abra una consulta, capture refracción OD/OI, emita prescripción óptica y entregue a secretaría un resumen seguro para continuar la atención comercial. Es la base del expediente clínico del CRM.

## 2. Objetivo y problema

**Objetivo de negocio.** Permitir al equipo de gabinete crear y consultar el expediente del paciente, documentar la exploración refractiva y generar una prescripción clara, mientras la secretaría accede únicamente a la información necesaria para atender en mostrador sin exponer datos clínicos sensibles.

**Problema actual.** Las graduaciones y prescripciones se registran en papel o hojas de cálculo dispersas. No hay trazabilidad de quién capturó o modificó un valor, no existe control de versiones y no se limita qué ve cada rol. Esto genera riesgo clínico, pérdida de información y posibles incumplimientos de privacidad.

## 3. Alcance

### Dentro del alcance

- Registro y búsqueda de pacientes.
- Captura y versión del consentimiento informado y aviso de privacidad.
- Apertura de una consulta optométrica.
- Captura de refracción optométrica para ojo derecho (OD) y ojo izquierdo (OI).
- Emisión de prescripción óptica.
- Generación de un resumen seguro para secretaría/mostrador.

### Fuera del alcance

- Ventas, cotizaciones, anticipos, saldos y tickets (SPEC-002).
- Inventario de armazones, micas, tratamientos y lentes de contacto (SPEC-002/003).
- Órdenes de laboratorio, etapas de producción y control de calidad (SPEC-003).
- Facturación electrónica (CFDI 4.0) y estados fiscales (SPEC-004).
- Notificaciones por WhatsApp, SMS o correo electrónico.
- Agenda, citas y sala de espera.
- Reportes analíticos y estadísticos.
- Firma electrónica avanzada o biométrica del paciente.
- Visualización o revisión de la auditoría de accesos (la generación de registros de auditoría sí está cubierta por RF-010).

## 4. Actores y matriz de operaciones por rol

| Actor | Rol |
|---|---|
| Optometrista | `clinical:optometrist` |
| Asistente de gabinete | `clinical:assistant` |
| Secretaria / recepcionista | `frontdesk:receptionist` |
| Administrador | `admin` |
| Paciente | `patient:self` |

### Matriz de operaciones sobre datos de SPEC-001

| Operación | `clinical:optometrist` | `clinical:assistant` | `frontdesk:receptionist` | `admin` |
|---|---|---|---|---|
| Crear paciente | Sí | Sí | No | No |
| Editar paciente | Sí | Sí | No | No |
| Buscar paciente | Sí | Sí | Sí (lista blanca) | Sí |
| Ver expediente clínico completo | Sí | No | No | No |
| Abrir consulta | Sí | No | No | No |
| Emitir prescripción / abandonar consulta | Sí | No | No | No |
| Liberar consulta `in_progress` bloqueada | No | No | No | Sí |
| Capturar refracción | Sí | No | No | No |
| Editar refracción (enmienda) | Sí | No | No | No |
| Emitir prescripción | Sí | No | No | No |
| Ver prescripción completa | Sí | No | No | No |
| Ver resumen seguro de consulta | Sí | Sí | Sí | Sí |
| Gestionar usuarios y roles | No | No | No | Sí |
| Ver auditoría de accesos | No | No | No | Sí |

**Notas de alcance.** El rol `clinical:assistant` no captura signos vitales en SPEC-001 (no fueron solicitados por el gabinete y quedan fuera del alcance). El rol `patient:self` queda fuera del alcance de esta versión.

**Auditoría.** La generación de registros de auditoría (`AuditLog`) está dentro del alcance de SPEC-001 (RF-010). La visualización o revisión de la auditoría de accesos queda fuera de SPEC-001 y se abordará en el módulo de administración correspondiente.

## 5. Escenarios

### 5.1 Registro de paciente nuevo
**Given** la optometrista está autenticada y en la pantalla de registro  
**When** ingresa nombre completo, fecha de nacimiento, teléfono, correo opcional, sexo y acepta el aviso de privacidad  
**Then** el sistema crea el expediente, asigna un folio único, registra el consentimiento con fecha, hora, usuario y origen de la solicitud, y muestra confirmación.

### 5.2 Búsqueda de paciente existente
**Given** la secretaría necesita localizar un expediente  
**When** ingresa nombre parcial, teléfono parcial o folio exacto  
**Then** el sistema muestra coincidencias ordenadas por relevancia sin exponer graduación, diagnóstico ni historial clínico.

### 5.3 Apertura de consulta
**Given** el paciente tiene expediente activo y no existe otra consulta abierta  
**When** la optometrista inicia una consulta  
**Then** el sistema guarda fecha y hora de inicio, usuario responsable, estado `in_progress` ("En progreso") e impide la edición simultánea por otro usuario.

### 5.4 Captura de refracción OD/OI
**Given** la consulta está en progreso  
**When** la optometrista captura esfera, cilindro, eje, adición, agudeza visual y distancia pupilar para OD y OI  
**Then** cada valor queda asociado a la consulta con timestamp y usuario; el sistema valida rangos, unidades y consistencia.

### 5.5 Emisión de prescripción
**Given** la consulta tiene refracción válida registrada para ambos ojos (OD y OI), incluyendo valores neutros explícitos cuando apliquen  
**When** la optometrista confirma diagnóstico, uso recomendado (lejos, cerca, bifocal, progresivo) y observaciones  
**Then** el sistema genera prescripción con folio correlativo, fecha, optometrista responsable, sello de emisión y transiciona la consulta a estado `closed` ("Cerrada").

### 5.6 Resumen seguro para secretaría
**Given** la consulta existe  
**When** la secretaría consulta por folio de paciente o identificador de paciente  
**Then** solo ve nombre, folio, fecha de consulta, tipo de lente recomendado, estado y una nota no clínica de catálogo cerrado; no ve graduación, diagnóstico ni notas clínicas.

### 5.7 Corrección de una refracción ya guardada
**Given** una refracción fue guardada y posteriormente se detecta un error de captura  
**When** la optometrista solicita una enmienda con motivo  
**Then** el sistema conserva el registro original, crea una enmienda vinculada con autor, fecha, motivo y nuevos valores, y deja trazabilidad completa.

### 5.8 Intento de apertura con consulta ya abierta
**Given** el paciente ya tiene una consulta en estado `in_progress` ("En progreso")  
**When** un usuario con rol `clinical:optometrist` intenta abrir una nueva consulta para el mismo paciente  
**Then** el sistema rechaza la operación, muestra la consulta activa existente con responsable y hora de inicio, y registra el intento en auditoría.

### 5.9 Consulta abandonada o cancelada
**Given** una consulta está `in_progress` ("En progreso") y no se concretó la atención  
**When** la optometrista marca la consulta como `abandoned` ("Abandonada") con motivo  
**Then** el sistema cierra la consulta, impide su edición posterior y la excluye de contadores de prescripción emitida.

### 5.10 Refracción inválida
**Given** la consulta está en progreso  
**When** la optometrista captura una combinación inválida (por ejemplo, cilindro distinto de cero sin eje)  
**Then** el sistema rechaza el guardado, muestra el campo problemático y no permite emitir prescripción hasta corregirlo.

### 5.11 Acceso no autorizado a datos clínicos
**Given** la secretaría consulta un expediente  
**When** solicita un recurso que expone graduación, diagnóstico o historial clínico  
**Then** el sistema responde con 403/404 genérico, no expone datos sensibles y registra el acceso denegado en auditoría.

### 5.12 Consentimiento no registrado
**Given** un usuario intenta capturar refracción o emitir prescripción  
**When** no existe consentimiento vigente para el paciente  
**Then** el sistema bloquea la acción, solicita registrar la aceptación del aviso de privacidad y no persiste datos clínicos.

## 6. Requisitos funcionales verificables

### RF-001 Registro de paciente
El sistema debe permitir crear un paciente con: nombre(s), apellido paterno, apellido materno opcional, fecha de nacimiento, sexo, teléfono principal, correo electrónico opcional, dirección opcional, alergias/condiciones opcionales y contacto de emergencia opcional.

### RF-002 Folio único
Cada paciente recibe un folio único legible de 8 caracteres alfanuméricos. El folio se genera mediante un esquema determinista verificable (prefijo de sucursal + contador interno con relleno) o, si se usa aleatoriedad, la base de datos debe garantizar la restricción `UNIQUE` sobre la columna de folio y rechazar inserciones duplicadas. No se aceptan garantías basadas únicamente en probabilidad matemática.

### RF-003 Consentimiento y re-consentimiento
Antes de crear o editar datos clínicos, el sistema debe registrar la versión vigente del aviso de privacidad y consentimiento aceptada, con fecha, hora, usuario, IP u origen de la solicitud.

- **Consentimiento inicial:** se registra al crear el expediente o, como máximo, antes de la primera captura clínica. Debe vincularse a un `PrivacyNotice` vigente (`noticeId`).
- **Re-consentimiento:** se requiere cuando cambia la versión vigente del aviso de privacidad, cuando se solicita editar datos clínicos existentes (incluyendo enmiendas de refracción o prescripción), o cuando transcurre el plazo definido por el área legal.
- **`hasValidConsent`:** una validación es positiva solo si existe un consentimiento vigente para el paciente **y** su `noticeId` coincide con el `PrivacyNotice` vigente actual. Si el aviso cambió, la validación es negativa y se solicita re-consentimiento antes de cualquier escritura clínica o enmienda.
- **Edición de datos personales:** `updatePatient` no requiere re-consentimiento clínico, pero debe registrar `ActorContext` y versión.
- **Pendiente legal:** el texto exacto del aviso de privacidad, el formato de consentimiento y la periodicidad de re-consentimiento deben ser validados y aprobados por asesoría legal antes de ponerse en producción. SPEC-001 solo exige el mecanismo técnico de registro y bloqueo.

### RF-004 Búsqueda (lista blanca)
La búsqueda debe soportar nombre parcial, teléfono parcial (mínimo 4 dígitos) y folio exacto, devolviendo resultados en menos de 500 ms (p95) para una base de 100,000 pacientes.

**Lista blanca de campos devueltos en resultados de búsqueda:** nombre completo del paciente, folio, fecha de nacimiento (sin edad exacta), teléfono parcial enmascarado (últimos 4 dígitos) y estado de la última consulta. No se devuelve graduación, diagnóstico, observaciones clínicas, correo completo ni dirección.

### RF-005 Ciclo de vida de consulta
Solo un usuario con rol `clinical:optometrist` puede abrir una consulta.

**Estados del ciclo de vida (canónicos):**
- `in_progress`: consulta abierta y editable únicamente por el responsable.
- `closed`: consulta completada con prescripción emitida; solo lectura y enmiendas.
- `abandoned`: consulta cerrada sin prescripción por cancelación, no-show u otro motivo; solo lectura.

**Reglas de concurrencia:**
- No pueden existir dos consultas en estado `in_progress` para el mismo paciente simultáneamente.
- Una consulta `in_progress` solo puede ser editada por el usuario que la abrió, salvo que un administrador libere la sesión explícitamente (queda registrado en auditoría).
- El sistema debe detectar ediciones simultáneas mediante control de concurrencia (versión de registro o bloqueo optimista) y rechazar sobrescritas perdidas.

### RF-006 Refracción OD/OI
La consulta debe permitir capturar, por cada ojo:

| Campo | Convención / rango | Resolución |
|---|---|---|
| Esfera | -30.00 D a +30.00 D | ±0.25 D |
| Cilindro | Negativa: 0.00 a -10.00 D (convención estándar para SPEC-001) | ±0.25 D |
| Eje | 0° a 180° | 1° |
| Adición | 0.00 D a +5.00 D | ±0.25 D |
| Agudeza visual | Snellen (ej. 20/20, 20/40) o decimal (0.1 a 1.2+). El sistema debe almacenar el formato capturado y, si es posible, equivalencia decimal. | Según formato |
| Distancia pupilar | 30 mm a 80 mm | 1 mm |

El cilindro siempre se registra en valor negativo; no se permiten valores positivos de cilindro en SPEC-001.

### RF-007 Validaciones de refracción
El sistema debe rechazar valores fuera de rango, combinaciones inconsistentes (por ejemplo, cilindro distinto de cero sin eje) y requerir una refracción válida registrada para ambos ojos (OD y OI) antes de permitir la emisión de prescripción. Se aceptan valores neutros explícitos (esfera `0.00` y cilindro `0.00`) siempre que se registren formalmente para el ojo correspondiente.

### RF-008 Prescripción
La prescripción debe incluir: datos del paciente, fecha de emisión, optometrista responsable, **snapshot inmutable de la refracción OD/OI** vigente al momento de la emisión, uso recomendado, observaciones y folio de prescripción correlativo por sucursal.

**Mínimos de emisión:** para emitir una prescripción, la consulta debe contar con refracción válida para ambos ojos, uso recomendado seleccionado y optometrista responsable confirmado. La emisión de la prescripción transiciona la consulta a estado `closed`. La prescripción base inicia su `version` en `1`.

**Snapshot de refracción:** la prescripción almacena una copia de los valores refractivos aplicables al momento de la emisión, de modo que futuras enmiendas de la refracción no modifiquen la prescripción ya emitida. El snapshot no es un registro mutable; las correcciones posteriores se modelan como enmiendas (RF-011).

### RF-009 Resumen seguro (lista blanca)
El resumen para roles no clínicos debe contener únicamente: nombre del paciente, folio, fecha de consulta, tipo de lente recomendado (lejos, cerca, bifocal, progresivo, contacto), estado (`in_progress` / `closed` / `abandoned`) y, opcionalmente, una nota no clínica seleccionada de un catálogo cerrado.

La nota no clínica se asigna o remueve mediante la operación `setNonClinicalNote(consultationId, noteKey, actor, expectedVersion)`, que recibe `ActorContext` y genera traza de auditoría. No se permiten notas libres de texto.

**Catálogo cerrado de notas no clínicas (v1):**
- "Paciente solicita cita de seguimiento"
- "Paciente trae receta externa"
- "Requiere contacto posterior"
- "Preferencia de contacto por teléfono"
- "Preferencia de contacto por correo"

No se permiten notas libres de texto en el resumen seguro.

### RF-010 Auditoría
Toda creación, lectura, modificación o enmienda de datos clínicos debe generar registro de auditoría con: actor, acción, entidad, identificador de registro, `requestId`, timestamp y razón de cambio cuando aplique.

Las acciones de auditoría incluyen, como mínimo: `create`, `read`, `update`, `amend`, `delete_attempt`, `ACCESS_DENIED`, `LOGIN`, `LOGOUT` y `SESSION_INVALIDATED`.

### RF-011 Corrección de errores
Las correcciones a una refracción o prescripción ya guardada se registran como enmiendas con referencia al registro original (`amendedFromId`), autor, fecha, motivo (`amendmentReason`) e incremento de `version`; el registro original permanece accesible e inmutable.

- Las enmiendas de refracción crean un nuevo registro `Refraction` con `isAmendment = true`.
- Las enmiendas de prescripción crean un nuevo registro `Prescription` con `isAmendment = true`. La prescripción base de la consulta (`isAmendment = false`) no se modifica.
- Antes de ejecutar una enmienda se debe verificar `hasValidConsent` contra el `PrivacyNotice` vigente; si el aviso cambió, se requiere re-consentimiento.

## 7. Datos sensibles

Conforme al principio P2 de la Constitución, los siguientes datos se tratan como sensibles y están sujetos a minimización:

- Nombre completo, fecha de nacimiento, CURP (cuando se agregue) e identificador oficial.
- Teléfono, correo electrónico, dirección y contacto de emergencia.
- Graduación (esfera, cilindro, eje, adición, distancia pupilar), agudeza visual, diagnóstico, observaciones clínicas, alergias y condiciones.
- Historial de consultas y prescripciones.
- Consentimientos y avisos de privacidad.

Restricciones:

- La secretaría no accede a graduación, diagnóstico ni historial clínico.
- Los datos sensibles no se registran en logs de aplicación ni en mensajes de error públicos.
- La auditoría registra el acceso pero no el contenido detallado de la graduación.

## 8. Derechos ARCO (v1)

Conforme a la legislación federal mexicana vigente de protección de datos personales, el sistema debe contemplar los derechos ARCO con los siguientes límites en SPEC-001:

| Derecho | Alcance en v1 | Límite |
|---|---|---|
| **Acceso** | El paciente puede solicitar copia de su expediente clínico y prescripciones. | La entrega se realiza fuera de la plataforma (formato impreso o PDF generado por administrador); no hay portal de paciente en v1. |
| **Rectificación** | El paciente puede solicitar corrección de datos personales o clínicos. | Las correcciones clínicas se materializan como enmiendas con trazabilidad; no se borra el registro original. |
| **Cancelación** | El paciente puede solicitar la baja de sus datos personales. | No se elimina el expediente clínico por obligaciones legales de conservación; se marca como "inactivo para contacto comercial" cuando aplique. |
| **Oposición** | El paciente puede oponerse al uso de datos para fines comerciales. | En v1 no hay módulo de marketing ni promociones; la oposición se registra como indicador en el expediente para specs futuras. |

El procedimiento formal para ejercer derechos ARCO queda como **pendiente legal**: el área legal debe definir el medio de solicitud, plazos de respuesta y formato de acuse.

## 9. Dependencias y contratos afectados

| Dependencia / Contrato | Tipo | Estado | Notas |
|---|---|---|---|
| Módulo `patients` | Interno | Nuevo | Ficha, contacto y consentimiento. |
| Módulo `clinical` | Interno | Nuevo | Consultas, refracción, prescripción, notas. |
| Módulo `auth` | Interno | Pendiente | Contrato mínimo definido en esta sección. |
| NOM-004-SSA3-2012 | Legal | Referencia | Del expediente clínico; validar aplicabilidad con asesoría profesional antes de producción. |
| NOM-024-SSA3-2012 | Legal | Referencia | Del expediente clínico electrónico; validar aplicabilidad con asesoría profesional. |
| Legislación federal vigente de protección de datos personales | Legal | Referencia | Aviso de privacidad, consentimiento y derechos ARCO; validar texto y obligaciones con asesoría legal. |

### Contrato mínimo del módulo `auth` para SPEC-001

El módulo `auth` es un **boundary externo** para SPEC-001: `patients` y `clinical` solo lo consumen a través de `contracts/auth.contract.ts`. No implementa login, logout ni flujos de registro de usuarios; esos eventos se modelan como entradas de auditoría (`AuthAction`) y se persisten vía `recordAudit`.

El módulo `auth` debe proveer al menos:

1. **Identidad de usuario:** identificador único, nombre para mostrar y correo.
2. **Rol asignado:** uno de `clinical:optometrist`, `clinical:assistant`, `frontdesk:receptionist`, `admin`.
3. **Token de sesión:** con expiración y capacidad de invalidación; no debe contener datos clínicos.
4. **Verificación de sesión:** una operación documentada que devuelva identidad y rol activo, rechazando tokens expirados o invalidados.
5. **Invalidación de sesión:** operación documentada para marcar un token como no usable (logout forzado o revocación).
6. **Decisiones de permiso:** el módulo `auth` puede entregar el rol y dejar la autorización de recursos a `clinical`/`patients`, o exponer una función `can(session, action, resource)` documentada.
7. **Auditoría de sesión:** login, logout e invalidaciones deben ser registrables.

SPEC-001 no asume proveedor de identidad específico ni implementa auth; solo consume este contrato.

Esta spec no incorpora dependencias externas copyleft. XState (D-008) y Casbin (D-007) están pendientes de spike y no se asumen.

## 10. Estrategia de pruebas

- **Unitarias:** validaciones de rangos de refracción (ambos ojos y valores neutros explícitos), generación de folios, lógica de resumen seguro.
- **Integración:** flujo completo paciente → consulta → refracción OD/OI → prescripción → resumen de secretaría por folio y por `patientId`, incluyendo escenarios alternativos y de error.
- **Permisos:** intento de secretaria para ver graduación debe ser rechazado; intento de asistente para emitir prescripción debe ser rechazado.
- **Auditoría:** verificar que toda lectura y escritura clínica genera traza con `ActorContext` (`actorId`, `role`, `requestId`).
- **Enmienda:** modificar una refracción o prescripción ya guardada genera registro de enmienda sin borrar original.
- **Ciclo de vida:** verificar transiciones `in_progress → closed` (vía `issuePrescription`) y `in_progress → abandoned` (vía `abandon`), liberación administrativa de consulta bloqueada, y bloqueo de edición en estados finales.
- **Concurrencia:** simular dos usuarios editando la misma consulta con `expectedVersion` y confirmar que se rechaza la sobrescritura perdida.
- **Rendimiento:** búsqueda de paciente y resumen por folio/patientId ≤ 500 ms (p95) con 100,000 registros sintéticos.
- **Usabilidad:** flujo usable en móvil (375 px) y tablet táctil (768 px) sin depender de hover.

## 11. Criterios de éxito medibles

| Métrica | Objetivo | Método de medición |
|---|---|---|
| Tiempo de registro de paciente nuevo | ≤ 60 segundos en tablet | Prueba con 5 usuarios |
| Tiempo de búsqueda de paciente | ≤ 500 ms (p95) | Benchmark con 100k registros sintéticos |
| Cobertura de permisos en pruebas | 100% de endpoints que exponen datos sensibles | Reporte de cobertura |
| Trazabilidad de cambios clínicos | 100% de escrituras con auditoría | Revisión de logs de auditoría |
| Errores de captura de refracción reducidos | ≤ 1% de consultas con valores fuera de rango | Métrica en ambiente controlado |
| Satisfacción de secretaria con resumen seguro | ≥ 4/5 | Encuesta interna |

## 12. Supuestos, fuera de alcance y riesgos

### Supuestos

- Existe al menos un usuario autenticado con rol `clinical:optometrist` para abrir consultas.
- El aviso de privacidad y formato de consentimiento serán proporcionados por el área legal/clínica.
- La primera versión opera en una sola sucursal; multi-sucursal se trata en specs futuras.
- Los dispositivos objetivo son móvil (375 px) y tablet (768 px).

### Riesgos

- **Riesgo legal:** Interpretación incorrecta de NOM-004/NOM-024 o texto de consentimiento. Mitigación: asesoría profesional antes de producción.
- **Riesgo de privacidad:** Fuga de graduación al resumen de secretaría. Mitigación: pruebas de permisos automatizadas y lista blanca estricta.
- **Riesgo de calidad de datos:** Captura de refracción inconsistente. Mitigación: validaciones estrictas en frontend y backend.
- **Riesgo de adopción:** Resistencia del gabinete a dejar el papel. Mitigación: flujo táctil simple y mensajes claros.
- **Riesgo de concurrencia:** Sobrescritura perdida entre dos optometristas. Mitigación: control de versión en consultas y prescripciones.

## 13. Decisiones de reutilización y licencias

Esta spec no incorpora nuevas dependencias externas. El expediente clínico se construye propio conforme a decisión D-001. XState (D-008) y Casbin (D-007) quedan pendientes de spike y no se asumen.

## 14. Historial de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1.1.0 | 2026-09-06 | Verificada y Cerrada: Implementación completa de T001..T054. API routes HTTP reales, pantallas de gabinete y mostrador en Next.js App Router, accesibilidad WCAG 2.1 AA, navegación por roles, pruebas E2E automatizadas (85 tests pasando), SBOM y reporte de usabilidad. |
| 1.1.0-rev | 2026-09-04 | NO-GO resuelto: bootstrap de pruebas antes de tests RED; liberación administrativa de consulta bloqueada; endpoints de consentimiento/update/abandon/enmiendas/setNonClinicalNote; validación con usuarios y métricas de calidad; accesibilidad WCAG/teclado/contraste; `Patient.version`; snapshot inmutable de refracción en prescripción; casing canónico de estados (`in_progress`/`closed`/`abandoned`) y acciones de auditoría (`ACCESS_DENIED`/`LOGIN`/`LOGOUT`/`SESSION_INVALIDATED`); mapa de tareas ↔ plan. |
| 1.0.2 | 2026-09-03 | Correcciones pre-tareas: operación `setNonClinicalNote` y catálogo cerrado con actor/auditoría; unicidad de `Prescription` vs enmiendas con versionado; `AuditAction` extendido con `ACCESS_DENIED`, `LOGIN`, `LOGOUT`, `SESSION_INVALIDATED` y `requestId`. |
| 1.0.1 | 2026-09-03 | Revisión post-NO-GO: ActorContext en lecturas/escrituras; `issuePrescription` como transición a `Cerrada`; `abandon` a `Abandonada`; `expectedVersion` en mutaciones; resumen seguro por folio/patientId; refracción válida para ambos ojos con valores neutros explícitos; boundary de auth e invalidación de sesiones documentados. |
| 1.0.0 | 2026-09-03 | Versión inicial. |
