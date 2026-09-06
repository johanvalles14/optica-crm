param(
  [string]$OutputDirectory = "./backups",
  [string]$Container = "optica-crm-postgres",
  [string]$Database = "optica_crm",
  [string]$User = "optica"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $OutputDirectory)) {
  New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$output = Join-Path $OutputDirectory "optica-crm-$stamp.sql"
docker exec $Container pg_dump --username=$User --format=plain --no-owner --no-privileges $Database | Set-Content -Encoding utf8 $output
Write-Output "Backup creado: $output"
