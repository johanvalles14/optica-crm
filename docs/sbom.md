# Software Bill of Materials (SBOM) — Óptica CRM

> Registro de dependencias y licencias auditadas conforme al Principio P5 de `constitution.md`.
> Fecha de auditoría: 2026-09-06

---

## 1. Dependencias de Producción (Runtime)

| Paquete | Versión | Licencia | Propósito | Estado P5 |
|---|---|---|---|---|
| **next** | ^15.5.25 | MIT | Framework full-stack React / App Router / API routes | ✅ Aprobada |
| **react** | ^19.2.8 | MIT | Librería de UI | ✅ Aprobada |
| **react-dom** | ^19.2.8 | MIT | Renderizado DOM de React | ✅ Aprobada |
| **zod** | ^4.5.4 | MIT | Validación de esquemas y contratos | ✅ Aprobada |
| **@prisma/client** | 6.19.3 | Apache-2.0 | Cliente ORM tipado para PostgreSQL | ✅ Aprobada |

---

## 2. Dependencias de Desarrollo (Build & Test)

| Paquete | Versión | Licencia | Propósito | Estado P5 |
|---|---|---|---|---|
| **typescript** | ^5.6.3 | Apache-2.0 | Compilador de tipado estático | ✅ Aprobada |
| **prisma** | 6.19.3 | Apache-2.0 | CLI de migraciones y generación de esquema | ✅ Aprobada |
| **vitest** | 5.0.0 | MIT | Runner de pruebas unitarias, integración y benchmark | ✅ Aprobada |
| **@vitest/coverage-v8** | 5.0.0 | MIT | Cobertura de código de pruebas | ✅ Aprobada |
| **vite** | ^6.4.3 | MIT | Bundler subyacente para tests rápidos | ✅ Aprobada |
| **tsx** | ^4.19.2 | MIT | Ejecutor de TypeScript para scripts de base de datos | ✅ Aprobada |
| **@types/node** | ^22.15.0 | MIT | Tipos de Node.js | ✅ Aprobada |
| **@types/react** | ^19.2.18 | MIT | Tipos de React | ✅ Aprobada |
| **@types/react-dom** | ^19.2.7 | MIT | Tipos de React DOM | ✅ Aprobada |

---

## 3. Verificación de Riesgo Copyleft
* **GPLv3 / AGPL:** Ninguna dependencia copyleft presente.
* **Proyectos evaluados como referencia (sin inclusión de código):**
  - OpenEMR (GPLv3) — solo referencia conceptual de campos clínicos.
  - ERPNext (GPLv3) — solo referencia de flujo comercial.
  - Repositorio de laboratorio sin licencia — prohibido copiar código según D-004.
* **Auditoría de transitivas:** Todas las dependencias son permisivas (MIT / Apache-2.0 / BSD).
