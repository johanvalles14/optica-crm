param(
  [Parameter(Mandatory=$true)][string]$InputFile,
  [string]$Container = "optica-crm-postgres",
  [string]$Database = "optica_crm",
  [string]$User = "optica",
  [switch]$ConfirmRestore,
  [switch]$RestartApp
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $InputFile)) { throw "No existe el backup: $InputFile" }
if (-not $ConfirmRestore) { throw 'La restauracion sobrescribe datos. Repite con -ConfirmRestore.' }
$running = docker inspect --format '{{.State.Running}}' $Container 2>$null
if ($LASTEXITCODE -ne 0 -or $running -ne 'true') { throw "El contenedor de PostgreSQL no esta ejecutandose: $Container" }
if ($RestartApp) { docker stop optica-crm-app | Out-Null }
try {
  Get-Content -Raw -LiteralPath $InputFile | docker exec -i $Container psql --username=$User --dbname=$Database --set=ON_ERROR_STOP=1 --single-transaction
  if ($LASTEXITCODE -ne 0) { throw 'psql rechazo el respaldo.' }
} finally {
  if ($RestartApp) { docker start optica-crm-app | Out-Null }
}
Write-Output "Restore completado desde: $InputFile"
