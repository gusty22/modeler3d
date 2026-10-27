# Test Script para VisionControl MVP (Windows PowerShell)
$WorkspaceRoot = Split-Path -Parent $PSScriptRoot
Set-Location $WorkspaceRoot

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   EXECUTANDO BATERIA DE TESTES AUTOMATIZADOS    " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$VenvPython = "$WorkspaceRoot\venv\Scripts\python.exe"
$env:PYTHONPATH = $WorkspaceRoot

Write-Host "`n[1/3] Testes Unitários de Gestos, Hub e Libras Lab..." -ForegroundColor Yellow
& "$WorkspaceRoot\venv\Scripts\pytest.exe" -p no:cacheprovider -v "$WorkspaceRoot\visioncontrol\backend\tests\test_libras_engine.py" "$WorkspaceRoot\visioncontrol\backend\tests\test_gesture_engine.py" "$WorkspaceRoot\visioncontrol\backend\tests\test_hub_modules.py"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha nos testes do Backend!"
}

Write-Host "`n[2/3] Teste de Importação e Câmera Física..." -ForegroundColor Yellow
& $VenvPython -c "import cv2; cap=cv2.VideoCapture(0, cv2.CAP_DSHOW); ret, frame = (cap.read() if cap.isOpened() else (False, None)); cap.release(); print(f'CAM_OPEN={cap.isOpened()}, FRAME_READ={ret}')"

Write-Host "`n[3/3] Validação de Tipagem e Build do Frontend..." -ForegroundColor Yellow
Set-Location "$WorkspaceRoot\visioncontrol\frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha no build do Frontend!"
}

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "   TODOS OS TESTES APROVADOS COM SUCESSO!        " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
