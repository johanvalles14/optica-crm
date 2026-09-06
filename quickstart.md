# Optica CRM: instalacion y uso local

Este procedimiento instala una instancia para una sola optica. La PC donde se
ejecuta Docker es el servidor; las demas computadoras entran desde el navegador.
No se instala la base de datos en cada computadora.

## 1. Requisitos del servidor

- Windows 10/11 Pro o Linux con Docker Engine y Compose.
- CPU de 2 nucleos, 4 GB de RAM y SSD.
- 20 GB libres para la aplicacion, base y respaldos.
- UPS recomendado.
- Red local privada y estable.
- Un proyecto Supabase para autenticacion real.

Docker Desktop debe estar iniciado antes de instalar.

## 2. Preparar Supabase

1. Crear un proyecto en Supabase.
2. En `Authentication > Users`, crear un usuario administrador.
3. Copiar la URL del proyecto y la publishable key.
4. Copiar el UUID del usuario administrador.
5. No usar la service-role key en la aplicacion ni en `.env`.

El rol de la aplicacion vive en `app_metadata.role` y debe ser uno de:

- `admin`
- `frontdesk:receptionist`
- `clinical:optometrist`
- `clinical:assistant`
- `inventory:manager`
- `laboratory:technician`

Desde el SQL Editor de Supabase, asignar el rol al usuario:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role":"admin"}'::jsonb
where id = 'UUID_DEL_USUARIO';
```

El `UUID_DEL_USUARIO` debe ser el UUID real de Supabase.

## 3. Instalar en la PC servidor

Abrir PowerShell como administrador, ubicarse en la carpeta del producto y
ejecutar:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\ops\install-local.ps1 `
  -SupabaseUrl "https://TU-PROYECTO.supabase.co" `
  -SupabasePublishableKey "TU_PUBLISHABLE_KEY" `
  -DataPath "C:\OpticaCRM\data\postgres" `
  -BackupPath "E:\OpticaCRM-Backups" `
  -Port 3000 `
  -ConfigureFirewall
```

El instalador:

- Genera una contraseña PostgreSQL aleatoria.
- Crea el `.env` local sin mostrar la contraseña.
- Guarda PostgreSQL en `DataPath`.
- Construye y arranca la aplicación.
- Ejecuta migraciones y seed.
- Abre únicamente el puerto de la aplicación para la red local.
- Verifica `/api/health`.

La URL del servidor será `http://localhost:3000`. Desde otra PC se usará la IP
local del servidor, por ejemplo `http://192.168.1.50:3000`.

No enviar `.env` al cliente por correo ni subirlo al repositorio.

## 4. Registrar usuarios de la optica

Después de crear cada usuario en Supabase y asignarle `app_metadata.role`,
registrarlo también en la base local para satisfacer las relaciones de auditoría:

```powershell
.\ops\provision-user.ps1 `
  -UserId "UUID_REAL_DE_SUPABASE" `
  -Email "admin@optica.example" `
  -DisplayName "Administrador" `
  -Role "admin"
```

Repetir el comando para cada colaborador. El correo y UUID deben coincidir con
Supabase.

## 5. Fijar la dirección de red

La forma recomendada es reservar la IP en el router:

1. Ejecutar `ipconfig /all` en el servidor.
2. Anotar la dirección MAC de la tarjeta usada por la LAN.
3. En el router, crear una reserva DHCP para esa MAC, por ejemplo `192.168.1.50`.
4. Reiniciar la conexión de red y confirmar con `ipconfig`.
5. Desde otra PC abrir `http://192.168.1.50:3000`.

No publicar el puerto en Internet. El firewall instalado permite solamente el
perfil `Private` y `LocalSubnet`.

## 6. Configurar backups automaticos

Probar primero un backup manual:

```powershell
.\ops\backup.ps1 -OutputDirectory "E:\OpticaCRM-Backups"
```

Registrar el backup diario a las 02:00:

```powershell
.\ops\register-backup-task.ps1 `
  -OutputDirectory "E:\OpticaCRM-Backups" `
  -At "02:00"
```

Los respaldos se conservan 30 dias por defecto. El disco externo debe estar
cifrado con BitLocker, tener una letra fija y permanecer conectado durante la
ventana del backup. Desconectarlo después del respaldo reduce el riesgo de
ransomware.

## 7. Uso diario

1. Abrir `http://IP_DEL_SERVIDOR:3000`.
2. Iniciar sesión con la cuenta de Supabase.
3. Registrar pacientes desde `Nuevo paciente`.
4. Obtener consentimiento antes de abrir una consulta.
5. Capturar refracción OD y OI.
6. Emitir la receta solo cuando la consulta esté completa.
7. Usar `Punto de Venta` para cotizaciones, anticipos y pagos.
8. Usar `Inventario` para altas, búsquedas, ajustes y conteos.
9. Usar `Laboratorio` para órdenes, maquila, control de calidad y repetición.
10. Abrir, controlar y cerrar el turno desde `Caja`.
11. Cerrar sesión al terminar el turno.

## 8. Restaurar en otra PC

Instalar la misma versión del producto en la PC de reemplazo. Detener la
aplicación, copiar el backup y restaurar con confirmación explícita:

```powershell
.\ops\restore.ps1 `
  -InputFile "E:\OpticaCRM-Backups\optica-crm-YYYYMMDD-HHMMSS.sql" `
  -ConfirmRestore `
  -RestartApp
```

Después verificar:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

También iniciar sesión y comprobar un paciente sintético, una consulta, una
orden de venta y el reporte de caja. Registrar el resultado de cada simulacro.

## 9. Actualizaciones

1. Ejecutar backup y verificar que el archivo no esté vacío.
2. Detener solo la aplicación si el proveedor entrega una nueva imagen.
3. Actualizar la imagen o código.
4. Ejecutar `docker compose ... up -d --build`.
5. Confirmar healthcheck y login.
6. Conservar la versión anterior para rollback.

Nunca ejecutar `docker compose down -v`: elimina el volumen de PostgreSQL.
Tampoco borrar `DataPath` ni el directorio de backups.

## 10. Soporte y seguridad

- El modo `demo` no debe usarse con datos reales.
- No compartir contraseñas ni tokens.
- No publicar PostgreSQL en la red; solo la aplicación.
- Cifrar backups y restringir sus permisos.
- Hacer una restauración de prueba al menos una vez al mes.
- Validar legalmente el aviso de privacidad antes de la entrega.
- La instalación requiere una revisión de seguridad antes de almacenar datos
  clínicos reales.
