import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useVision } from "../context/VisionContext";
import { 
  Home, 
  Languages, 
  Box, 
  Settings, 
  Camera, 
  CameraOff, 
  Activity, 
  Radio,
  Maximize2
} from "lucide-react";

export const NavigationBar: React.FC = () => {
  const location = useLocation();
  const { event, isConnected, toggleCamera } = useVision();

  const isCamOpen = event?.camera_opened ?? false;
  const fps = Math.round(event?.fps ?? 0);
  const handsCount = event?.hands_count ?? 0;
  const isSimulation = event?.is_simulation ?? false;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const navLinks = [
    { to: "/", label: "Hub", icon: Home },
    { to: "/translator", label: "Tradutor Libras", icon: Languages },
    { to: "/modeler", label: "Modelador 3D", icon: Box },
    { to: "/settings", label: "Ajustes", icon: Settings },
  ];

  return (
    <header className="vc-nav-header">
      <div className="vc-nav-brand">
        <Link to="/" className="vc-brand-logo">
          <Activity className="vc-brand-icon" />
          <span className="vc-brand-title">VISION<span className="vc-brand-accent">CONTROL</span> HUB</span>
        </Link>
      </div>

      <nav className="vc-nav-items">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`vc-nav-btn ${isActive ? "active" : ""}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="vc-nav-telemetry">
        <div className="vc-telemetry-badge" title="Status da Câmera Compartilhada">
          <button
            onClick={() => toggleCamera(!isCamOpen)}
            className={`vc-cam-toggle ${isCamOpen ? "on" : "off"}`}
          >
            {isCamOpen ? <Camera size={14} /> : <CameraOff size={14} />}
            <span>{isCamOpen ? (isSimulation ? "SIMULADA" : "WEBCAM ON") : "CAM OFF"}</span>
          </button>
        </div>

        <div className="vc-telemetry-item">
          <Radio size={14} className={isConnected ? "text-cyan" : "text-amber"} />
          <span>{isConnected ? "WS CONECTADO" : "CONECTANDO..."}</span>
        </div>

        <div className="vc-telemetry-item">
          <span className="vc-telemetry-label">FPS:</span>
          <span className="vc-telemetry-val">{fps}</span>
        </div>

        <div className="vc-telemetry-item">
          <span className="vc-telemetry-label">MÃOS:</span>
          <span className="vc-telemetry-val">{handsCount}</span>
        </div>

        <button 
          onClick={toggleFullscreen} 
          className="vc-fullscreen-btn"
          title="Tela Cheia"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </header>
  );
};
