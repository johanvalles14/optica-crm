param(
  [Parameter(Mandatory = $true)][string]$UserId,
  [Parameter(Mandatory = $true)][string]$Email,
  [Parameter(Mandatory = $true)][string]$DisplayName,
  [ValidateSet('clinical:optometrist', 'clinical:assistant', 'frontdesk:receptionist', 'inventory:manager', 'laboratory:technician', 'admin')]
  [Parameter(Mandatory = $true)][string]$Role,
  [string]$Container = 'optica-crm-postgres',
  [string]$Database = 'optica_crm',
  [string]$User = 'optica'
)

$ErrorActionPreference = 'Stop'
if ($UserId -notmatch '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$') {
  throw 'UserId no es un UUID valido de Supabase.'
}

$sql = @"
INSERT INTO users (id, "displayName", email, role)
VALUES (:'user_id'::uuid, :'display_name', :'email', :'role')
ON CONFLICT (id) DO UPDATE SET "displayName" = EXCLUDED."displayName", email = EXCLUDED.email, role = EXCLUDED.role;
"@

$args = @('exec', $Container, 'psql', '--username=' + $User, '--dbname=' + $Database, '--set=user_id=' + $UserId, '--set=display_name=' + $DisplayName, '--set=email=' + $Email, '--set=role=' + $Role, '--command=' + $sql)
& docker @args
if ($LASTEXITCODE -ne 0) { throw 'No se pudo registrar el usuario en la base local.' }
Write-Output "Usuario provisionado: $Email ($Role)"
