import math
from typing import List, Tuple, Dict, Any, Optional
from visioncontrol.backend.events.models import NormalizedPoint, GestureType
from visioncontrol.backend.gestures.geometric import GeometryClassifier

class GestureTranslatorEngine:
    """
    Motor experimental de reconhecimento de gestos personalizados e vocabulário básico de Libras
    baseado nas relações anatômicas e geométricas entre os 21 landmarks de mão.
    """
    
    # Vocabulário A: Gestos de controle personalizados
    CUSTOM_GESTURES = {
        "THUMBS_UP": "Polegar para cima (Afirmativo / OK)",
        "VICTORY": "Sinal da Vitória / Paz (Dedos V)",
        "OPEN_PALM": "Mão Aberta (Pare / Atenção)",
        "CLOSED_FIST": "Punho Fechado (Confirmar / Agarrar)",
        "POINTING_UP": "Apontando (Seleção / Número 1)",
        "LOVE_YOU": "Sinal I Love You (Polegar, Indicador e Mínimo)"
    }

    # Vocabulário B: Letras de Libras identificáveis por geometria estática invariante
    LIBRAS_LETTERS = {
        "A": "Letra A (Punho cerrado com polegar estendido lateralmente)",
        "B": "Letra B (4 dedos unidos e estendidos, polegar dobrado sobre a palma)",
        "L": "Letra L (Polegar e indicador em formato de 90 graus)",
        "V": "Letra V (Indicador e médio abertos em V)",
        "W": "Letra W (Indicador, médio e anelar estendidos e separados)",
        "I": "Letra I (Mindinho estendido para cima, demais dedos dobrados)",
        "Y": "Letra Y (Polegar e mindinho abertos, demais dobrados)"
    }

    @staticmethod
    def distance(p1: NormalizedPoint, p2: NormalizedPoint) -> float:
        return math.hypot(p1.x - p2.x, p1.y - p2.y)

    @classmethod
    def evaluate_finger_states(cls, landmarks: List[NormalizedPoint]) -> List[int]:
        return GeometryClassifier.evaluate_fingers(landmarks)

    @classmethod
    def classify_custom_gesture(cls, landmarks: List[NormalizedPoint]) -> Tuple[str, float]:
        if len(landmarks) < 21:
            return "UNKNOWN", 0.0

        states = cls.evaluate_finger_states(landmarks)
        # states = [Thumb, Index, Middle, Ring, Pinky]
        
        # Thumbs Up: Thumb = 1, outros = 0, e ponta do polegar está bem acima do pulso
        if states == [1, 0, 0, 0, 0] and landmarks[4].y < landmarks[3].y < landmarks[0].y:
            return "THUMBS_UP", 0.92

        # Victory: Index e Middle = 1, outros = 0
        if states[1] == 1 and states[2] == 1 and states[3] == 0 and states[4] == 0:
            return "VICTORY", 0.94

        # Pointing Up: Apenas Index = 1
        if states[1] == 1 and states[2] == 0 and states[3] == 0 and states[4] == 0:
            return "POINTING_UP", 0.90

        # Love You: Thumb = 1, Index = 1, Pinky = 1, Middle = 0, Ring = 0
        if states == [1, 1, 0, 0, 1]:
            return "LOVE_YOU", 0.93

        # Open Palm: Todos = 1
        if states == [1, 1, 1, 1, 1]:
            return "OPEN_PALM", 0.96

        # Closed Fist: Todos = 0
        if states == [0, 0, 0, 0, 0]:
            return "CLOSED_FIST", 0.95

        return "UNKNOWN", 0.40

    @classmethod
    def classify_libras_letter(cls, landmarks: List[NormalizedPoint]) -> Tuple[str, float]:
        if len(landmarks) < 21:
            return "NENHUMA", 0.0

        states = cls.evaluate_finger_states(landmarks)
        # states = [Thumb, Index, Middle, Ring, Pinky]

        # Letra L: Thumb=1 e Index=1, demais=0
        if states == [1, 1, 0, 0, 0]:
            return "L", 0.92

        # Letra V: Index=1, Middle=1, outros=0
        if states == [0, 1, 1, 0, 0]:
            return "V", 0.94

        # Letra W: Index=1, Middle=1, Ring=1, Thumb=0, Pinky=0
        if states == [0, 1, 1, 1, 0] or states == [1, 1, 1, 1, 0]:
            return "W", 0.91

        # Letra I: Pinky=1, outros=0
        if states == [0, 0, 0, 0, 1]:
            return "I", 0.93

        # Letra Y: Thumb=1, Pinky=1, outros=0
        if states == [1, 0, 0, 0, 1]:
            return "Y", 0.95

        # Letra B: 4 dedos estendidos unidos, polegar dobrado
        if states[1] == 1 and states[2] == 1 and states[3] == 1 and states[4] == 1 and states[0] == 0:
            return "B", 0.89

        # Letra A: Punho fechado com polegar colado ao lado do indicador
        if states == [0, 0, 0, 0, 0] or (states[0] == 1 and states[1] == 0 and states[2] == 0 and states[3] == 0 and states[4] == 0 and landmarks[4].y >= landmarks[6].y):
            return "A", 0.88

        return "INCERTO", 0.35
