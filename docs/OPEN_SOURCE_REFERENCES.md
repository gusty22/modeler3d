# Relatório de Referências Open Source — VisionControl Modular Hub

Data: 2026-10-27
Branch: `feature/visioncontrol-modular-hub`

Este documento registra a análise técnica, licença, compatibilidade e riscos das bibliotecas e projetos de referência clonados em `_references/` (mantidos fora do versionamento via `.gitignore`).

---

### 1. google-ai-edge/mediapipe-samples
- **URL:** https://github.com/google-ai-edge/mediapipe-samples
- **Commit:** `4ce9cbe` (main)
- **Licença:** Apache 2.0 (Permissiva comercial e open source)
- **Recursos Úteis:** Topologia de 21 landmarks de mão, vetores de normalização, cálculo de ângulo de nós e detecção de gestos estáticos.
- **O que será utilizado:** Reutilização dos landmarks normalizados com cálculo de distâncias relativas para repulsor, teclas de piano, crossfader e cursor.
- **Riscos / Mitigação:** Sem risco de licenciamento. Processamento local em tempo real com taxa de amostragem constante.

---

### 2. remix-run/react-router
- **URL:** https://github.com/remix-run/react-router
- **Commit:** `cff9974`
- **Licença:** MIT (Permissiva)
- **Recursos Úteis:** Roteamento declarativo no frontend para páginas SPA (`/`, `/ironman`, `/instrument`, `/dj`, `/translator`, `/controller`, `/modeler`, `/settings`).
- **O que será utilizado:** Roteamento com `react-router-dom` sem recarregamento de página, garantindo que o WebSocket e a stream de vídeo permaneçam ativos ou se desconectem ordenadamente.
- **Riscos / Mitigação:** Vazamento de listeners ou loops de áudio ao trocar de página; mitigado por um `ExperienceManager` que desmonta timers, synth e listeners a cada troca de rota.

---

### 3. Tonejs/Tone.js
- **URL:** https://github.com/Tonejs/Tone.js
- **Commit:** `d9990b7`
- **Licença:** MIT
- **Recursos Úteis:** Síntese polifônica de áudio no navegador (`Synth`, `PolySynth`, `Players`, filtros biquad, crossfade analógico).
- **O que será utilizado:**
  - No módulo `/instrument`: `PolySynth` e síntese FM com controle de pitch e volume.
  - No módulo `/dj`: Roteamento de canais Deck A e Deck B com controle contínuo do Crossfader pelo eixo X da mão.
- **Riscos / Mitigação:** Restrição de AudioContext do navegador (necessidade de gesto de desbloqueio pelo usuário) e risco de memory leak se não chamar `.dispose()`. Tratado com inicialização explícita via botão e lifecycle cleanup.

---

### 4. katspaugh/wavesurfer.js
- **URL:** https://github.com/katspaugh/wavesurfer.js
- **Commit:** `6926952`
- **Licença:** BSD 3-Clause (Permissiva)
- **Recursos Úteis:** Renderização em Canvas da forma de onda sonora de arquivos de áudio.
- **O que será utilizado:** Exibição da forma de onda visual nos Decks do DJ Studio.
- **Riscos / Mitigação:** Wavesurfer tem seu próprio ciclo de reprodução; para evitar conflito com Tone.js, o Wavesurfer será usado estritamente para visualização ou em sincronia de play/pause sem duplicar canais de saída.

---

### 5. Heitorccf/librasign
- **URL:** https://github.com/Heitorccf/librasign
- **Commit:** `36468650171e260282103ef411eb49fbe156ba35`
- **Licença:** **GNU GPL v3.0** (Viral / Restritiva)
- **Análise de Risco & Decisão de Licença:** A GPL v3.0 impõe que código derivado ou compilado conjuntamente seja aberto sob GPL v3.0. **Decisão:** Não copiar código, scripts ou pesos de modelos diretamente do LibraSign para o projeto principal. Apenas adotamos o padrão de mapeamento de características geométricas e classificação de poses de mão em formato aberto MIT/Apache, identificando o módulo de Libras no frontend como protótipo experimental devidamente documentado.

---

### 6. asweigart/pyautogui & Rcidshacker/airmouse
- **URL:** https://github.com/asweigart/pyautogui & https://github.com/Rcidshacker/airmouse
- **Licença:** BSD (pyautogui) / MIT (airmouse)
- **Recursos Úteis:** `pyautogui.moveTo`, `click`, `mouseDown`, `mouseUp`, `scroll`. Airmouse demonstra calibração de bounding box e zona morta.
- **O que será utilizado:** Módulo `/controller` com backend controlado por whitelist estrita, autorização explícita no frontend, botão de parada de emergência (Kill Switch) e fail-safe nativo do PyAutoGUI (cursor nos cantos da tela interrompe execução).
- **Riscos / Mitigação:** Acionamento involuntário ou perda de controle do mouse. Mitigado por exigência de armação deliberada (`Armed = True`), zona de atuação delimitada e desconexão imediata se perder tracking.
