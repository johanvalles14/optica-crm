---
id: DATA-MODEL-001
feature: Pacientes y Consultas Optométricas
status: Revisada
version: 1.1.0
fecha: 2026-09-04
---

# Modelo de datos conceptual — SPEC-001

> Este documento conserva el modelo conceptual. El schema físico inicial ejecutable se encuentra en `prisma/schema.prisma`; ambos deben mantenerse trazables antes de crear migraciones.

## 1. Entidades principales

### 1.1 Patient (Paciente)

Representa la ficha de un paciente. Datos personales y contacto.

| Atributo | Tipo conceptual | Obligatorio | Notas | RF |
|---|---|---|---|---|
| id | UUID / ULID interno | Sí | No expuesto en URLs ni búsquedas | RF-002 |
| folio | string(8) alfanumérico | Sí | Único legible; UNIQUE en BD | RF-002 |
| branchId | referencia | Sí | Sucursal emisora del folio (v1 una sola sucursal) | RF-002 |
| firstName | string | Sí | | RF-001 |
| lastName | string | Sí | Apellido paterno | RF-001 |
| middleName | string | No | Apellido materno opcional | RF-001 |
| birthDate | date | Sí | | RF-001 |
| sex | enum | Sí | Valores controlados por catálogo | RF-001 |
| phone | string | Sí | Teléfono principal | RF-001 |
| email | string | No | Opcional | RF-001 |
| address | string | No | Opcional | RF-001 |
| allergies | string | No | Opcional; dato sensible | RF-001 |
| conditions | string | No | Opcional; dato sensible | RF-001 |
| emergencyContact | objeto anidado | No | Nombre y teléfono | RF-001 |
| isContactAllowed | boolean | Sí | Indicador de oposición comercial (ARCO) | RF-001, ARCO |
| status | enum | Sí | `active`, `inactive_for_contact` | ARCO |
| version | integer | Sí | Control de concurrencia para ediciones de ficha | RF-005 |
| createdAt / updatedAt | timestamp | Sí | | RF-010 |
| createdBy / updatedBy | referencia a User | Sí | | RF-010 |

**Constraints:**
- `folio` UNIQUE.
- Índice en `(lastName, firstName)` para búsqueda parcial.
- Índice en `phone` para búsqueda parcial (mínimo 4 dígitos).
- Índice único en `folio` para búsqueda exacta.

### 1.2 PrivacyNotice (Aviso de privacidad)

Versión vigente del aviso de privacidad.

| Atributo | Tipo conceptual | Obligatorio | Notas | RF |
|---|---|---|---|---|
| id | UUID | Sí | | RF-003 |
| version | string | Sí | SemVer o fecha | RF-003 |
| contentHash | string | Sí | Hash del texto para inmutabilidad | RF-003 |
| effectiveDate | timestamp | Sí | | RF-003 |
| createdBy | referencia a User | Sí | | RF-010 |

### 1.3 Consent (Consentimiento)

Aceptación del aviso de privacidad por paciente.

| Atributo | Tipo conceptual | Obligatorio | Notas | RF |
|---|---|---|---|---|
| id | UUID | Sí | | RF-003 |
| patientId | referencia | Sí | | RF-003 |
| noticeId | referencia | Sí | Versión aceptada | RF-003 |
| grantedAt | timestamp | Sí | Fecha/hora de aceptación | RF-003 |
| grantedBy | referencia a User | Sí | Usuario que registró la aceptación | RF-003 |
| source | string | Sí | IP u origen de solicitud | RF-003 |
| revokedAt | timestamp | No | Null si vigente | RF-003 |

**Constraints:**
- Un paciente puede tener múltientes consentimientos (historial).
- Máximo un consentimiento vigente por paciente (constraint parcial o validación en código).
- Sin consentimiento vigente no se permite escritura clínica.

### 1.4 Consultation (Consulta)

Ciclo de vida de una atención optométrica.

| Atributo | Tipo conceptual | Obligatorio | Notas | RF |
|---|---|---|---|---|
| id | UUID | Sí | | RF-005 |
| patientId | referencia | Sí | | RF-005 |
| branchId | referencia | Sí | | RF-005 |
| status | enum | Sí | `in_progress`, `closed`, `abandoned` | RF-005 |
| openedAt | timestamp | Sí | | RF-005 |
| openedBy | referencia a User | Sí | Optometrista responsable | RF-005 |
| closedAt | timestamp | No | | RF-005 |
| closedBy | referencia a User | No | | RF-005 |
| abandonmentReason | string | No | Solo si `status = abandoned` | RF-005 |
| nonClinicalNoteKey | string | No | Clave del catálogo cerrado (`NonClinicalNote`); se asigna vía `setNonClinicalNote` | RF-009 |
| version | integer | Sí | Control de concurrencia | RF-005 |
| createdAt / updatedAt | timestamp | Sí | | RF-010 |

**Operaciones sobre nota no clínica:**
- `setNonClinicalNote(consultationId, noteKey, actor, expectedVersion)`: asigna o remueve (`null`) una nota del catálogo cerrado, registrando actor y motivo en `AuditLog`. Solo lecturas/escrituras del resumen seguro usan este campo.

**Constraints:**
- Solo una consulta `in_progress` por paciente.
- `in_progress` editable solo por `openedBy` (salvo liberación por admin auditada).
- Transiciones permitidas: `in_progress → closed`, `in_progress → abandoned`.
- Estados finales solo lectura.

### 1.5 Refraction (Refracción)

Valores refractivos de una consulta, por ojo.

| Atributo | Tipo conceptual | Obligatorio | Notas | RF |
|---|---|---|---|---|
| id | UUID | Sí | | RF-006 |
| consultationId | referencia | Sí | | RF-006 |
| eye | enum | Sí | `OD` (derecho), `OI` (izquierdo) | RF-006 |
| sphere | decimal | No | -30.00 a +30.00, paso 0.25 | RF-006 |
| cylinder | decimal | No | 0.00 a -10.00, paso 0.25 (negativo) | RF-006 |
| axis | integer | No | 0° a 180° | RF-006 |
| addition | decimal | No | 0.00 a +5.00, paso 0.25 | RF-006 |
| visualAcuity | string | No | Snellen o decimal | RF-006 |
| visualAcuityDecimal | decimal | No | Equivalencia decimal si aplica | RF-006 |
| pupillaryDistance | integer | No | 30 mm a 80 mm | RF-006 |
| isAmendment | boolean | Sí | Indica si es enmienda | RF-011 |
| amendedFromId | referencia | No | Refraction original (si es enmienda) | RF-011 |
| amendmentReason | string | No | Obligatorio si es enmienda | RF-011 |
| createdBy | referencia a User | Sí | | RF-010 |
| createdAt | timestamp | Sí | | RF-010 |

**Constraints:**
- Si `cylinder != 0`, `axis` es obligatorio.
- Para emitir prescripción debe existir una refracción válida registrada para ambos ojos (OD y OI). Se aceptan valores neutros explícitos (`sphere = 0.00`, `cylinder = 0.00`) si se registran formalmente para el ojo.
- Cilindro no positivo.
- Registro original inmutable; las correcciones son nuevos registros con `isAmendment = true`.

### 1.6 Prescription (Prescripción)

Documento formal generado al cerrar una consulta.

| Atributo | Tipo conceptual | Obligatorio | Notas | RF |
|---|---|---|---|---|
| id | UUID | Sí | | RF-008 |
| consultationId | referencia | Sí | Base única por consulta vía constraint parcial | RF-008 |
| patientId | referencia | Sí | | RF-008 |
| branchId | referencia | Sí | | RF-008 |
| folio | string | Sí | Correlativo por sucursal; UNIQUE | RF-008 |
| issuedAt | timestamp | Sí | | RF-008 |
| issuedBy | referencia a User | Sí | Optometrista | RF-008 |
| usage | enum | Sí | `lejos`, `cerca`, `bifocal`, `progresivo`, `contacto` | RF-008, RF-009 |
| rightEyeSnapshot | objeto anidado | Sí | Copia inmutable de la refracción OD aplicable al momento de la emisión | RF-008 |
| leftEyeSnapshot | objeto anidado | Sí | Copia inmutable de la refracción OI aplicable al momento de la emisión | RF-008 |
| snapshotSourceIds | referencia[] | Sí | IDs de `Refraction` (OD/OI) usados para el snapshot; garantiza trazabilidad | RF-008, RF-010 |
| snapshotTakenAt | timestamp | Sí | Momento de captura del snapshot | RF-010 |
| observations | string | No | Notas clínicas | RF-008 |
| isAmendment | boolean | Sí | | RF-011 |
| amendedFromId | referencia | No | | RF-011 |
| amendmentReason | string | No | | RF-011 |
| version | integer | Sí | Control de concurrencia para enmiendas | RF-008, RF-011 |
| createdAt | timestamp | Sí | | RF-010 |

**Constraints:**
- Una consulta `closed` debe tener exactamente una prescripción base (`isAmendment = false`); `abandoned` no genera prescripción.
- Las enmiendas **no son nuevas prescriptions** de la consulta: son registros vinculados (`isAmendment = true`, `amendedFromId` → original). Se garantiza con constraint parcial `UNIQUE(consultationId) WHERE isAmendment = false` (o validación equivalente).
- `folio` UNIQUE por sucursal; cada enmienda conserva o recibe su propio folio según política de negocio (a documentar).
- Prescripción base inmutable; correcciones vía enmienda.
- El snapshot de refracción es inmutable: al emitirse se copian los valores refractivos vigentes de OD/OI y se registran los `RefractionId` de origen, el timestamp de captura y la versión de la prescripción.

### 1.7 NonClinicalNote (Catálogo cerrado de notas no clínicas)

Catálogo cerrado de frases predefinidas que la secretaría puede adjuntar al resumen seguro. No se permiten notas libres de texto.

| Atributo | Tipo conceptual | Obligatorio | Notas | RF |
|---|---|---|---|---|
| id | UUID | Sí | | RF-009 |
| key | string | Sí | Identificador estable (`follow_up`, `external_rx`, etc.) | RF-009 |
| label | string | Sí | Texto mostrado al usuario | RF-009 |
| active | boolean | Sí | Permite deprecar opciones sin borrar histórico | RF-009 |
| displayOrder | integer | Sí | Orden en UI | RF-009 |

**Valores iniciales v1:**

| key | label |
|---|---|
| `follow_up` | Paciente solicita cita de seguimiento |
| `external_rx` | Paciente trae receta externa |
| `contact_later` | Requiere contacto posterior |
| `prefer_phone` | Preferencia de contacto por teléfono |
| `prefer_email` | Preferencia de contacto por correo |

### 1.8 SafeSummary (Resumen seguro)

Vista/derivado, no tabla propia. Construido desde consulta + prescripción con lista blanca.

Campos permitidos: nombre paciente, folio, fecha consulta, `usage`, estado, nota no clínica de catálogo cerrado.

| Atributo | Origen | RF |
|---|---|---|
| patientName | Patient | RF-009 |
| folio | Patient | RF-009 |
| consultationDate | Consultation.openedAt | RF-009 |
| usage | Prescription.usage | RF-009 |
| status | Consultation.status | RF-009 |
| nonClinicalNoteKey | Consultation.nonClinicalNoteKey | RF-009 |
| nonClinicalNoteLabel | NonClinicalNote.label (resuelto vía catálogo) | RF-009 |

### 1.9 AuditLog (Auditoría)

Registro inmutable de acciones.

| Atributo | Tipo conceptual | Obligatorio | Notas | RF |
|---|---|---|---|---|
| id | UUID | Sí | | RF-010 |
| actorId | referencia a User | Sí | | RF-010 |
| action | enum | Sí | `create`, `read`, `update`, `amend`, `delete_attempt`, `ACCESS_DENIED`, `LOGIN`, `LOGOUT`, `SESSION_INVALIDATED` | RF-010 |
| entity | string | Sí | Nombre de entidad (Patient, Consultation, Refraction, Prescription, AuthSession) | RF-010 |
| entityId | UUID | Sí | | RF-010 |
| requestId | string | Sí | Trazabilidad de la solicitud (`ActorContext.requestId`) | RF-010 |
| reason | string | No | Motivo de cambio/enmienda | RF-010 |
| metadata | JSON | No | Contexto seguro (sin datos sensibles) | RF-010 |
| occurredAt | timestamp | Sí | | RF-010 |

**Constraints:**
- Solo inserciones; no actualizaciones ni borrados.
- `metadata` nunca contiene graduación, diagnóstico ni datos sensibles.

### 1.10 Branch (Sucursal)

Catálogo mínimo para folios correlativos.

| Atributo | Tipo conceptual | Obligatorio | Notas | RF |
|---|---|---|---|---|
| id | UUID | Sí | | RF-002, RF-008 |
| code | string | Sí | Prefijo de folio | RF-002, RF-008 |
| name | string | Sí | | RF-002 |
| nextPatientSequence | integer | Sí | Contador de folios | RF-002 |
| nextPrescriptionSequence | integer | Sí | Contador de prescripciones | RF-008 |

**Constraints:**
- `code` UNIQUE.
- Secuencias no reutilizables (idealmente bloqueo optimista al incrementar).

## 2. Relaciones

```text
Patient 1---* Consent
Patient 1---* Consultation
Patient 1---* Prescription

Consultation 1---* Refraction
Consultation 1---1 Prescription (condicional; solo si closed)
Consultation *---0..1 NonClinicalNote (nota no clínica del resumen seguro)

PrivacyNotice 1---* Consent

Branch 1---* Patient
Branch 1---* Consultation
Branch 1---* Prescription
Branch 1---* AuditLog (opcional, vía sucursal del recurso)

User (contrato auth) 1---* AuditLog
User 1---* Consultation (openedBy)
User 1---* Prescription (issuedBy)
```

## 3. Estados y transiciones

### Consultation

```text
┌─────────────┐     abrir      ┌──────────────┐
│   (start)   │ ──────────────▶ │ in_progress  │
└─────────────┘                 └──────┬───────┘
                                       │
                    emitir prescripción│
                                       ▼
                              ┌──────────────┐
                              │    closed    │
                              └──────────────┘
                                       ▲
                    abandonar          │
                                       │
                              ┌──────────────┐
                              │  abandoned   │
                              └──────────────┘
```

- `in_progress → closed`: requiere refracción válida para ambos ojos y se realiza mediante `issuePrescription`.
- `in_progress → abandoned`: requiere motivo y se realiza mediante `abandon`; no genera prescripción.
- No hay transición desde estados finales.

### Prescription

- `emitida` (implícito por existencia del registro base `isAmendment = false`).
- Versión: `version` inicia en `1` al emitirse y se incrementa en cada enmienda.
- Corrección: nuevo registro con `isAmendment = true`, `amendedFromId` → original. La consulta mantiene una sola prescripción base; las enmiendas son registros vinculados, no reemplazan la base.

### Refraction

- Registro original: `isAmendment = false`.
- Enmienda: `isAmendment = true`, `amendedFromId` → original.

## 4. Trazabilidad a requisitos

| RF | Cobertura en modelo |
|---|---|
| RF-001 | Entidad `Patient` con campos obligatorios/opcionales |
| RF-002 | `Patient.folio` UNIQUE; `Branch.nextPatientSequence` |
| RF-003 | Entidades `PrivacyNotice`, `Consent`; bloqueo en código |
| RF-004 | Índices en `Patient`; vista `SafeSummary` |
| RF-005 | Entidad `Consultation` con estados, version y reglas |
| RF-006 | Entidad `Refraction` con campos OD/OI |
| RF-007 | Constraints de `Refraction` |
| RF-008 | Entidad `Prescription` con `folio` correlativo |
| RF-009 | Vista `SafeSummary` con lista blanca; entidad `NonClinicalNote` como catálogo cerrado |
| RF-010 | Entidad `AuditLog` |
| RF-011 | `Refraction.isAmendment` / `Prescription.isAmendment` |

## 5. Consideraciones para el schema físico

### 5.1 Estado de implementación

`prisma/schema.prisma` ya representa las entidades `Patient`, `PrivacyNotice`,
`Consent`, `Consultation`, `Refraction`, `Prescription`, `NonClinicalNote`,
`AuditLog`, `Branch` y `User`, incluyendo enums, relaciones, índices, campos de
auditoría y control de versión. Los snapshots de prescripción se almacenan como
JSON inmutable desde la aplicación porque son una copia histórica de la
refracción vigente al emitir.

Prisma no declara índices únicos parciales de PostgreSQL en el modelo. La
migración inicial deberá agregar estas restricciones con SQL:

```sql
CREATE UNIQUE INDEX consultations_one_in_progress_per_patient
  ON consultations (patient_id) WHERE status = 'in_progress';

CREATE UNIQUE INDEX prescriptions_one_base_per_consultation
  ON prescriptions (consultation_id) WHERE is_amendment = false;
```

La generación de folios debe ejecutarse dentro de una transacción que bloquee la
fila `Branch` al consumir `nextPatientSequence` o
`nextPrescriptionSequence`; el `UNIQUE` de `Patient.folio` y
`Prescription.folio` es la última barrera ante colisiones y exige reintento.

- Usar `Decimal` para esfera/cilindro/adición con precisión fija (por ejemplo, `Decimal(5,2)`).
- Usar `CHECK` constraints de PostgreSQL para rangos cuando Prisma lo soporte, o validación en código/Zod como mínimo.
- Los índices para búsqueda parcial requieren `pg_trgm` o estrategia de normalización (por ejemplo, columna `searchVector`).
- `AuditLog` puede crecer rápido; planear partición por fecha o tabla histórica en specs futuras.
- No incluir CURP ni identificador oficial en v1; dejar extensible vía JSON si asesoría legal lo requiere.

## 6. Historial de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1.1.1 | 2026-09-04 | Snapshot inmutable OD/OI explicitado en `Prescription` con `rightEyeSnapshot`, `leftEyeSnapshot`, `snapshotSourceIds` y `snapshotTakenAt`; versionado y trazabilidad documentados. |
| 1.1.0 | 2026-09-04 | Alineación con SPEC-001 v1.1.0: `Patient.version`; snapshot de refracción en `Prescription`; liberación administrativa de `Consultation`; casing canónico de acciones de auditoría. |
| 1.0.2 | 2026-09-03 | Correcciones pre-tareas: operación `setNonClinicalNote` en `Consultation`; `version` en `Prescription` y constraint parcial para enmiendas; `AuditLog` con `requestId` y acciones `ACCESS_DENIED`/`LOGIN`/`LOGOUT`/`SESSION_INVALIDATED`. |
| 1.0.1 | 2026-09-03 | Revisión post-NO-GO: entidad `NonClinicalNote`; refracción válida para ambos ojos con valores neutros explícitos; transiciones `issuePrescription` y `abandon` documentadas. |
| 1.0.0 | 2026-09-03 | Versión inicial conceptual. |
