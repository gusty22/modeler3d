import React from "react";
import { useVision } from "../context/VisionContext";
import { Settings, Sliders, Hand, Shield, RotateCcw } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { calibration, updateCalibration, setActiveExperience } = useVision();

  React.useEffect(() => {
    setActiveExperience("settings");
  }, [setActiveExperience]);

  return (
    <div className="vc-settings-container">
      <div className="vc-settings-header">
        <div className="vc-hud-panel">
          <Settings className="text-cyan" size={20} />
          <span>CALIBRAÇÃO E CONFIGURAÇÕES GLOBAIS DO VISIONCONTROL</span>
        </div>
      </div>

      <div className="vc-settings-grid">
        {/* Painel de Mão Dominante e Orientação */}
        <div className="vc-settings-card">
          <div className="vc-card-title flex items-center gap-2">
            <Hand size={18} className="text-cyan" />
            <span>PREFERÊNCIAS DE ENTRADA</span>
          </div>

          <div className="vc-field-group">
            <label>Mão Dominante Principal:</label>
            <div className="vc-toggle-buttons">
              <button
                onClick={() => updateCalibration({ dominantHand: "Right" })}
                className={`vc-toggle-btn ${calibration.dominantHand === "Right" ? "active" : ""}`}
              >
                Mão Direita (Padrão)
              </button>
              <button
                onClick={() => updateCalibration({ dominantHand: "Left" })}
                className={`vc-toggle-btn ${calibration.dominantHand === "Left" ? "active" : ""}`}
              >
                Mão Esquerda (Canhoto)
              </button>
            </div>
          </div>

          <div className="vc-field-group">
            <label>Espelhamento Horizontal da Câmera (Mirror X):</label>
            <div className="vc-toggle-buttons">
              <button
                onClick={() => updateCalibration({ mirrorX: true })}
                className={`vc-toggle-btn ${calibration.mirrorX ? "active" : ""}`}
              >
                Espelhado (Comportamento de Espelho)
              </button>
              <button
                onClick={() => updateCalibration({ mirrorX: false })}
                className={`vc-toggle-btn ${!calibration.mirrorX ? "active" : ""}`}
              >
                Direto (Sem Inversão)
              </button>
            </div>
          </div>
        </div>

        {/* Painel de Calibração de Sensibilidade e Limiares */}
        <div className="vc-settings-card">
          <div className="vc-card-title flex items-center gap-2">
            <Sliders size={18} className="text-cyan" />
            <span>SENSIBILIDADE & FILTRAGEM</span>
          </div>

          <div className="vc-field-group">
            <div className="vc-slider-header">
              <label>Sensibilidade do Cursor:</label>
              <span className="vc-val-badge">{calibration.sensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={calibration.sensitivity}
              onChange={(e) => updateCalibration({ sensitivity: parseFloat(e.target.value) })}
            />
          </div>

          <div className="vc-field-group">
            <div className="vc-slider-header">
              <label>Fator de Suavização (One-Euro Filter / Low-Pass):</label>
              <span className="vc-val-badge">{Math.round(calibration.smoothing * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={calibration.smoothing}
              onChange={(e) => updateCalibration({ smoothing: parseFloat(e.target.value) })}
            />
          </div>

          <div className="vc-field-group">
            <div className="vc-slider-header">
              <label>Limiar de Gatilho de Pinça (Pinch Threshold):</label>
              <span className="vc-val-badge">{calibration.pinchThreshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.04"
              max="0.15"
              step="0.01"
              value={calibration.pinchThreshold}
              onChange={(e) => updateCalibration({ pinchThreshold: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        {/* Painel de Políticas de Privacidade e Persistência */}
        <div className="vc-settings-card">
          <div className="vc-card-title flex items-center gap-2">
            <Shield size={18} className="text-cyan" />
            <span>SEGURANÇA & PRIVACIDADE</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            ✅ <strong>Processamento 100% Local:</strong> Todos os modelos de visão (MediaPipe Tasks) e síntese de áudio (Tone.js / Web Audio) executam estritamente no seu computador. Nenhum vídeo ou imagem é transferido para servidores externos.
          </p>
          <button
            onClick={() => {
              updateCalibration({
                dominantHand: "Right",
                mirrorX: true,
                sensitivity: 1.0,
                smoothing: 0.5,
                pinchThreshold: 0.08,
              });
            }}
            className="vc-reset-fader-btn"
          >
            <RotateCcw size={16} /> RESTAURAR PADRÕES DE FÁBRICA
          </button>
        </div>
      </div>
    </div>
  );
};
