param(
  [string]$OutputDirectory = "./backups",
  [string]$Container = "optica-crm-postgres",
  [string]$Database = "optica_crm",
  [string]$User = "optica",
  [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"
$OutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$running = docker inspect --format '{{.State.Running}}' $Container 2>$null
if ($LASTEXITCODE -ne 0 -or $running -ne 'true') { throw "El contenedor de PostgreSQL no esta ejecutandose: $Container" }
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$output = Join-Path $OutputDirectory "optica-crm-$stamp.sql"
$temporary = "$output.tmp"
docker exec $Container pg_dump --username=$User --format=plain --clean --if-exists --no-owner --no-privileges --file=/tmp/optica-crm-backup.sql $Database
if ($LASTEXITCODE -ne 0) { throw 'pg_dump no pudo crear el respaldo.' }
docker cp "${Container}:/tmp/optica-crm-backup.sql" $temporary
if ($LASTEXITCODE -ne 0) { throw 'No se pudo copiar el respaldo fuera del contenedor.' }
Move-Item -Force -LiteralPath $temporary -Destination $output
docker exec $Container rm -f /tmp/optica-crm-backup.sql | Out-Null
if ($RetentionDays -gt 0) {
  Get-ChildItem -LiteralPath $OutputDirectory -Filter 'optica-crm-*.sql' -File |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } |
    Remove-Item -Force
}
if ((Get-Item -LiteralPath $output).Length -le 0) { throw "El respaldo esta vacio: $output" }
Write-Output "Backup creado: $output"
