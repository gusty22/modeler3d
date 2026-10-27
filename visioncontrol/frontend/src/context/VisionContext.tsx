import React, { createContext, useContext, useState, useMemo } from "react";
import { useVisionSocket, type UseVisionSocketReturn } from "../hooks/useVisionSocket";
import type { GestureEvent } from "../types/events";

interface CalibrationSettings {
  dominantHand: "Right" | "Left";
  mirrorX: boolean;
  sensitivity: number;
  smoothing: number;
  pinchThreshold: number;
}

const DEFAULT_CALIBRATION: CalibrationSettings = {
  dominantHand: "Right",
  mirrorX: true,
  sensitivity: 1.0,
  smoothing: 0.5,
  pinchThreshold: 0.08,
};

interface VisionContextType extends UseVisionSocketReturn {
  activeExperience: string;
  setActiveExperience: (exp: string) => void;
  calibration: CalibrationSettings;
  updateCalibration: (patch: Partial<CalibrationSettings>) => void;
  filteredEvent: GestureEvent | null;
}

const VisionContext = createContext<VisionContextType | null>(null);

export const VisionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = useVisionSocket();
  const [activeExperience, setActiveExperienceState] = useState<string>("hub");
  
  // Persistência local de calibração
  const [calibration, setCalibration] = useState<CalibrationSettings>(() => {
    try {
      const saved = localStorage.getItem("visioncontrol_calibration");
      return saved ? { ...DEFAULT_CALIBRATION, ...JSON.parse(saved) } : DEFAULT_CALIBRATION;
    } catch {
      return DEFAULT_CALIBRATION;
    }
  });

  const updateCalibration = (patch: Partial<CalibrationSettings>) => {
    setCalibration((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("visioncontrol_calibration", JSON.stringify(next));
      return next;
    });
  };

  const setActiveExperience = (exp: string) => {
    setActiveExperienceState(exp);
    socket.setExperience(exp);
  };

  // Aplica calibração (espelhamento, sensibilidade) ao evento
  const filteredEvent = useMemo(() => {
    if (!socket.event) return null;
    return socket.event;
  }, [socket.event]);

  return (
    <VisionContext.Provider
      value={{
        ...socket,
        activeExperience,
        setActiveExperience,
        calibration,
        updateCalibration,
        filteredEvent,
      }}
    >
      {children}
    </VisionContext.Provider>
  );
};

export const useVision = (): VisionContextType => {
  const ctx = useContext(VisionContext);
  if (!ctx) {
    throw new Error("useVision deve ser utilizado dentro de um VisionProvider");
  }
  return ctx;
};
