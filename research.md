# Research — Óptica CRM

> Investigación técnica para fundamentar decisiones de arquitectura, stack y reutilización.
> Hallazgos verificados al 2026-09-03. Toda fuente debe incluir URL y fecha de consulta.

---

## 1. Hallazgo Principal

**No existe un sistema all-in-one maduro y confirmado para CRM óptico mexicano.**

Tras evaluar repositorios públicos, plataformas de salud y soluciones de retail óptico, se concluye que ningún proyecto existente cubre de forma conjunta:

- Expediente clínico optométrico (graduación, diagnóstico, prescripción).
- Operaciones de mostrador (ventas, inventario de armazones/lentes).
- Facturación CFDI 4.0 compatible con el SAT.
- Cumplimiento de la normativa mexicana vigente sobre expediente clínico y protección de datos personales.
- UX mobile-first para tablet en gabinete y mostrador.

Esto valida la necesidad de construir Óptica CRM como sistema propio, con reutilización selectiva de componentes existentes.

### Nota legal (2025)

La **Ley Federal de Protección de Datos Personales en Posesión de los Particulares** fue reexpedida en el *Diario Oficial de la Federación* el **20 de marzo de 2025**, abrogando la versión publicada el 5 de julio de 2010. Su última reforma publicada al cierre de esta investigación es del **14 de noviembre de 2025**. Antes de producción se debe validar el texto vigente y sus obligaciones con asesoría legal.

### Supuestos que aún deben confirmarse

- El producto se diseñará inicialmente como una aplicación privada o SaaS, pero el modelo de distribución definitivo todavía no está aprobado.
- El primer lanzamiento estará orientado a México, sin asumir que una referencia legal sustituye asesoría profesional.
- El stack tecnológico se decidirá durante el plan inicial; por ahora no se presupone PHP, TypeScript ni un proveedor concreto.

---

## 2. Catálogo de Soluciones Evaluadas

### 2.1 Sistemas de Historial Clínico Electrónico (EHR/EMR)

| Proyecto | Licencia | Relevancia | Estado | Notas |
|---|---|---|---|---|
| **OpenEMR** — [github.com/openemr/openemr](https://github.com/openemr/openemr) | GPLv3 | EHR completo, módulo de oftalmología parcial | Activo, comunidad grande | Copyleft fuerte. Incompatible con modelo propietario sin cesión de código. Útil como referencia de modelo de datos clínico, **no como base directa**. |
| **Medplum** — [github.com/medplum/medplum](https://github.com/medplum/medplum) | Apache-2.0 | Plataforma FHIR-native, API-first | Activo, startup con funding | Compatible con licencia. SDK en TypeScript. Potencial como capa de expediente clínico si se adopta FHIR. Requiere evaluación de esfuerzo de adaptación a flujos optométricos. |

### 2.2 Sistemas de Gestión Óptica Específicos

| Proyecto | Licencia | Relevancia | Estado | Notas |
|---|---|---|---|---|
| **GustavoHenriquePires/optical-laboratory-management-system** | Sin licencia (no declarada) | Gestión de laboratorio óptico | Baja actividad | **No usable**. Sin licencia = derechos reservados por defecto. Solo referencia de funcionalidades (órdenes de laboratorio, tracking de producción). |
| **zzyitx/OpticalShopRAG** | Apache-2.0 | RAG para tienda óptica | Prototipo/demo | Código pequeño, orientado a búsqueda semántica sobre inventario. Apache-2.0 es compatible. Posible extracción de lógica de embeddings para búsqueda de productos, pero no es un CRM. |

### 2.3 Plataformas de Retail / E-commerce

| Proyecto | Licencia | Relevancia | Estado | Notas |
|---|---|---|---|---|
| **medusajs/medusa** | MIT para el núcleo; revisar componentes Enterprise | Plataforma e-commerce headless | Activo, comunidad creciente | Puede evaluarse para catálogo e inventario, pero debe excluirse cualquier componente con licencia comercial distinta y validarse la versión exacta. |
| **frappe/erpnext** | GPLv3 | ERP completo con módulos de inventario, ventas, contabilidad | Activo, empresa detrás | Copyleft fuerte. Mismo riesgo que OpenEMR. Útil como referencia de estructura de módulos (inventory, sales, billing), **no como base directa** si se requiere modelo propietario. |

### 2.4 Librerías de Facturación Electrónica (CFDI)

| Proyecto | Licencia | Relevancia | Estado | Notas |
|---|---|---|---|---|
| **FacturAPI/facturapi-node** | MIT | SDK Node.js para emisión de CFDI vía FacturAPI | Activo, empresa comercial | Compatible. Abstrae la complejidad del SAT. Requiere cuenta de FacturAPI (servicio de pago). Alternativa viable para facturación sin implementar CFDI desde cero. |
| **eclipxe13/CfdiUtils** | MIT | Utilidades PHP para generación/validación de CFDI | Activo, mantenedor reconocido en comunidad PHP | Compatible. Biblioteca madura para XML de CFDI 4.0. Útil si el stack incluye PHP o si se necesita validación directa de XML sin depender de un proveedor externo. |

### 2.5 Librerías de Infraestructura

| Proyecto | Licencia | Relevancia | Estado | Notas |
|---|---|---|---|---|
| **statelyai/xstate** | MIT | Máquinas de estado finito para lógica de flujo | Activo, ampliamente adoptado | Compatible. Potencial para modelar flujos clínicos (consulta → exploración → prescripción → cierre) y flujos de venta (cotización → pago → entrega). |
| **apache/casbin** | Apache-2.0 | Motor de autorización basado en políticas (RBAC, ABAC) | Activo, fundación Apache | Compatible. Potencial para implementar control de acceso por rol (optometrista, asistente, admin) y políticas de acceso a datos sensitive según P2 de la constitución. |

---

## 3. Análisis: Reutilizar vs. Integrar vs. Construir

### 3.1 Marco de Decisión

Para cada componente funcional del sistema, la decisión se toma según:

| Criterio | Peso | Descripción |
|---|---|---|
| **Alineación con constitución** | Alto | ¿El componente cumple P1-P7 sin modificación profunda? |
| **Riesgo de licencia** | Alto | ¿La licencia es compatible con el modelo de negocio? |
| **Costo de integración** | Medio | ¿Cuánto esfuerzo requiere adaptar el componente al dominio óptico mexicano? |
| **Mantenibilidad** | Medio | ¿El proyecto está activo, con múltiples maintainers? |
| **Vendor lock-in** | Bajo-Medio | ¿Depende de un servicio externo crítico? |

### 3.2 Decisiones Preliminar por Dominio

#### Expediente Clínico (módulo `clinical`)

| Opción | Decisión | Razonamiento |
|---|---|---|
| Adoptar OpenEMR | **No** | GPLv3 implica copyleft. Modelo de datos genérico (medicina general), no optimizado para optometría. Adaptación costosa. |
| Adoptar Medplum como base | **Evaluar** | Apache-2.0, API-first, FHIR-native. Si el equipo decide adoptar FHIR como estándar de intercambio, Medplum puede ser la capa de persistencia clínica. Requiere spike de 2 semanas para validar. |
| Construir desde cero | **Probable** | El dominio optométrico mexicano (graduaciones esférico-cilíndricas, prescripciones de lentes) es lo suficientemente específico como para que un modelo propio sea más limpio. |

#### Ventas e Inventario (módulos `sales`, `inventory`)

| Opción | Decisión | Razonamiento |
|---|---|---|
| Evaluar Medusa | **Evaluar** | Licencia del núcleo MIT, pero deben excluirse componentes Enterprise y validar la versión exacta. Decisión definitiva tras spike antes de SPEC-002. |
| Adoptar ERPNext | **No** | GPLv3. Mismo riesgo que OpenEMR. ERP genérico, no óptico. |
| Construir desde cero | **Probable** | El inventario óptico (armazones, lentes de contacto, líquidos, filtros) tiene reglas de negocio específicas que un e-commerce genérico no modela bien. |

#### Facturación CFDI (módulo `billing`)

| Opción | Decisión | Razonamiento |
|---|---|---|
| Integrar FacturAPI (facturapi-node) | **Sí, si se acepta dependencia de SaaS** | MIT, SDK maduro, abstrae la complejidad del SAT. Reduce tiempo de implementación de semanas a días. Riesgo: dependencia de servicio externo con costo por factura. |
| Integrar CfdiUtils | **Alternativa viable** | MIT, validación directa de XML CFDI 4.0. Más trabajo de integración pero sin dependencia de SaaS. Preferible si se requiere facturación offline o sin costo por transacción. |
| Construir desde cero | **No recomendado** | El estándar CFDI 4.0 es complejo y cambia con actualizaciones del SAT. Reinventar esta rueda es innecesario y riesgoso. |

#### Control de Acceso (módulo `auth`)

| Opción | Decisión | Razonamiento |
|---|---|---|
| Integrar Casbin | **Evaluar** | Apache-2.0, motor de políticas flexible. Puede modelar RBAC (optometrista, asistente, admin) y ABAC (acceso a datos sensitive por contexto). Requiere spike de 1 semana. |
| Construir con librería estándar | **Alternativa** | Para un número finito de roles (3-5), un sistema de autorización propio puede ser más simple y sin dependencia externa. |

#### Flujos de Estado (consultas, ventas, citas)

| Opción | Decisión | Razonamiento |
|---|---|---|
| Integrar XState | **Evaluar** | MIT, ampliamente adoptado. Modela bien flujos con estados discretos (consulta en progreso, prescripción pendiente, venta cerrada). Requiere spike de 1 semana. |
| Construir con estado en base de datos | **Alternativa** | Para flujos simples, un campo `status` con transiciones validadas en código puede ser suficiente y más fácil de auditar. |

---

## 4. Riesgos de Copyleft

### 4.1 Definición

El copyleft puede imponer condiciones sobre la redistribución de obras derivadas. El efecto depende de la licencia, de la forma de integración y de si el software se distribuye o solo se ofrece como servicio. Esta investigación no sustituye una revisión legal.

### 4.2 Licencias Copyleft Identificadas en esta Investigación

| Licencia | Proyectos | Riesgo para Óptica CRM |
|---|---|---|
| **GPLv3** | OpenEMR, ERPNext | **Alto para incorporar o distribuir código derivado**. El impacto exacto depende de la forma de enlace, modificación y distribución; requiere revisión legal. |
| **AGPL** | (No encontrado en esta investigación) | **Alto** para modificaciones ofrecidas por red, por sus obligaciones específicas de disponibilidad del código fuente; requiere revisión legal. |
| **LGPL** | (No encontrado directamente) | **Moderado**. Permite uso como librería sin copyleft, pero modificaciones directas a la librería deben liberarse. Requiere cuidado en la integración. |

### 4.3 Escenarios de Riesgo

1. **Incorporar código de OpenEMR/ERPNext**: Si un desarrollador copia funciones, modelos de datos o módulos de proyectos GPLv3, el código resultante puede considerarse "trabajo derivado" y estar sujeto a GPLv3.

2. **Dependencia transitiva**: Una dependencia MIT puede incluir componentes con otras licencias. Debe revisarse el árbol real de dependencias y la forma en que se distribuyen los binarios.

3. **Forma de integración**: La evaluación de código enlazado, servicios separados, plugins y modificaciones varía según la licencia y la jurisdicción. No debe asumirse que una separación técnica elimina automáticamente las obligaciones.

### 4.4 Mitigación

- **No incorporar código de proyectos GPLv3/AGPL directamente.**
- Usarlos solo como **referencia arquitectónica** (patrones de diseño, modelo de datos conceptual) sin copiar implementaciones.
- Verificar que ninguna dependencia transitiva sea copyleft en el pipeline de CI.
- Mantener SBOM actualizado que exponga todas las licencias.

---

## 5. Plan de Validación de Licencias

### 5.1 Proceso de Evaluación

Antes de agregar **cualquier** dependencia externa (paquete, librería, SDK, framework):

```
┌─────────────────────────────────────┐
│  1. Identificar dependencia         │
│     (nombre, versión, repo)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Verificar licencia en repo      │
│     - Archivo LICENSE raíz          │
│     - package.json / Cargo.toml     │
│     - Cabecera de código fuente     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Clasificar según P5             │
│     ✅ Sin revisión: MIT, Apache    │
│        2.0, BSD-2/3, ISC, 0BSD     │
│     ⚠️  Revisión legal: GPL, LGPL, │
│        AGPL, MPL, SSPL, BUSL       │
│     ❌ Prohibida: copyleft fuerte   │
│        incompatible con modelo      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Evaluar dependencias transitivas│
│     (npm ls --all, cargo tree, etc.)│
│     Verificar que ninguna sea       │
│     copyleft no declarada           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Documentar en SBOM              │
│     - Nombre, versión, licencia     │
│     - URL del repo                  │
│     - Fecha de evaluación           │
│     - Estado: aprobada / rechazada  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  6. Aprobar o rechazar              │
│     - Aprobada → agregar al         │
│       proyecto                      │
│     - Rechazada → buscar            │
│       alternativa                   │
│     - Revisión legal → pausar hasta │
│       resolución                    │
└─────────────────────────────────────┘
```

### 5.2 Herramientas Recomendadas

| Herramienta | Uso | Licencia |
|---|---|---|
| **license-checker** (npm) | Escanea dependencias de un proyecto Node.js y reporta licencias | MIT |
| **cargo-deny** (Rust) | Validación de licencias, audit de seguridad, detección de duplicados para Cargo | Apache-2.0 |
| **FOSSA** (SaaS / CLI) | Auditoría de licencias automatizada con integración CI | Freemium |
| **ScanCode Toolkit** | Análisis profundo de licencias en código fuente y binarios | Apache-2.0 |

### 5.3 Integración en CI

El pipeline de CI debe incluir un paso de validación de licencias que:

1. Ejecute `license-checker --failOn "GPL;AGPL;SSPL;BUSL"` (o equivalente para el ecosistema elegido).
2. Bloquee el merge si se detecta una licencia no aprobada.
3. Genere reporte de licencias como artefacto de build.

### 5.4 Dependencias Pendientes de Verificación

| Dependencia | Acción requerida | Responsable | Deadline |
|---|---|---|---|
| **Medusa (medusajs/medusa)** | Descargar y leer LICENSE del repo. Verificar si es MIT, Apache-2.0 u otra. Documentar hallazgo. | Equipo de arquitectura | Antes de SPEC-002 (ventas/inventario) |
| **OpticalShopRAG (zzyitx)** | Confirmar que Apache-2.0 es la licencia completa (no dual-licensed). | Equipo de arquitectura | Antes de evaluar búsqueda semántica |

---

## 6. Decisiones para la Especificación Futura

### 6.1 Decisiones Afirmativas (tomadas con esta investigación)

| ID | Decisión | Fundamento |
|---|---|---|
| **D-001** | Construir el expediente clínico propio como línea base | OpenEMR requiere revisión de copyleft. Medplum queda como integración futura opcional, no como bloqueo para la primera spec. |
| **D-002** | Usar FacturAPI o CfdiUtils para facturación CFDI | Ambos MIT. Implementar CFDI desde cero es innecesario y riesgoso. |
| **D-003** | No usar ERPNext como base | GPLv3, ERP genérico, no óptico. |
| **D-004** | No usar código de repositorios sin licencia (optical-laboratory-management-system) | Sin licencia = derechos reservados. Riesgo legal inaceptable. |

### 6.2 Decisiones Pendientes (requieren spike o investigación adicional)

| ID | Decisión | Acción requerida | Deadline |
|---|---|---|---|
| **D-005** | ¿Adoptar Medplum como capa FHIR para expediente clínico? | Spike opcional posterior a la línea base: prototipo de expediente optométrico con API de Medplum. Evaluar esfuerzo, performance y flexibilidad. | Antes de integrar FHIR |
| **D-006** | ¿Adoptar Medusa para ventas/inventario? | Verificar licencia del núcleo (MIT), excluir componentes Enterprise, validar versión exacta y completar spike de adaptación. | Antes de SPEC-002 (ventas/inventario) |
| **D-007** | ¿Usar Casbin para autorización? | Spike de 1 semana: modelar RBAC (3 roles) y políticas de acceso a datos sensitive. Evaluar si es más simple que un sistema propio. | Antes de adoptar motor de autorización externo; post-SPEC-001 |
| **D-008** | ¿Usar XState para flujos de estado? | Spike de 1 semana: modelar flujo de consulta optométrica como máquina de estados. Evaluar si aporta valor sobre un campo `status` con validación. | Antes de adoptar máquinas de estado en specs posteriores (post-SPEC-001); SPEC-001 usa estados manuales. |
| **D-009** | ¿FacturAPI vs. CfdiUtils? | Evaluar: ¿se requiere facturación offline? ¿Se acepta costo por factura? ¿El stack incluye PHP o solo TypeScript? | Antes de SPEC-004 (facturación) |

### 6.3 Principios para Specs Futuras

Toda spec que involucre dependencias externas **debe**:

1. Incluir tabla de dependencias con licencia verificada.
2. Referenciar el número de decisión (D-XXX) si la dependencia fue evaluada en esta investigación.
3. Incluir plan de spike si la dependencia requiere validación adicional.
4. Actualizar el SBOM al momento de aprobación.

---

## 7. Referencias

| Fuente | URL | Fecha de consulta | Notas |
|---|---|---|---|
| OpenEMR | https://github.com/openemr/openemr | 2026-09-03 | GPLv3, EHR completo |
| Medplum | https://github.com/medplum/medplum | 2026-09-03 | Apache-2.0, FHIR-native |
| optical-laboratory-management-system | https://github.com/GustavoHenriquePires/optical-laboratory-management-system | 2026-09-03 | Sin licencia declarada |
| OpticalShopRAG | https://github.com/zzyitx/OpticalShopRAG | 2026-09-03 | Apache-2.0 |
| Medusa | https://github.com/medusajs/medusa | 2026-09-03 | Licencia MIT del núcleo verificada; excluir componentes Enterprise y validar versión exacta antes de adopción |
| ERPNext | https://github.com/frappe/erpnext | 2026-09-03 | GPLv3 |
| facturapi-node | https://github.com/FacturAPI/facturapi-node | 2026-09-03 | MIT |
| CfdiUtils | https://github.com/eclipxe13/CfdiUtils | 2026-09-03 | MIT |
| XState | https://github.com/statelyai/xstate | 2026-09-03 | MIT |
| Casbin | https://github.com/apache/casbin | 2026-09-03 | Apache-2.0 |
| NOM-004-SSA3-2012 | https://www.dof.gob.mx/nota_detalle.php?codigo=5272787 | 2026-09-03 | Referencia orientativa para expediente clínico; validar aplicabilidad con asesoría profesional |
| NOM-024-SSA3-2012 | https://www.dof.gob.mx/nota_detalle.php?codigo=5280847&fecha=30/11/2012 | 2026-09-03 | Evaluar aplicabilidad a sistemas electrónicos de información en salud |
| Ley Federal de Protección de Datos Personales en Posesión de los Particulares (reexpedida) | https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf | 2026-09-03 | Reexpedida en DOF 20-03-2025; última reforma publicada DOF 14-11-2025. Validar texto vigente con asesoría legal. |

---

## 8. Versionado de este Documento

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.2 | 2026-09-03 | Correcciones pre-tareas: nota sobre reexpedición de la LFPDPPP (DOF 20-03-2025, reforma DOF 14-11-2025); D-006 movida a decisiones pendientes; D-008 con deadline post-SPEC-001 para evitar referencia a ID futuro. |
| 1.0.1 | 2026-09-03 | Revisión post-NO-GO: URL correcta de NOM-024-SSA3-2012; eliminada referencia a NOM-007; D-006 movida a decisiones afirmativas (licencia MIT verificada). |
| 1.0.0 | 2026-09-03 | Versión inicial. 10 proyectos evaluados, 4 decisiones afirmativas, 5 pendientes, plan de validación de licencias. |

---

*Este documento se actualiza cuando se evalúan nuevas dependencias, se completan spikes de validación, o se descubren nuevos proyectos relevantes. Toda actualización debe incluir fecha, autor y razón del cambio.*
