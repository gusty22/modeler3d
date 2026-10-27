import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useVision } from "../context/VisionContext";
import { 
  Languages, 
  Box, 
  Cpu,
  Eye,
  HandMetal,
  Sliders
} from "lucide-react";

interface HubCardProps {
  to: string;
  title: string;
  category: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  badge?: string;
}

const HubCard: React.FC<HubCardProps> = ({
  to,
  title,
  category,
  description,
  icon: Icon,
  accentColor,
  badge
}) => {
  return (
    <Link to={to} className="vc-hub-card" style={{ "--card-accent": accentColor } as React.CSSProperties}>
      <div className="vc-card-glow" />
      <div className="vc-card-header">
        <div className="vc-card-icon-wrap">
          <Icon size={28} />
        </div>
        {badge && <span className="vc-card-badge">{badge}</span>}
      </div>
      <div className="vc-card-body">
        <span className="vc-card-category">{category}</span>
        <h3 className="vc-card-title">{title}</h3>
        <p className="vc-card-desc">{description}</p>
      </div>
      <div className="vc-card-footer">
        <span>INICIAR EXPERIÊNCIA</span>
        <span className="vc-arrow">→</span>
      </div>
    </Link>
  );
};

export const HubHomePage: React.FC = () => {
  const { setActiveExperience, event } = useVision();

  useEffect(() => {
    setActiveExperience("hub");
  }, [setActiveExperience]);

  const cards: HubCardProps[] = [
    {
      to: "/translator",
      title: "Tradutor de Libras Lab",
      category: "ACESSIBILIDADE & IA",
      description: "Reconhecimento de alfabeto manual de Libras em tempo real com esteira rítmica interativa, TTS e laboratório.",
      icon: Languages,
      accentColor: "#10b981",
      badge: "LIBRAS LAB 2.0"
    },
    {
      to: "/modeler",
      title: "Modelador 3D",
      category: "COMPUTAÇÃO GRÁFICA",
      description: "Manipulação e extrusão de cubo holográfico 3D bimanual preservado da arquitetura original.",
      icon: Box,
      accentColor: "#3b82f6",
      badge: "3D MODELING"
    },
  ];

  return (
    <div className="vc-hub-page">
      <div className="vc-hub-hero">
        <div className="vc-hero-badge">
          <Cpu size={14} />
          <span>MOTOR DE VISÃO MULTI-MODAL ATIVO</span>
        </div>
        <h1 className="vc-hub-title">
          VISION<span className="text-cyan">CONTROL</span> MODULAR HUB
        </h1>
        <p className="vc-hub-subtitle">
          Plataforma unificada de interação gestual em tempo real sem contato físico. Selecione uma experiência abaixo para iniciar.
        </p>
      </div>

      <div className="vc-hub-grid">
        {cards.map((c) => (
          <HubCard key={c.to} {...c} />
        ))}
      </div>

      <div className="vc-hub-footer-status">
        <div className="vc-status-card">
          <Eye size={18} className="text-cyan" />
          <div>
            <strong>Rastreamento:</strong> {event?.gesture || "NO_HAND"} | Confiança: {Math.round((event?.confidence || 0) * 100)}%
          </div>
        </div>
        <div className="vc-status-card">
          <HandMetal size={18} className="text-cyan" />
          <div>
            <strong>Mãos Detectadas:</strong> {event?.hands_count || 0} ({event?.handedness || "Nenhuma"})
          </div>
        </div>
        <div className="vc-status-card">
          <Sliders size={18} className="text-cyan" />
          <Link to="/settings" className="text-cyan hover:underline">
            Ajustar Calibração & Sensibilidade →
          </Link>
        </div>
      </div>
    </div>
  );
};
