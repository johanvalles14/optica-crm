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

La base se conserva en el volumen `optica-crm-postgres-data`. El volumen no
reemplaza los backups.

### Servicio cloud

La aplicación se ejecuta como contenedor y la base se contrata como PostgreSQL
administrado del proveedor elegido. El proveedor concreto se decide por costo,
región, SLA, cifrado, backups y requisitos del cliente; la aplicación no queda
acoplada a AWS, Azure, GCP o un proveedor específico.

```powershell
docker compose -f deploy/cloud/docker-compose.yml --env-file deploy/cloud/.env up -d
```

Para cloud se vende un servicio recurrente con hosting, backups administrados,
monitoreo, actualizaciones y soporte. Cada óptica debe tener una base aislada o
un tenant aislado con controles equivalentes; para la primera versión se
recomienda una base por cliente.

## Backups locales

Ejecutar diariamente y copiar el resultado a un disco distinto:

```powershell
./ops/backup.ps1
```

Restaurar solo después de confirmar un backup actual:

```powershell
./ops/restore.ps1 -InputFile ./backups/optica-crm-YYYYMMDD-HHMMSS.sql
```

Se recomienda la regla 3-2-1: tres copias, dos medios distintos y una copia
fuera del equipo. Los backups que contengan datos reales deben cifrarse y tener
acceso restringido.

## Actualizaciones

1. Crear y verificar backup.
2. Descargar la nueva imagen.
3. Ejecutar migraciones compatibles.
4. Reiniciar solo la aplicación.
5. Verificar `/api/health` y el flujo de login.
6. Conservar la imagen anterior para rollback.

Nunca se debe ejecutar `docker compose down -v` en una instalación con datos.

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

El paquete incluye la imagen de producción, Compose local, perfil cloud,
migraciones, seed, health check y scripts de backup. La autenticación real,
auditoría persistente completa y los módulos clínicos conectados a Prisma aún
son prerequisitos antes de vender una instalación con datos reales.
