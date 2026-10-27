import math
import time
from typing import Tuple, List
from visioncontrol.backend.events.models import GestureType, NormalizedPoint


class SimulationGenerator:
    """
    Gerador de eventos sintéticos para o Modo Simulação (F08).
    Permite validar completamente o fluxo, WebSocket, movimentação 3D e máquina de estados
    sem depender de câmera física.
    """

    def __init__(self):
        self.start_time = time.time()
        self.sequence = 0

    def get_simulated_frame(self) -> Tuple[GestureType, List[NormalizedPoint], str]:
        """
        Gera um ciclo determinístico de interação a cada 10 segundos:
        - 0s a 2s: OPEN_PALM movendo o cursor suavemente em direção ao cubo (HOVER)
        - 2s a 6s: CLOSED_FIST arrastando o cubo em trajetória circular/elíptica (DRAGGING)
        - 6s a 8s: OPEN_PALM soltando o cubo (RELEASE)
        - 8s a 10s: NO_HAND temporário para validar recuperação de perda de tracking
        """
        elapsed = (time.time() - self.start_time) % 10.0
        self.sequence += 1

        if elapsed < 2.0:
            gesture = GestureType.OPEN_PALM
            # Caminho de aproximação até o centro (0.5, 0.5)
            progress = elapsed / 2.0
            cx = 0.2 + progress * 0.3
            cy = 0.3 + progress * 0.2
        elif elapsed < 6.0:
            gesture = GestureType.CLOSED_FIST
            # Movimento orbital arrastando o cubo
            phase = (elapsed - 2.0) * (2.0 * math.pi / 4.0)
            cx = 0.5 + 0.22 * math.cos(phase)
            cy = 0.5 + 0.18 * math.sin(phase)
        elif elapsed < 8.0:
            gesture = GestureType.OPEN_PALM
            # Repouso após soltar
            cx = 0.72
            cy = 0.5
        else:
            # Perda momentânea de rastreamento
            return GestureType.NO_HAND, [], "Right"

        # Gera 21 landmarks sintéticos em torno de (cx, cy)
        landmarks: List[NormalizedPoint] = []
        wrist = NormalizedPoint(x=cx, y=cy + 0.08, z=0.0)
        landmarks.append(wrist)

        # Gerar articulações proporcionais para validar algoritmos de cálculo geométrico
        is_fist = (gesture == GestureType.CLOSED_FIST)
        finger_offset = 0.02 if is_fist else 0.06

        for i in range(1, 21):
            angle = (i / 20.0) * math.pi - math.pi / 2
            lx = cx + math.cos(angle) * (finger_offset * (0.5 + (i % 4) * 0.2))
            ly = cy - math.sin(angle) * (finger_offset * (0.5 + (i % 4) * 0.2))
            landmarks.append(NormalizedPoint(x=lx, y=ly, z=0.0))

        # Ponto 9 (MCP Médio) exatamente em (cx, cy)
        landmarks[9] = NormalizedPoint(x=cx, y=cy, z=0.0)

        return gesture, landmarks, "Right"
