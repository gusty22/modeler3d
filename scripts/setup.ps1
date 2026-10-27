# Setup Script para VisionControl MVP (Windows PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   VISIONCONTROL MVP - INSTALAÇÃO E SETUP       " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$WorkspaceRoot = Split-Path -Parent $PSScriptRoot
Set-Location $WorkspaceRoot

# 1. Verificar Python
Write-Host "`n[1/4] Verificando ambiente Python..." -ForegroundColor Yellow
$PythonCmd = $null
if (Get-Command py -ErrorAction SilentlyContinue) {
    $PythonCmd = "py"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $PythonCmd = "python"
} else {
    Write-Error "Python 3.10+ não encontrado no sistema. Instale o Python para continuar."
}

# Criar venv se não existir
if (-not (Test-Path "$WorkspaceRoot\venv")) {
    Write-Host "Criando virtualenv em $WorkspaceRoot\venv..." -ForegroundColor Cyan
    & $PythonCmd -m venv "$WorkspaceRoot\venv"
}

# Instalar dependências backend
Write-Host "Instalando dependências Python no ambiente virtual..." -ForegroundColor Cyan
& "$WorkspaceRoot\venv\Scripts\python.exe" -m pip install --no-cache-dir mediapipe opencv-python fastapi uvicorn websockets pydantic numpy pytest

# 2. Obter modelo oficial do MediaPipe Tasks
Write-Host "`n[2/4] Verificando modelos de visão computacional..." -ForegroundColor Yellow
$ModelDir = "$WorkspaceRoot\models"
if (-not (Test-Path $ModelDir)) {
    New-Item -ItemType Directory -Path $ModelDir -Force | Out-Null
}

$ModelFile = "$ModelDir\gesture_recognizer.task"
if (-not (Test-Path $ModelFile)) {
    Write-Host "Baixando modelo oficial do Google MediaPipe Storage..." -ForegroundColor Cyan
    $ModelUrl = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"
    Invoke-WebRequest -Uri $ModelUrl -OutFile $ModelFile
    Write-Host "Modelo salvo em: $ModelFile" -ForegroundColor Green
} else {
    Write-Host "Modelo gesture_recognizer.task já presente." -ForegroundColor Green
}

# 3. Preparar Frontend React + Three.js
Write-Host "`n[3/4] Preparando Frontend..." -ForegroundColor Yellow
Set-Location "$WorkspaceRoot\visioncontrol\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando pacotes npm do frontend..." -ForegroundColor Cyan
    npm install
}

Write-Host "`n[4/4] Executando build de validação..." -ForegroundColor Yellow
npm run build

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "  SETUP CONCLUÍDO COM SUCESSO!                    " -ForegroundColor Green
Write-Host "  Para iniciar o sistema: .\scripts\start.ps1     " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
