param(
  [string]$OutputDirectory = '.\backups',
  [string]$TaskName = 'Optica CRM - Backup diario',
  [string]$At = '02:00'
)

$ErrorActionPreference = 'Stop'
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Ejecuta PowerShell como administrador para registrar la tarea programada.'
}
$backupScript = Join-Path $PSScriptRoot 'backup.ps1'
if (-not (Test-Path -LiteralPath $backupScript)) { throw "No existe: $backupScript" }
$resolvedOutput = if ([System.IO.Path]::IsPathRooted($OutputDirectory)) {
  [System.IO.Path]::GetFullPath($OutputDirectory)
} else {
  [System.IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $PSScriptRoot) $OutputDirectory))
}
New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null

$action = New-ScheduledTaskAction -Execute 'PowerShell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`" -OutputDirectory `"$resolvedOutput`""
$trigger = New-ScheduledTaskTrigger -Daily -At ([DateTime]::ParseExact($At, 'HH:mm', $null))
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Force | Out-Null
Write-Output "Tarea registrada: $TaskName ($At)"
Write-Output "Destino: $resolvedOutput"
