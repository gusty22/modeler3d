import time
from typing import Optional, Tuple
from visioncontrol.backend.events.models import GestureType, InteractionState, CursorPosition, NormalizedPoint


class OneEuroFilter:
    """
    Filtro 1€ para suavização adaptativa: alta precisão e baixíssimo jitter em repouso,
    com mínima latência em movimentos rápidos.
    """
    def __init__(self, min_cutoff: float = 1.0, beta: float = 0.007, d_cutoff: float = 1.0):
        self.min_cutoff = min_cutoff
        self.beta = beta
        self.d_cutoff = d_cutoff
        self.x_prev: Optional[float] = None
        self.dx_prev: float = 0.0
        self.t_prev: Optional[float] = None

    def _alpha(self, cutoff: float, dt: float) -> float:
        tau = 1.0 / (2.0 * 3.14159265 * cutoff)
        return 1.0 / (1.0 + tau / dt)

    def filter(self, x: float, t: Optional[float] = None) -> float:
        if t is None:
            t = time.time()
        if self.t_prev is None:
            self.x_prev = x
            self.dx_prev = 0.0
            self.t_prev = t
            return x

        dt = max(1e-4, t - self.t_prev)
        self.t_prev = t

        dx = (x - self.x_prev) / dt
        edx = self._alpha(self.d_cutoff, dt) * dx + (1.0 - self._alpha(self.d_cutoff, dt)) * self.dx_prev
        self.dx_prev = edx

        cutoff = self.min_cutoff + self.beta * abs(edx)
        alpha = self._alpha(cutoff, dt)
        filtered_x = alpha * x + (1.0 - alpha) * self.x_prev
        self.x_prev = filtered_x
        return filtered_x

    def reset(self):
        self.x_prev = None
        self.dx_prev = 0.0
        self.t_prev = None


class InteractionStateMachine:
    """
    Máquina de estados explícita:
    IDLE -> TRACKING -> HOVERING -> DRAGGING -> LOST_TRACKING

    Incorpora:
    - Suavização adaptativa 1€ no cursor
    - Histerese temporal para transições de gestos (evita trepidação entre OPEN e CLOSED)
    - Desconexão e liberação segura de objetos ao perder o rastreamento
    - Espelhamento de coordenadas (espelho da webcam para naturalidade de interação humana)
    """

    def __init__(self,
                 fist_threshold_frames: int = 3,
                 open_threshold_frames: int = 2,
                 lost_tracking_timeout_s: float = 0.35):
        self.state = InteractionState.IDLE
        self.filter_x = OneEuroFilter(min_cutoff=1.2, beta=0.015)
        self.filter_y = OneEuroFilter(min_cutoff=1.2, beta=0.015)

        self.fist_threshold_frames = fist_threshold_frames
        self.open_threshold_frames = open_threshold_frames
        self.lost_tracking_timeout_s = lost_tracking_timeout_s

        self.fist_counter = 0
        self.open_counter = 0
        self.last_seen_time = 0.0
        self.is_hovering_target = False  # Definido pelo feedback ou proximidade
        self.current_cursor = CursorPosition(x=0.5, y=0.5)

    def set_hover(self, hovering: bool):
        """Notificado quando o cursor está sobre um objeto 3D interativo"""
        self.is_hovering_target = hovering

    def update(self,
               gesture: GestureType,
               landmarks: Optional[list] = None,
               timestamp: Optional[float] = None) -> Tuple[InteractionState, CursorPosition]:
        now = timestamp or time.time()

        # 1. Se nenhuma mão for detectada
        if gesture == GestureType.NO_HAND or not landmarks or len(landmarks) < 21:
            if self.state in [InteractionState.TRACKING, InteractionState.HOVERING, InteractionState.DRAGGING]:
                if (now - self.last_seen_time) > self.lost_tracking_timeout_s:
                    self.state = InteractionState.LOST_TRACKING
                    self.filter_x.reset()
                    self.filter_y.reset()
                    self.fist_counter = 0
                    self.open_counter = 0
            else:
                self.state = InteractionState.IDLE
            return self.state, self.current_cursor

        # Mão detectada com sucesso
        self.last_seen_time = now

        # Ponto de referência para o cursor: MCP do dedo médio (9) ou ponta do indicador (8)
        # O nó 9 (MCP Médio) é o centro de gravidade mais estável da mão durante o fechar do punho!
        ref_pt = landmarks[9]

        # Espelhamento horizontal para sensação natural na tela
        raw_x = 1.0 - ref_pt.x
        raw_y = ref_pt.y

        # Limitar dentro de [0, 1]
        raw_x = max(0.0, min(1.0, raw_x))
        raw_y = max(0.0, min(1.0, raw_y))

        # Aplica filtragem suave 1 Euro
        smoothed_x = self.filter_x.filter(raw_x, now)
        smoothed_y = self.filter_y.filter(raw_y, now)
        self.current_cursor = CursorPosition(x=round(smoothed_x, 4), y=round(smoothed_y, 4))

        # 2. Histerese de contagem para estabilidade de gestos
        if gesture == GestureType.CLOSED_FIST:
            self.fist_counter += 1
            self.open_counter = 0
        elif gesture == GestureType.OPEN_PALM:
            self.open_counter += 1
            self.fist_counter = 0
        else:
            # Gesto intermediário (MOVE, etc.)
            self.fist_counter = max(0, self.fist_counter - 1)
            self.open_counter = max(0, self.open_counter - 1)

        # 3. Transições de estados
        if self.state in [InteractionState.IDLE, InteractionState.LOST_TRACKING]:
            self.state = InteractionState.TRACKING

        if self.state == InteractionState.TRACKING:
            if self.is_hovering_target:
                self.state = InteractionState.HOVERING
            elif self.fist_counter >= self.fist_threshold_frames:
                # Fechou a mão mesmo sem estar diretamente em hover prévio, mas em modo interativo
                self.state = InteractionState.DRAGGING

        elif self.state == InteractionState.HOVERING:
            if not self.is_hovering_target and self.fist_counter == 0:
                self.state = InteractionState.TRACKING
            elif self.fist_counter >= self.fist_threshold_frames:
                # Inicia arraste com alvo confirmado
                self.state = InteractionState.DRAGGING

        elif self.state == InteractionState.DRAGGING:
            # Para soltar o objeto: abrir a mão com histerese
            if self.open_counter >= self.open_threshold_frames or gesture == GestureType.OPEN_PALM:
                self.state = InteractionState.HOVERING if self.is_hovering_target else InteractionState.TRACKING
                self.fist_counter = 0

        return self.state, self.current_cursor
