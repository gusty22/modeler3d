import math
from typing import List, Tuple, Dict, Any, Optional
from visioncontrol.backend.events.models import GestureType, NormalizedPoint


class GeometryClassifier:
    """
    Classificador geométrico complementar baseado nas relações angulares e distâncias dos 21 landmarks.
    Evita falsos positivos em CLOSED_FIST e OPEN_PALM mesmo em rotações de mão.
    """

    TIP_IDS = [4, 8, 12, 16, 20]  # Polegar, Indicador, Médio, Anelar, Mínimo
    PIP_IDS = [2, 6, 10, 14, 18]  # Articulações intermediárias
    MCP_IDS = [1, 5, 9, 13, 17]   # Articulações da base

    @staticmethod
    def distance(p1: NormalizedPoint, p2: NormalizedPoint) -> float:
        return math.hypot(p1.x - p2.x, p1.y - p2.y)

    @classmethod
    def evaluate_fingers(cls, landmarks: List[NormalizedPoint], handedness: str = "Right") -> List[int]:
        """
        Retorna uma lista de 5 inteiros (0 = dobrado, 1 = estendido) para [Polegar, Indicador, Médio, Anelar, Mínimo].
        Usa a distância entre a ponta e o punho (landmark 0) comparada com a junta MCP/PIP para robustez angular.
        """
        if len(landmarks) < 21:
            return [0, 0, 0, 0, 0]

        wrist = landmarks[0]
        fingers = []

        # 1. Polegar: distância da ponta (4) ao MCP do mindinho (17) ou ao MCP do indicador (5)
        thumb_tip = landmarks[4]
        thumb_ip = landmarks[3]
        pinky_mcp = landmarks[17]
        d_tip_pinky = cls.distance(thumb_tip, pinky_mcp)
        d_ip_pinky = cls.distance(thumb_ip, pinky_mcp)
        d_tip_wrist = cls.distance(thumb_tip, wrist)
        d_ip_wrist = cls.distance(thumb_ip, wrist)
        if d_tip_pinky > d_ip_pinky * 1.05 or d_tip_wrist > d_ip_wrist * 1.05:
            fingers.append(1)
        else:
            fingers.append(0)

        # 2. 4 Dedos (Indicador, Médio, Anelar, Mínimo):
        # Um dedo está estendido se a distância da ponta ao punho for superior à da junta PIP ao punho
        for tip_id, pip_id in zip(cls.TIP_IDS[1:], cls.PIP_IDS[1:]):
            d_tip = cls.distance(landmarks[tip_id], wrist)
            d_pip = cls.distance(landmarks[pip_id], wrist)
            if d_tip > d_pip * 1.03:
                fingers.append(1)
            else:
                fingers.append(0)

        return fingers

    @classmethod
    def classify(cls, landmarks: List[NormalizedPoint], handedness: str = "Right") -> Tuple[GestureType, float]:
        """
        Interpreta o gesto geométrico com confiança:
        - OPEN_PALM: 4 ou 5 dedos estendidos
        - CLOSED_FIST: 0 dedos estendidos (ou no máximo polegar encostado com 4 dedos dobrados)
        - PINCH: Polegar e indicador muito próximos
        - MOVE: Indicador estendido ou pose neutra para apontar
        """
        if not landmarks or len(landmarks) < 21:
            return GestureType.NO_HAND, 0.0

        fingers = cls.evaluate_fingers(landmarks, handedness)
        extended_count = sum(fingers)

        # Distância polegar - indicador (pinch)
        pinch_dist = cls.distance(landmarks[4], landmarks[8])
        palm_size = cls.distance(landmarks[0], landmarks[9])  # punho ao dedo médio MCP

        # Razão normalizada pelo tamanho da palma
        rel_pinch = pinch_dist / (palm_size + 1e-6)

        # Se todos os dedos estiverem fechados
        if extended_count == 0 or (extended_count == 1 and fingers[0] == 1 and rel_pinch < 0.45):
            if fingers[1:] == [0, 0, 0, 0]:
                return GestureType.CLOSED_FIST, 0.92

        # Pinça deliberada: polegar e indicador muito próximos, com indicador ativo
        if rel_pinch < 0.22 and fingers[1] == 1:
            return GestureType.PINCH, 0.90

        if extended_count >= 4:
            conf = 0.85 + (0.1 if extended_count == 5 else 0.0)
            return GestureType.OPEN_PALM, min(1.0, conf)

        if rel_pinch < 0.28:
            return GestureType.PINCH, 0.88

        # Se indicador levantado e outros fechados, ou mão em movimento neutro
        if fingers[1] == 1 and fingers[2] == 0 and fingers[3] == 0:
            return GestureType.MOVE, 0.85

        return GestureType.MOVE, 0.70
