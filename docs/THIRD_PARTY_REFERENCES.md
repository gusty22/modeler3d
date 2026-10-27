# Terceiros e Referências Utilizadas no VisionControl MVP

Este documento registra a proveniência, licenciamento e o que exatamente foi reaproveitado dos repositórios de referência clonados em `_references/`.

---

## 1. Google AI Edge — MediaPipe Python Samples
- **Repositório:** [https://github.com/google-ai-edge/mediapipe-samples](https://github.com/google-ai-edge/mediapipe-samples)
- **Licença:** Apache 2.0
- **Aproveitamento no VisionControl:**
  - Carregamento de modelos `.task` do MediaPipe Tasks (`vision.GestureRecognizerOptions`).
  - Mapeamento das categorias canônicas: `Open_Palm`, `Closed_Fist`, `Pointing_Up`.
  - Estrutura de coordenadas normalizadas `[0.0, 1.0]` dos 21 landmarks da mão.
- **Adaptação para Windows:**
  - Carregamento através de `model_asset_buffer` na memória binária para contornar problemas de caminhos com caracteres acentuados no OneDrive.

---

## 2. CVZone (Computer Vision Zone)
- **Repositório:** [https://github.com/cvzone/cvzone](https://github.com/cvzone/cvzone)
- **Licença:** MIT
- **Aproveitamento no VisionControl:**
  - Algoritmo matemático de cálculo de extensão de dedos (`fingersUp`) adaptado no `GeometryClassifier`.
  - Cálculo de distâncias euclidianas entre articulações chave (ponta vs junta PIP vs punho) para desempate instantâneo de pose e prevenção de falsos positivos.

---

## 3. React Three Fiber & Drei (Poimandres)
- **Repositórios:** 
  - [https://github.com/pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber)
  - [https://github.com/pmndrs/drei](https://github.com/pmndrs/drei)
- **Licença:** MIT
- **Aproveitamento no VisionControl:**
  - Canvas 3D declarativo (`@react-three/fiber`).
  - Raycaster para teste de interseção entre a posição normalizada do cursor e a geometria do cubo.
  - Projeção contínua no plano virtual Z=0 durante o estado `DRAGGING`.
