# ADR-001: Decisión de stack tecnológico para Óptica CRM

| Campo       | Valor                                    |
|-------------|------------------------------------------|
| Estado      | **Aprobada**                             |
| Fecha       | 2026-09-04                               |
| Autores     | Equipo Óptica CRM                        |
| Revisores   | —                                        |

---

## Contexto

Óptica CRM es una aplicación web para la gestión integral de ópticas: pacientes,
prescripciones, inventario de monturas/lentes, citas y ventas. Se requiere un
stack moderno que cumpla con:

- **Desarrollo rápido** con buenas herramientas de DX.
- **Seguridad** en autenticación y manejo de datos sensibles de salud.
- **Rendimiento** aceptable en conexiones móviles (vendedores en piso de venta).
- **Testing sólido** desde unidad hasta extremo-a-extremo.
- **Licenciamiento libre** compatible con uso comercial.
- **Comunidad activa** para soporte a mediano plazo.

El equipo tiene experiencia previa con React, TypeScript y PostgreSQL.

---

## Decisión

Adoptamos el siguiente stack para Óptica CRM:

| Capa                | Tecnología        | Justificación breve                                           |
|---------------------|-------------------|---------------------------------------------------------------|
| Framework web       | **Next.js 15**    | SSR/SSG, App Router, Server Components, ecosistema Vercel.   |
| Base de datos       | **PostgreSQL**    | Motor relacional robusto, JSONB, extensiones (pg_trgm, etc.).|
| ORM                 | **Prisma**        | Type-safe queries, migraciones declarativas, introspección.   |
| Autenticación       | **Supabase Auth** | OAuth, magic links, MFA, integración nativa con Supabase.    |
| Validación          | **Zod**           | Validación declarativa, inferencia de tipos TypeScript.       |
| Testing unitario    | **Vitest**        | Compatible con Vite/ESM, rápido, API similar a Jest.         |
| Testing E2E         | **Playwright**    | Multi-navegador, fixtures, trazas, CI-friendly.              |

---

## Alternativas consideradas

### Framework web

| Alternativa   | Motivo de descarte                                       |
|---------------|----------------------------------------------------------|
| Remix         | Menor ecosistema de despliegue; SSR menos maduro en 2026.|
| SvelteKit     | Menor adopción en el equipo; comunidad más pequeña.      |
| Angular       | Curva de aprendizaje alta; excesivo para el alcance.     |

### Base de datos

| Alternativa   | Motivo de descarte                                            |
|---------------|---------------------------------------------------------------|
| MySQL         | Menos funcionalidades avanzadas (JSONB limitado, sin RLS).   |
| SQLite        | No apto para concurrencia multi-usuario en producción.       |
| MongoDB       | Esquema relacional natural para CRM; pérdida de integridad.  |

### ORM

| Alternativa   | Motivo de descarte                                            |
|---------------|---------------------------------------------------------------|
| Drizzle ORM   | Madurez menor; menos herramientas de introspección en 2026.  |
| TypeORM       | API envejecida, decoradores, menor alineación con ESM.       |
| Sequelize     | TypeScript secundario; tipado menos estricto.                 |

### Autenticación

| Alternativa         | Motivo de descarte                                        |
|---------------------|-----------------------------------------------------------|
| NextAuth (Auth.js)  | Requiere proveedor externo para MFA; más configuración.   |
| Clerk               | Costo en producción; vendor lock-in mayor.                |
| Firebase Auth       | Acoplamiento a Google Cloud; ecosistema separado.         |
| Auth0               | Costo escalado; latencia adicional fuera de región.       |

### Validación

| Alternativa    | Motivo de descarte                                      |
|----------------|---------------------------------------------------------|
| Yup            | Inferencia de tipos inferior; API menos ergonómica.     |
| Joi            | Sin soporte TypeScript nativo; runtime pesado.          |
| io-ts          | API funcional menos accesible para el equipo.           |

### Testing unitario

| Alternativa | Motivo de descarte                                                |
|-------------|-------------------------------------------------------------------|
| Jest        | Soporte ESM incompleto; configuración adicional para TypeScript.  |
| Mocha       | Requiere librerías complementarias (assert, mock).                |

### Testing E2E

| Alternativa   | Motivo de descarte                                             |
|---------------|----------------------------------------------------------------|
| Cypress       | Solo Chromium-based; limitaciones con pestañas/multi-origin.   |
| Selenium      | API verbose; lentitud comparada; configuración compleja.       |
| Puppeteer     | Solo Chromium; sin fixtures ni reporter integrado.             |

---

## Consecuencias positivas

- **Full-stack TypeScript**: tipos compartidos entre cliente, servidor y base de datos.
- **DX superior**: hot reload rápido, autocompletado completo, errores en tiempo de diseño.
- **Seguridad**: Supabase Auth maneja hashing, rotación de tokens y MFA sin código propio.
- **Migraciones seguras**: Prisma genera SQL revisable y ejecuta en transacciones.
- **Testing integral**: Vitest para lógica rápida, Playwright para flujos críticos del negocio.
- **Despliegue flexible**: Next.js se despliega en Vercel, Docker o VPS sin cambios de código.

---

## Consecuencias negativas

- **Complejidad operativa**: múltiples servicios (Next.js, PostgreSQL, Supabase) a gestionar.
- **Acoplamiento a Prisma**: migrar a otro ORM requiere reescritura de queries.
- **Supabase dependency**: si Supabase tiene downtime, la autenticación se ve afectada.
- **Bundle size**: Next.js + Prisma Client pueden aumentar el tamaño del bundle en el cliente.

---

## Riesgos

| Riesgo                                         | Probabilidad | Impacto | Mitigación                                         |
|------------------------------------------------|--------------|---------|-----------------------------------------------------|
| Cambio de licencia en Next.js/Prisma           | Baja         | Alto    | Monitorear anuncios; abstracción en capa de acceso. |
| Supabase Auth insuficiente para requisitos futuros | Media    | Medio   | Interfaz de autenticación desacoplada.              |
| Prisma Performance en queries complejas         | Media        | Medio   | Queries raw donde sea necesario; índices optimizados.|
| Curva de aprendizaje de App Router              | Media        | Bajo    | Pair programming; documentación interna.            |

---

## Licencias a verificar

| Paquete         | Licencia        | Compatible comercial | Notas                              |
|-----------------|-----------------|----------------------|------------------------------------|
| Next.js 15      | MIT             | ✅ Sí                | Sin restricciones comerciales.     |
| PostgreSQL      | PostgreSQL Lic. | ✅ Sí                | Licencia permisiva tipo BSD.       |
| Prisma          | Apache-2.0      | ✅ Sí                | Motor de Prisma tiene cláusula adicional en producción comercial (verificar). |
| Supabase Auth   | Apache-2.0      | ✅ Sí                | Componentes open source; hosted tiene TOS separados. |
| Zod             | MIT             | ✅ Sí                | Sin restricciones.                 |
| Vitest          | MIT             | ✅ Sí                | Sin restricciones.                 |
| Playwright      | Apache-2.0      | ✅ Sí                | Sin restricciones comerciales.     |

> **Nota**: Verificar la licencia del motor de Prisma (Prisma Engine) para
> despliegues auto-hospedados en producción. Apache-2.0 con una adición
> específica puede requerir revisión legal si se modifica el motor.

---

## Referencias

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Zod Documentation](https://zod.dev)
- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)

---

## Registro de cambios

| Fecha       | Cambio                       |
|-------------|------------------------------|
| 2026-09-04  | Creación del ADR (Aprobada). |
