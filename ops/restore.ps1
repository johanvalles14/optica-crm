param(
  [Parameter(Mandatory=$true)][string]$InputFile,
  [string]$Container = "optica-crm-postgres",
  [string]$Database = "optica_crm",
  [string]$User = "optica"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $InputFile)) { throw "No existe el backup: $InputFile" }
Get-Content -Raw -LiteralPath $InputFile | docker exec -i $Container psql --username=$User --dbname=$Database --set=ON_ERROR_STOP=1
Write-Output "Restore completado desde: $InputFile"
