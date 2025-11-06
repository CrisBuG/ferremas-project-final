<#
Uso:
  PowerShell -ExecutionPolicy Bypass -File e2e\run_e2e.ps1

Este script:
  1) Verifica Python y Node.
  2) Instala dependencias de pruebas en el venv del backend (si existe) o en el Python actual.
  3) Arranca el backend en http://localhost:8000 y el frontend en http://localhost:3000.
  4) Ejecuta únicamente las 3 pruebas nuevas del carrito.
  5) Guarda el log en e2e\pytest_suite_last.txt y un reporte HTML opcional.
#>

param(
  [string]$FrontendUrl = "http://localhost:3000",
  [string]$BackendUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

# Resolver ruta absoluta del repo en base a la ubicación del script
try {
  $scriptDir = Split-Path -Parent $PSCommandPath
} catch {
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$repoRoot = Split-Path -Parent $scriptDir
if (-not (Test-Path $repoRoot)) {
  Write-Error "No se pudo determinar la ruta del repo a partir del script."
}

Write-Host "[1/5] Verificando herramientas..." -ForegroundColor Cyan
try {
  $python = (Get-Command python -ErrorAction Stop).Source
} catch {
  Write-Error "Python no está en PATH. Instálalo o usa backend\\venv\\Scripts\\python.exe"
}
try {
  $node = (Get-Command node -ErrorAction Stop).Source
  $npm = (Get-Command npm -ErrorAction Stop).Source
} catch {
  Write-Error "Node/npm no están en PATH. Instálalos para iniciar el frontend."
}

# Preferir el venv del backend si existe
$backendVenvPython = Join-Path -Path (Join-Path $repoRoot "backend") -ChildPath "venv\Scripts\python.exe"
if (Test-Path $backendVenvPython) {
  $pyExec = $backendVenvPython
} else {
  $pyExec = $python
}
Write-Host "Usando Python: $pyExec" -ForegroundColor Yellow

Write-Host "[2/5] Instalando dependencias de pruebas en Python..." -ForegroundColor Cyan
& $pyExec -m pip install -U pip | Out-Null
& $pyExec -m pip install pytest selenium webdriver-manager requests pytest-html | Out-Null

Write-Host "[3/5] Arrancando servidores..." -ForegroundColor Cyan
$env:FRONTEND_URL = $FrontendUrl
$env:BACKEND_URL = $BackendUrl

# Backend
$backendManage = Join-Path $repoRoot "backend\manage.py"
$backendCmd = "$pyExec `"$backendManage`" runserver 8000"
Start-Process -WindowStyle Minimized -FilePath "powershell" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command $backendCmd" | Out-Null
Start-Sleep -Seconds 2

# Frontend (instalar deps si faltan)
if (!(Test-Path (Join-Path $repoRoot "frontend\node_modules"))) {
  Write-Host "Instalando dependencias del frontend (npm install)..." -ForegroundColor Yellow
  Push-Location (Join-Path $repoRoot "frontend")
  & $npm install | Out-Null
  Pop-Location
}
$frontendCmd = "cd `"$(Resolve-Path (Join-Path $repoRoot 'frontend'))`"; npm start"
Start-Process -WindowStyle Minimized -FilePath "powershell" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command $frontendCmd" | Out-Null

# Esperar disponibilidad de endpoints básicos
function Test-Url($url) {
  try { Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 3 -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

Write-Host "Esperando backend en $BackendUrl..." -ForegroundColor Yellow
for ($i=0; $i -lt 20; $i++) { if (Test-Url "$BackendUrl/api/") { break } Start-Sleep -Milliseconds 500 }
Write-Host "Esperando frontend en $FrontendUrl..." -ForegroundColor Yellow
for ($i=0; $i -lt 20; $i++) { if (Test-Url "$FrontendUrl/") { break } Start-Sleep -Milliseconds 500 }

Write-Host "[4/5] Ejecutando las 3 pruebas nuevas del carrito..." -ForegroundColor Cyan
$testFile = Join-Path $repoRoot "e2e\test_new_cases.py"
$pyTestCmd = "$pyExec -m pytest -q `"$testFile`" -k `"test_cp_func_011_cart_increase_respects_stock or test_cp_func_012_clear_cart_shows_empty or test_cp_func_013_decrement_disabled_then_enabled`" --disable-warnings"
Write-Host $pyTestCmd -ForegroundColor Gray

Push-Location $repoRoot
# Ejecutar directamente con el intérprete seleccionado para evitar problemas de PATH
& $pyExec -m pytest -q "$testFile" -k "test_cp_func_011_cart_increase_respects_stock or test_cp_func_012_clear_cart_shows_empty or test_cp_func_013_decrement_disabled_then_enabled" --disable-warnings | Tee-Object -FilePath (Join-Path $repoRoot "e2e\pytest_suite_last.txt")
Pop-Location

# Reporte HTML opcional de toda la suite e2e
Write-Host "[5/5] (Opcional) Generando reporte HTML completo de e2e..." -ForegroundColor Cyan
& $pyExec -m pytest (Join-Path $repoRoot "e2e") --html=(Join-Path $repoRoot "e2e\selenium_report.html") --self-contained-html | Out-Null

Write-Host "Finalizado. Revisa e2e\\pytest_suite_last.txt y e2e\\selenium_report.html" -ForegroundColor Green
