# VisionControl — Modelagem & Interação Gestual 3D

> ⚠️ **Status do Projeto: Em Desenvolvimento Ativo (WIP / Beta)**  
> Este projeto está atualmente em fase de desenvolvimento e prototipagem de novos recursos de manipulação tridimensional e controle gestual.

Aplicação de visão computacional em tempo real que permite controlar e manipular objetos tridimensionais diretamente pela webcam através de gestos manuais naturais.

---

## 🌟 Funcionalidades
- **Rastreamento em Tempo Real:** 29-30 FPS com baixíssima latência (~26ms).
- **Janela de Câmera com Sensores:** Feed de vídeo ao vivo no canto da tela mostrando o esqueleto da mão e status de detecção sobrepostos em tempo real.
- **Ambiente Tridimensional Interativo:** Cubo 3D manipulável com Raycasting e física de plano.
- **Cursor Virtual Adaptativo:** Suavização por Filtro 1€ sem trepidações.
- **Máquina de Estados Robusta:** Histerese temporal para transições estáveis entre Hover, Arraste e Liberação.
- **100% Local e Privado:** Nenhum dado ou frame de imagem sai da sua máquina.

---

## 🚀 Como Executar

### 1. Inicialização Automática
Na raiz do projeto no PowerShell:
```powershell
.\scripts\start.ps1
```

O script inicializará o Backend (FastAPI em `http://127.0.0.1:8000`) e o Frontend (Vite em `http://localhost:5173`).

Abra no seu navegador: **`http://localhost:5173`**

### 2. Comandos Gestuais
1. **Mão Aberta (`OPEN_PALM`):** Move o cursor virtual pela tela.
2. **Apontar para o Cubo:** O cubo acende em roxo (`HOVERING`).
3. **Fechar a Mão (`CLOSED_FIST`):** O cubo é agarrado e segue o movimento da sua mão (`DRAGGING`).
4. **Abrir a Mão Novamente:** O cubo é liberado no ponto atual.

---

## 🧪 Como Executar Testes
```powershell
.\scripts\test.ps1
```

---

## 📁 Estrutura do Projeto
```
ironman/
├── visioncontrol/
│   ├── backend/          # FastAPI, OpenCV, MediaPipe Tasks, State Machine
│   └── frontend/         # React, Vite, Three.js, React Three Fiber
├── models/               # Modelo oficial MediaPipe Gesture Recognizer (.task)
├── scripts/              # Scripts de setup, inicialização e testes PowerShell
└── docs/                 # Arquitetura, referências e relatório de validação
```
