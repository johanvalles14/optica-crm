param(
  [string]$BaseUrl = "http://localhost:3000"
)

$headers = @{
  "content-type" = "application/json"
  "x-demo-role" = "clinical:optometrist"
  "x-actor-id" = "00000000-0000-4000-8000-000000000001"
}

function Invoke-ApiJson {
  param(
    [string]$Uri,
    [string]$Method = "Get",
    [hashtable]$RequestHeaders = $headers,
    [object]$Body
  )

  $params = @{
    Uri = $Uri
    Method = $Method
    Headers = $RequestHeaders
  }
  if ($null -ne $Body) {
    $params.ContentType = "application/json"
    $params.Body = ($Body | ConvertTo-Json -Depth 10)
  }
  return Invoke-RestMethod @params
}

$health = Invoke-ApiJson -Uri "$BaseUrl/api/health"
if ($health.status -ne "ok" -or $health.database -ne "ok") {
  throw "Healthcheck falló"
}

$suffix = Get-Date -Format "HHmmss"
$patient = Invoke-ApiJson -Uri "$BaseUrl/api/patients" -Method Post -Body @{
  branchId = "branch-001"
  firstName = "Smoke"
  lastName = "Local$suffix"
  birthDate = "1990-01-01"
  sex = "not_specified"
  phone = "55501$suffix"
}

Invoke-ApiJson -Uri "$BaseUrl/api/patients/$($patient.folio)/consent" -Method Post -Body @{ source = "smoke-local" } | Out-Null
$consultation = Invoke-ApiJson -Uri "$BaseUrl/api/consultations" -Method Post -Body @{
  patientId = $patient.patientId
  branchId = "branch-001"
}

foreach ($eye in @("OD", "OI")) {
  Invoke-ApiJson -Uri "$BaseUrl/api/consultations/$($consultation.id)/refraction" -Method Post -Body @{
    eye = $eye
    sphere = -1.25
    cylinder = -0.5
    axis = 180
    visualAcuity = "20/20"
    pupillaryDistance = 62
    expectedVersion = 1
  } | Out-Null
}

$prescription = Invoke-ApiJson -Uri "$BaseUrl/api/consultations/$($consultation.id)/prescription" -Method Post -Body @{
  usage = "progresivo"
  expectedVersion = 1
}

Write-Output "Smoke local OK: $($patient.folio), consulta $($consultation.id), receta $($prescription.prescription.folio)"
