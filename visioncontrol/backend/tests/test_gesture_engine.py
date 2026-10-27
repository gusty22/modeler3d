import pytest
import time
from visioncontrol.backend.events.models import GestureType, InteractionState, NormalizedPoint
from visioncontrol.backend.gestures.geometric import GeometryClassifier
from visioncontrol.backend.tracking.state_machine import InteractionStateMachine, OneEuroFilter


def create_synthetic_hand(gesture: str) -> list[NormalizedPoint]:
    """Cria conjunto sintético de 21 landmarks correspondentes à pose solicitada"""
    wrist = NormalizedPoint(x=0.5, y=0.8, z=0.0)
    landmarks = [wrist for _ in range(21)]

    # Proporções anatômicas por dedo: MCP, PIP, DIP, TIP
    # Dedos: Polegar (1-4), Indicador (5-8), Médio (9-12), Anelar (13-16), Mínimo (17-20)
    # Polegar lateralizado (x=0.32) para evitar proximidade falsa com indicador (x=0.46)
    finger_bases_x = [0.32, 0.46, 0.50, 0.54, 0.58]
    
    if gesture == "OPEN_PALM":
        # Dedos estendidos verticalmente em direção ao topo (y menor)
        for f_idx, base_x in enumerate(finger_bases_x):
            start_idx = 1 + f_idx * 4
            landmarks[start_idx] = NormalizedPoint(x=base_x, y=0.65, z=0.0)      # MCP
            landmarks[start_idx + 1] = NormalizedPoint(x=base_x, y=0.50, z=0.0)  # PIP
            landmarks[start_idx + 2] = NormalizedPoint(x=base_x, y=0.38, z=0.0)  # DIP
            landmarks[start_idx + 3] = NormalizedPoint(x=base_x, y=0.25, z=0.0)  # TIP
    elif gesture == "CLOSED_FIST":
        # Dedos dobrados para baixo em direção à palma (y maior ou próximo ao MCP)
        for f_idx, base_x in enumerate(finger_bases_x):
            start_idx = 1 + f_idx * 4
            landmarks[start_idx] = NormalizedPoint(x=base_x, y=0.65, z=0.0)      # MCP
            landmarks[start_idx + 1] = NormalizedPoint(x=base_x, y=0.58, z=0.0)  # PIP
            landmarks[start_idx + 2] = NormalizedPoint(x=base_x, y=0.63, z=0.0)  # DIP
            landmarks[start_idx + 3] = NormalizedPoint(x=base_x, y=0.68, z=0.0)  # TIP (dobrado para dentro)
    return landmarks


def test_geometric_classifier_open_palm():
    lms = create_synthetic_hand("OPEN_PALM")
    gesture, conf = GeometryClassifier.classify(lms)
    assert gesture == GestureType.OPEN_PALM
    assert conf >= 0.85


def test_geometric_classifier_closed_fist():
    lms = create_synthetic_hand("CLOSED_FIST")
    gesture, conf = GeometryClassifier.classify(lms)
    assert gesture == GestureType.CLOSED_FIST
    assert conf >= 0.85


def test_state_machine_tracking_to_drag_and_release():
    sm = InteractionStateMachine(fist_threshold_frames=2, open_threshold_frames=1)
    lms_open = create_synthetic_hand("OPEN_PALM")
    lms_fist = create_synthetic_hand("CLOSED_FIST")

    # Inicia com IDLE
    assert sm.state == InteractionState.IDLE

    # Recebe OPEN_PALM -> vira TRACKING
    state, cursor = sm.update(GestureType.OPEN_PALM, lms_open, timestamp=1.0)
    assert state == InteractionState.TRACKING

    # Hovering sobre o cubo
    sm.set_hover(True)
    state, _ = sm.update(GestureType.OPEN_PALM, lms_open, timestamp=1.03)
    assert state == InteractionState.HOVERING

    # 1º frame CLOSED_FIST (histerese aguarda threshold=2)
    state, _ = sm.update(GestureType.CLOSED_FIST, lms_fist, timestamp=1.06)
    assert state == InteractionState.HOVERING

    # 2º frame CLOSED_FIST -> inicia DRAGGING
    state, _ = sm.update(GestureType.CLOSED_FIST, lms_fist, timestamp=1.09)
    assert state == InteractionState.DRAGGING

    # Abre a mão -> solta e volta para HOVERING
    state, _ = sm.update(GestureType.OPEN_PALM, lms_open, timestamp=1.12)
    assert state == InteractionState.HOVERING


def test_state_machine_lost_tracking_safety():
    sm = InteractionStateMachine(fist_threshold_frames=2, lost_tracking_timeout_s=0.2)
    lms_fist = create_synthetic_hand("CLOSED_FIST")
    sm.set_hover(True)
    # 1º frame: vira HOVERING
    sm.update(GestureType.CLOSED_FIST, lms_fist, timestamp=1.0)
    # 2º frame: histerese atinge threshold=2 -> DRAGGING
    sm.update(GestureType.CLOSED_FIST, lms_fist, timestamp=1.05)
    assert sm.state == InteractionState.DRAGGING

    # Desaparecimento da mão por mais de 0.2s -> Segurança: transição para LOST_TRACKING sem prender objeto
    state, _ = sm.update(GestureType.NO_HAND, None, timestamp=1.35)
    assert state == InteractionState.LOST_TRACKING


def test_one_euro_filter_smoothing():
    f = OneEuroFilter(min_cutoff=1.0, beta=0.01)
    v1 = f.filter(0.5, t=1.0)
    v2 = f.filter(0.52, t=1.03)
    # Valor deve ser suavizado entre 0.50 e 0.52
    assert 0.50 <= v2 <= 0.52


def test_geometric_classifier_pinch_detection():
    # Cria mão com polegar (landmark 4) e indicador (landmark 8) muito próximos
    lms = create_synthetic_hand("OPEN_PALM")
    # Aproxima a ponta do polegar da ponta do indicador
    lms[4] = NormalizedPoint(x=0.46, y=0.30, z=0.0)
    lms[8] = NormalizedPoint(x=0.462, y=0.302, z=0.0)
    
    gesture, conf = GeometryClassifier.classify(lms)
    assert gesture in (GestureType.PINCH, GestureType.MOVE)
    assert conf >= 0.70
