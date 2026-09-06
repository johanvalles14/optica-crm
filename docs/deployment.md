# Despliegue de Óptica CRM

## Modelos comerciales

### Instalación local

La óptica compra la licencia o instalación y conserva la base de datos en un
servidor propio. Las computadoras acceden por navegador dentro de la red local.
El paquete incluye la aplicación, PostgreSQL, migraciones y procedimientos de
backup. No se debe instalar el sistema en cada computadora de usuario.

```text
tablets y PCs -> red local -> servidor de la óptica
                              ├── Óptica CRM
                              └── PostgreSQL + volumen persistente
```

Instalación:

```powershell
Copy-Item .env.example .env
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

Si el puerto `3000` ya está ocupado, usar otro puerto del equipo:

```powershell
$env:OPTICA_CRM_PORT = "3001"
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

Validar el flujo completo de demostración:

```powershell
./ops/smoke-local.ps1 -BaseUrl http://localhost:3001
```

La base se conserva en `OPTICA_CRM_DATA_PATH`, configurado por
`ops/install-local.ps1`. Puede ser un directorio del SSD interno o de un SSD
externo dedicado. El SSD interno es preferible para la base activa; el disco
externo se recomienda principalmente para backups. El almacenamiento no
reemplaza los backups.

### Servicio cloud

La aplicación se ejecuta como contenedor y la base se contrata como PostgreSQL
administrado del proveedor elegido. El proveedor concreto se decide por costo,
región, SLA, cifrado, backups y requisitos del cliente; la aplicación no queda
acoplada a AWS, Azure, GCP o un proveedor específico.

```powershell
docker compose -f deploy/cloud/docker-compose.yml --env-file deploy/cloud/.env up -d
```

Procedimiento de entrega cloud:

1. Construir una imagen versionada con `docker build -t REGISTRY/optica-crm:VERSION .`.
2. Publicarla en un registry privado.
3. Crear una base PostgreSQL administrada con SSL, backups y acceso privado.
4. Crear un proyecto Supabase para autenticación.
5. Copiar `deploy/cloud/.env.example` a `deploy/cloud/.env` y completar la
   imagen, `DATABASE_URL`, URL y publishable key de Supabase.
6. Ejecutar `docker compose ... up -d` en el servidor cloud.
7. Verificar `/api/health`, configurar TLS mediante un reverse proxy y limitar
   el acceso público al proxy, nunca a PostgreSQL.
8. Crear usuarios en Supabase y sus registros equivalentes en `public.users`.
9. Confirmar restauración de un backup antes de activar la cuenta del cliente.

El Compose cloud no reemplaza un reverse proxy TLS, firewall, secrets manager,
monitoreo ni el backup administrado del proveedor.

Para cloud se vende un servicio recurrente con hosting, backups administrados,
monitoreo, actualizaciones y soporte. Cada óptica debe tener una base aislada o
un tenant aislado con controles equivalentes; para la primera versión se
recomienda una base por cliente.

## Instalador y usuarios

El instalador comercial es `ops/install-local.ps1`. Exige URL y publishable key
de Supabase, genera la contraseña PostgreSQL y deja `AUTH_MODE=supabase`; no se
debe entregar una instalación real con `AUTH_MODE=demo`.

```powershell
.\ops\install-local.ps1 `
  -SupabaseUrl "https://TU-PROYECTO.supabase.co" `
  -SupabasePublishableKey "TU_PUBLISHABLE_KEY" `
  -DataPath "C:\OpticaCRM\data\postgres" `
  -BackupPath "E:\OpticaCRM-Backups" `
  -ConfigureFirewall
```

Cada usuario se crea en Supabase, recibe un rol en `app_metadata.role` y se
provisiona en la tabla local `users` con `ops/provision-user.ps1`. El UUID debe
ser el mismo en ambos sistemas.

## Backups locales

Ejecutar diariamente y copiar el resultado a un disco distinto:

```powershell
./ops/backup.ps1 -OutputDirectory E:\OpticaCRM-Backups
```

Restaurar solo después de confirmar un backup actual y con confirmación explícita:

```powershell
./ops/restore.ps1 -InputFile E:\OpticaCRM-Backups\optica-crm-YYYYMMDD-HHMMSS.sql -ConfirmRestore -RestartApp
```

Registrar una tarea diaria después de validar el backup manual:

```powershell
.\ops\register-backup-task.ps1 -OutputDirectory E:\OpticaCRM-Backups -At 02:00
```

Se recomienda la regla 3-2-1: tres copias, dos medios distintos y una copia
fuera del equipo. Los backups que contengan datos reales deben cifrarse con
BitLocker y tener acceso restringido.

## Actualizaciones

1. Crear y verificar backup.
2. Descargar la nueva imagen.
3. Ejecutar migraciones compatibles.
4. Reiniciar solo la aplicación.
5. Verificar `/api/health` y el flujo de autenticación del proxy.
6. Conservar la imagen anterior para rollback.

Nunca se debe ejecutar `docker compose down -v` en una instalación con datos.

## Red local y seguridad

Reservar la IP del servidor en el router usando la MAC de su tarjeta de red.
No configurar una IP fija arbitraria desde el instalador: la dirección, gateway
y DNS dependen de la red de cada óptica. El instalador puede crear una regla de
firewall limitada a `Private` y `LocalSubnet` con `-ConfigureFirewall`.

El PostgreSQL local se publica solamente en `127.0.0.1`; las otras PCs acceden
al puerto de la aplicación, no al puerto de la base.

## Requisitos mínimos sugeridos para servidor local

- CPU de 2 núcleos.
- 4 GB de RAM.
- SSD con espacio reservado para base y backups.
- Red local estable.
- UPS recomendado.
- Windows Pro o Linux con Docker.

El servidor debe tener IP local reservada y acceso restringido. No se debe
publicar PostgreSQL directamente a Internet.

## Estado actual

El paquete incluye la imagen de producción, Compose local, instalador, perfil
cloud, migraciones, seed, health check, scripts de backup/restauración,
provisión de usuarios y persistencia Prisma para pacientes, consentimientos,
consultas, refracciones, prescripciones, inventario, ventas, laboratorio, caja y
auditoría.

Antes de vender una instalación con datos reales se debe configurar Supabase,
registrar usuarios, cambiar credenciales, verificar el backup/restauración,
reservar la IP, obtener revisión legal y realizar una prueba de aceptación con
la óptica.
