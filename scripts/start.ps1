# Start Script para VisionControl MVP (Windows PowerShell)
$ErrorActionPreference = "Stop"

$WorkspaceRoot = Split-Path -Parent $PSScriptRoot
Set-Location $WorkspaceRoot

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   INICIANDO VISIONCONTROL MVP                   " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$VenvPython = "$WorkspaceRoot\venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    if (Get-Command py -ErrorAction SilentlyContinue) {
        $VenvPython = (Get-Command py).Source
    } elseif (Get-Command python -ErrorAction SilentlyContinue) {
        $VenvPython = (Get-Command python).Source
    } else {
        Write-Error "Python não encontrado. Por favor, instale o Python ou execute .\scripts\setup.ps1"
    }
}

# 1. Iniciar Backend FastAPI + WebSocket
Write-Host "`n[1/2] Iniciando Backend FastAPI em http://127.0.0.1:8000 ..." -ForegroundColor Yellow
$BackendJob = Start-Process -FilePath $VenvPython -ArgumentList "-m", "uvicorn", "visioncontrol.backend.api.server:app", "--host", "127.0.0.1", "--port", "8000" -WorkingDirectory $WorkspaceRoot -PassThru

Start-Sleep -Seconds 2

# 2. Iniciar Frontend Vite Dev Server
Write-Host "`n[2/2] Iniciando Frontend React em http://localhost:5173 ..." -ForegroundColor Yellow
$FrontendDir = "$WorkspaceRoot\visioncontrol\frontend"
$FrontendJob = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $FrontendDir -PassThru

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "   SISTEMA VISIONCONTROL EM EXECUÇÃO!            " -ForegroundColor Green
Write-Host "   URL da Aplicação : http://localhost:5173       " -ForegroundColor Green
Write-Host "   API / Health     : http://127.0.0.1:8000/health" -ForegroundColor Green
Write-Host "   WebSocket        : ws://127.0.0.1:8000/ws     " -ForegroundColor Green
Write-Host "   Pressione Ctrl+C para encerrar os serviços    " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Green

try {
    # Mantém o terminal monitorando até interrupção do usuário
    Wait-Process -Id $BackendJob.Id, $FrontendJob.Id
} finally {
    Write-Host "`nEncerrando serviços..." -ForegroundColor Yellow
    Stop-Process -Id $BackendJob.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $FrontendJob.Id -ErrorAction SilentlyContinue
    Write-Host "Serviços encerrados com sucesso." -ForegroundColor Green
}
