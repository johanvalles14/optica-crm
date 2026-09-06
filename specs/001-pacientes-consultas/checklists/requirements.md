# Checklist de requisitos — SPEC-001 Pacientes y Consultas Optométricas

> Lista de verificación de requisitos para el feature. Se marca cuando el requisito está implementado, probado y revisado.

## Fase 0 — Gobierno

- [x] ADR-001 existe en `docs/adrs/ADR-001-stack-spec-001.md` y tiene dos aprobaciones humanas; ambas son del propietario del proyecto y requieren revisión independiente recomendada.
- [x] Pendientes legales están documentados en SPEC-001 y ADR-001; siguen siendo gate antes de producción.
- [x] La matriz de roles está documentada en SPEC-001 y reflejada en los contratos.

## Pacientes

- [x] **RF-001:** El sistema permite registrar paciente con nombre(s), apellido paterno, apellido materno opcional, fecha de nacimiento, sexo, teléfono principal, correo opcional, dirección opcional, alergias/condiciones opcionales y contacto de emergencia opcional.
- [x] `Patient.version` presente en contrato y schema para control de concurrencia.
- [x] La edición de ficha de paciente requiere `expectedVersion` para evitar sobrescritas perdidas.
- [x] **RF-002:** Se genera folio único legible de 8 caracteres alfanuméricos mediante esquema determinista verificable o con restricción `UNIQUE` en base de datos; no se justifica solo con probabilidad matemática.
- [x] **RF-004:** Búsqueda por nombre parcial, teléfono parcial (≥4 dígitos) y folio exacto devuelve resultados en ≤ 500 ms (p95).
- [x] **RF-004:** El resultado de búsqueda solo expone campos de la lista blanca: nombre, folio, fecha de nacimiento, teléfono parcial enmascarado y estado de última consulta.
- [x] El resultado de búsqueda no expone graduación, diagnóstico ni historial clínico a roles no clínicos.
- [x] Toda lectura de pacientes recibe `ActorContext` (`actorId`, `role`, `requestId`) y se audita.

## Consentimiento

- [x] **RF-003:** Se registra versión vigente del aviso de privacidad (`PrivacyNotice`) y consentimiento con fecha, hora, usuario e IP/origen antes de crear/editar datos clínicos.
- [x] **RF-003:** Se requiere re-consentimiento al cambiar la versión del aviso, al editar datos clínicos existentes (incluyendo enmiendas) o al vencer el plazo legal definido por asesoría.
- [x] `hasValidConsent` devuelve `false` si el `noticeId` vigente cambió.
- [x] No se permiten crear ni editar datos clínicos sin consentimiento vigente registrado.
- [x] El texto del aviso, formato de consentimiento y periodicidad están marcados como pendiente legal antes de producción.

## Consulta

- [x] **RF-005:** Solo rol `clinical:optometrist` puede abrir consulta.
- [x] **RF-005:** No se permiten dos consultas en estado `in_progress` simultáneas para el mismo paciente.
- [x] **RF-005:** La consulta registra timestamp de inicio, usuario responsable y estado `in_progress`.
- [x] **RF-005:** La consulta puede pasar a estado `closed` (prescripción emitida) o `abandoned` (sin prescripción, con motivo).
- [x] **RF-005:** Una consulta en estado final (`closed`/`abandoned`) es de solo lectura salvo enmiendas documentadas.
- [x] **RF-005:** Se impide la edición simultánea mediante control de concurrencia; las mutaciones reciben `expectedVersion` y se rechaza la sobrescritura perdida.
- [x] **RF-005:** La transición a `closed` se realiza únicamente mediante `issuePrescription`; la transición a `abandoned` únicamente mediante `abandon`.
- [x] **RF-005:** Solo `admin` puede liberar una consulta `in_progress` bloqueada mediante `releaseConsultation`, con motivo y auditoría.

## Refracción OD/OI

- [x] **RF-006:** Se capturan esfera, cilindro, eje, adición, agudeza visual y distancia pupilar para OD y OI.
- [x] **RF-006:** El cilindro se registra en convención negativa (0.00 a -10.00 D); no se aceptan valores positivos.
- [x] **RF-006:** La agudeza visual acepta formato Snellen (ej. 20/20) o decimal (0.1 a 1.2+) y almacena el formato capturado.
- [x] **RF-007:** Se rechazan valores fuera de rango.
- [x] **RF-007:** Se rechaza cilindro distinto de cero sin eje.
- [x] **RF-007:** Se requiere refracción válida registrada para ambos ojos (OD y OI) antes de emitir prescripción; se permiten valores neutros explícitos (esfera `0.00` / cilindro `0.00`).
- [x] Cada valor queda asociado a la consulta con timestamp y usuario.

## Prescripción

- [x] **RF-008:** La prescripción incluye paciente, fecha, optometrista responsable, **snapshot inmutable de la refracción OD/OI** vigente al emitir, uso recomendado, observaciones y folio correlativo por sucursal.
- [x] **RF-008:** La prescripción cierra la consulta a `closed` tras confirmación.
- [x] **RF-008:** Se validan mínimos de emisión: refracción válida para ambos ojos, uso recomendado y optometrista responsable.
- [x] **RF-011:** Las correcciones se registran como enmiendas con referencia al original (`amendedFromId`), autor, fecha, motivo (`amendmentReason`) e incremento de `version`; el original permanece accesible e inmutable.
- [x] **RF-011:** Antes de enmienda se verifica `hasValidConsent` contra el `PrivacyNotice` vigente.

## Resumen seguro

- [x] **RF-009:** La secretaría solo ve campos de la lista blanca: nombre, folio, fecha de consulta, tipo de lente recomendado, estado y nota no clínica de catálogo cerrado.
- [x] **RF-009:** Las notas no clínicas provienen de un catálogo cerrado modelado en el dominio; no hay notas libres de texto.
- [x] **RF-009:** La secretaría puede obtener el resumen seguro y listar consultas por `patientId` o folio.
- [x] Toda lectura del resumen seguro recibe `ActorContext` y se audita.
- [x] Intento de acceso no autorizado a datos clínicos es rechazado y auditado.

## Auditoría y permisos

- [x] **RF-010:** Toda creación, lectura, modificación o enmienda de datos clínicos genera registro de auditoría.
- [x] El registro de auditoría incluye actor, acción (`create`, `read`, `update`, `amend`, `delete_attempt`, `ACCESS_DENIED`, `LOGIN`, `LOGOUT`, `SESSION_INVALIDATED`), entidad, identificador, timestamp, razón de cambio y `requestId` de `ActorContext`.
- [x] Datos sensibles no aparecen en logs de aplicación ni en mensajes de error públicos.
- [x] Pruebas de permisos cubren 100% de endpoints que exponen datos sensibles.
- [x] La matriz de operaciones por rol (Sección 4) está reflejada en pruebas automatizadas.

## Derechos ARCO y dependencias

- [x] Se documenta alcance de derechos ARCO para v1 con límites claros (Sección 8).
- [x] Se marca el procedimiento formal ARCO como pendiente legal.
- [x] El contrato mínimo del módulo `auth` está documentado y es consumible por SPEC-001.
- [x] El contrato `auth` incluye invalidación de sesión y eventos login/logout auditables; el boundary con el proveedor de identidad está explicitado.

## Escenarios alternativos y error

- [x] Escenario 5.8: consulta ya abierta rechaza apertura duplicada.
- [x] Escenario 5.9: consulta abandonada con motivo y sin prescripción.
- [x] Escenario 5.10: refracción inválida rechazada antes de guardar.
- [x] Escenario 5.11: acceso no autorizado de secretaría devuelve 403/404 genérico y se audita.
- [x] Escenario 5.12: bloqueo de captura clínica sin consentimiento vigente.

## No funcionales y experiencia

- [x] Bootstrap mínimo de pruebas (`package.json`, `tsconfig.json`, `vitest.config.ts`) ejecutable antes de tests RED, sin código de aplicación.
- [x] Flujo usable en móvil (375 px) y tablet táctil (768 px) sin depender de hover.
- [x] Accesibilidad WCAG 2.1 AA: navegación por teclado, foco visible, contraste ≥ 4.5:1, etiquetas/ARIA.
- [x] Registro de paciente nuevo completable en ≤ 60 segundos en tablet.
- [x] Satisfacción de secretaría con resumen seguro ≥ 4/5.
- [x] Errores de captura de refracción ≤ 1% de consultas en ambiente controlado.
- [x] Búsqueda de paciente y resumen por folio/patientId cumplen ≤ 500 ms (p95) con 100k registros sintéticos.
- [x] Suite de pruebas RED ejecutable (`vitest run` muestra tests fallidos/pendientes, no errores de configuración) antes de implementación.
- [x] No se incorporan dependencias copyleft ni repositorios sin licencia.

## Validación final

- [x] Revisión del diff completo de SPEC-001.
- [x] Aprobación de producto y cumplimiento.
- [x] Actualización del SBOM si se agrega alguna dependencia externa (`docs/sbom.md`).
