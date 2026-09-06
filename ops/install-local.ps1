param(
  [Parameter(Mandatory = $true)][string]$SupabaseUrl,
  [Parameter(Mandatory = $true)][string]$SupabasePublishableKey,
  [string]$DataPath = '.\data\postgres',
  [string]$BackupPath = '.\backups',
  [int]$Port = 3000,
  [int]$DatabasePort = 5432,
  [switch]$ConfigureFirewall,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repoRoot '.env'

if (-not $SupabaseUrl.StartsWith('https://')) {
  throw 'SupabaseUrl debe comenzar con https://'
}
if ([string]::IsNullOrWhiteSpace($SupabasePublishableKey)) {
  throw 'SupabasePublishableKey es obligatorio'
}
if ($Port -lt 1 -or $Port -gt 65535 -or $DatabasePort -lt 1 -or $DatabasePort -gt 65535) {
  throw 'Los puertos deben estar entre 1 y 65535'
}
if ((Test-Path -LiteralPath $envFile) -and -not $Force) {
  throw ".env ya existe. Usa -Force solo si confirmas que se reemplazaran sus credenciales."
}

docker version | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Docker no esta disponible. Inicia Docker Desktop y repite.' }
docker compose version | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Docker Compose no esta disponible.' }

function New-RandomHex([int]$ByteCount = 24) {
  $bytes = New-Object byte[] $ByteCount
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
  return ([BitConverter]::ToString($bytes) -replace '-', '').ToLowerInvariant()
}

function Resolve-RepoPath([string]$Path) {
  if ([System.IO.Path]::IsPathRooted($Path)) {
    return [System.IO.Path]::GetFullPath($Path)
  }
  return [System.IO.Path]::GetFullPath((Join-Path $repoRoot $Path))
}

$resolvedDataPath = Resolve-RepoPath $DataPath
$resolvedBackupPath = Resolve-RepoPath $BackupPath
New-Item -ItemType Directory -Force -Path $resolvedDataPath | Out-Null
New-Item -ItemType Directory -Force -Path $resolvedBackupPath | Out-Null

$dataPathForCompose = $resolvedDataPath -replace '\\', '/'
$backupPathForCompose = $resolvedBackupPath -replace '\\', '/'
$password = New-RandomHex
$databaseUrl = "postgresql://optica:$password@localhost:$DatabasePort/optica_crm?schema=public"

@"
POSTGRES_DB=optica_crm
POSTGRES_USER=optica
POSTGRES_PASSWORD=$password
OPTICA_CRM_PORT=$Port
OPTICA_CRM_DB_PORT=$DatabasePort
OPTICA_CRM_DATA_PATH=$dataPathForCompose
OPTICA_CRM_BACKUP_PATH=$backupPathForCompose
DATABASE_URL="$databaseUrl"
AUTH_MODE=supabase
SUPABASE_URL=$SupabaseUrl
SUPABASE_PUBLISHABLE_KEY=$SupabasePublishableKey
NEXT_PUBLIC_SUPABASE_URL=$SupabaseUrl
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$SupabasePublishableKey
"@ | Set-Content -LiteralPath $envFile -Encoding utf8
icacls $envFile /inheritance:r /grant:r "$env:USERNAME:F" '*S-1-5-18:F' '*S-1-5-32-544:F' | Out-Null

if ($ConfigureFirewall) {
  $principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Ejecuta PowerShell como administrador para configurar el firewall.'
  }
  $ruleName = 'Optica CRM - red local'
  if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -Profile Private -RemoteAddress LocalSubnet | Out-Null
  }
}

docker compose --env-file $envFile -f (Join-Path $repoRoot 'docker-compose.yml') -f (Join-Path $repoRoot 'docker-compose.local.yml') up -d --build
if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar Optica CRM.' }

$healthUrl = "http://localhost:$Port/api/health"
$ready = $false
for ($attempt = 1; $attempt -le 60; $attempt++) {
  try {
    $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 3
    if ($health.status -eq 'ok' -and $health.database -eq 'ok') { $ready = $true; break }
  } catch { }
  Start-Sleep -Seconds 2
}
if (-not $ready) { throw "La aplicacion no respondio correctamente en $healthUrl" }

$addresses = @(Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -ExpandProperty IPAddress)
Write-Output 'Instalacion local completada.'
Write-Output "Acceso en el servidor: http://localhost:$Port"
if ($addresses.Count -gt 0) { Write-Output "IPs detectadas para la red local: $($addresses -join ', ')" }
Write-Output "Configura una reserva DHCP para la IP del servidor en el router y usa el script de backup." 
Write-Output 'La contrasena de PostgreSQL se guardo solo en .env; no la compartas ni la subas al repositorio.'
