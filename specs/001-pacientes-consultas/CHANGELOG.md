# Changelog — SPEC-001 Pacientes y Consultas Optométricas

Todas las modificaciones notables a esta especificación e implementación se documentan aquí.

---

## [1.1.0] — 2026-09-06 — CIERRE Y VERIFICACIÓN COMPLETA

### Añadido
- **API Routes HTTP Completas (T041):**
  - `/api/privacy-notice`: Consulta de aviso de privacidad vigente.
  - `/api/patients/[folio]/consent`: Verificación y registro de consentimiento informado.
  - `/api/consultations/[id]/refraction`: Captura de refracción OD/OI y enmiendas.
  - `/api/consultations/[id]/prescription`: Emisión de prescripción con snapshot inmutable y enmiendas.
  - `/api/consultations/[id]/non-clinical-note`: Actualización de nota operativa de catálogo cerrado.
  - `/api/frontdesk/summary`: Resumen seguro para mostrador con filtro por folio o patientId.
- **Pantallas de Interfaz Web Touch-First (T042 - T046):**
  - `/patients/new`: Registro ágil de paciente nuevo con consentimiento integrado en tablet/móvil.
  - `/patients/search`: Búsqueda de pacientes con lista blanca para mostrador.
  - `/consultations/[id]`: Gabinete clínico con captura táctil de refracción OD/OI, historial de enmiendas y abandono de consulta.
  - `/consultations/[id]/prescription`: Emisión de prescripción, selección de tipo de lente y confirmación inmutable.
  - `/frontdesk/summary`: Pantalla para secretaría que expone únicamente resumen seguro y permite asignar notas del catálogo cerrado.
- **Navegación y Selector de Roles (T047):**
  - Componente `RoleNav` en `src/components/layout/RoleNav.tsx` con soporte para roles `clinical:optometrist`, `frontdesk:receptionist`, `clinical:assistant` y `admin`.
- **Accesibilidad y Ergonomía (T048):**
  - Estilos WCAG 2.1 AA en `globals.css` (targets de 48 px, foco visible, contraste > 4.5:1).
- **Pruebas y Validación (T049 - T051):**
  - Suite de pruebas de contratos HTTP (`tests/integration/api/api-routes.test.ts`).
  - Suite de flujo E2E completo cubriendo escenarios 5.1 a 5.12 (`tests/integration/clinical/e2e-workflow.test.ts`).
  - Total de 85 tests automatizados pasando al 100%.
  - Benchmark de 100k registros verificado en `tests/benchmark/search-100k.benchmark.ts`.
- **Artefactos de Gobernanza (T052 - T054):**
  - `docs/sbom.md`: Software Bill of Materials auditando cero dependencias copyleft (P5).
  - `docs/validation/spec-001-usability.md`: Métricas de usabilidad y calidad.

---

## [1.0.0] — 2026-09-04 — LÍNEA BASE DE DOMINIO Y MODELO

### Añadido
- Redacción inicial de `spec.md`, `plan.md`, `data-model.md` y `tasks.md`.
- Contratos TypeScript compartidos en `contracts/` (`auth`, `patients`, `clinical`).
- Schema físico inicial en `prisma/schema.prisma`.
- Módulos de dominio `src/modules/patients`, `clinical`, `audit`, `auth`.
- Pruebas unitarias e integración de dominio (76 tests iniciales).
