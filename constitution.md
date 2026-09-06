# Constitución del Proyecto — Óptica CRM

> Gobernanza para el desarrollo guiado por especificaciones (Spec-Driven Development).
> Versión 1.0 · 2026-09-03

## 1. Propósito y alcance

Óptica CRM gestionará pacientes, consultas optométricas, ventas, pagos, órdenes de laboratorio, facturación y operación de sucursales. Cada feature deberá describir el valor de negocio, los actores, los límites del alcance y sus criterios verificables.

Las referencias legales de este documento son orientativas. Antes de producción, el responsable del proyecto deberá validarlas con asesoría legal y clínica mexicana.

## 2. Principios no negociables

### P1 — Expediente clínico íntegro y auditable

- Las consultas, graduaciones, diagnósticos, prescripciones y notas no se borran físicamente ni se sobrescriben silenciosamente.
- Las correcciones se registran como enmiendas con autor, fecha, motivo y referencia al registro original.
- Toda lectura y escritura de información clínica genera auditoría suficiente para identificar actor, acción, entidad y momento.
- La política de conservación se definirá conforme a la normativa vigente y deberá impedir eliminaciones accidentales.

### P2 — Privacidad y minimización

- La graduación, diagnóstico, historial clínico, identificadores oficiales y archivos del paciente se tratan como datos sensibles.
- Cada rol solo recibe los datos necesarios para realizar su función.
- Consentimiento, aviso de privacidad, acceso, rectificación, cancelación y oposición deberán contemplarse en las specs que manejen datos personales.
- Secretos, datos clínicos y credenciales nunca aparecen en logs, errores, fixtures públicos o documentación.

### P3 — Experiencia para gabinete y mostrador

- Los flujos prioritarios funcionan en touch y teclado, sin depender de hover.
- Cada spec de interfaz considera como mínimo móvil de 375 px y tablet de 768 px.
- Las tareas frecuentes deben poder realizarse con pocos pasos y mensajes claros.
- La necesidad de operación sin conexión se especificará por flujo; no se asumirá sincronización automática para datos clínicos sin definir conflictos y seguridad.

### P4 — Modularidad pragmática

- Los dominios se separan conceptualmente: pacientes, clínica, agenda, ventas, inventario, laboratorio, facturación, tickets, notificaciones, auditoría y reportes.
- Los módulos se relacionan mediante contratos explícitos y no mediante acceso informal a datos internos de otro módulo.
- Se inicia con la solución más simple que permita evolucionar; microservicios solo se justifican por una necesidad demostrable.

### P5 — Reutilización open source responsable

- Antes de incorporar código o dependencias se registra repositorio, versión, licencia, avisos, mantenimiento, vulnerabilidades y motivo de adopción.
- MIT, Apache-2.0, BSD, ISC y 0BSD son candidatas preferentes, siempre sujetas a verificar el texto real de la licencia.
- GPL, LGPL, AGPL, MPL, SSPL, BUSL u otras licencias con obligaciones especiales requieren revisión legal antes de adopción.
- Un repositorio sin licencia explícita no se copia ni se distribuye; puede servir únicamente como referencia conceptual.
- Copiar ideas de dominio no equivale a copiar código. Toda reutilización debe conservar sus avisos y cumplir sus obligaciones.

### P6 — Especificación y pruebas antes de implementación

El orden normal es: problema y escenarios → requisitos → contratos/modelo → pruebas → implementación → verificación. Las excepciones deben documentarse en la spec.

Cada flujo crítico tendrá criterios de aceptación y pruebas de permisos, errores y auditoría cuando corresponda. Los datos de prueba serán sintéticos.

### P7 — Trazabilidad y revisión

- Cada feature tiene identificador, spec, plan, tareas y changelog.
- Las decisiones arquitectónicas relevantes se registran como ADR.
- Cada cambio debe indicar qué requisito o tarea satisface.
- Ninguna feature se considera terminada sin revisión del diff completo y validaciones relevantes.

## 3. Dominios iniciales

1. `patients`: ficha, contacto y consentimiento.
2. `clinical`: consultas, exploraciones, graduaciones, prescripciones y notas.
3. `scheduling`: citas, disponibilidad y sala de espera.
4. `sales`: cotizaciones, ventas, anticipos, saldos, tickets y entregas.
5. `inventory`: armazones, micas, tratamientos, contactos, proveedores y existencias.
6. `laboratory`: órdenes, etapas, control de calidad y recepción.
7. `billing`: CFDI, notas y estados fiscales.
8. `reports`: estadísticas operativas y financieras con acceso controlado.

## 4. Gobierno de cada spec

Toda spec debe incluir:

- objetivo y problema;
- actores y permisos;
- escenarios principales, alternativos y errores;
- requisitos funcionales verificables;
- datos sensibles involucrados;
- dependencias y contratos afectados;
- estrategia de pruebas;
- supuestos, fuera de alcance y riesgos;
- decisiones de reutilización y licencias, si aplica.

Una spec pasa por: `Borrador → Revisada → Aprobada → Implementada → Verificada → Cerrada`.

## 5. Revisión legal y de seguridad

Antes de publicar el sistema se revisarán, como mínimo, la legislación vigente de protección de datos personales, la normativa aplicable al expediente clínico, los requisitos de facturación del SAT y cualquier requisito aplicable a productos regulados. La constitución no sustituye dictamen profesional.
