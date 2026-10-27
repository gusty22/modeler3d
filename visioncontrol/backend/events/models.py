from enum import Enum
from typing import List, Optional, Tuple, Dict, Any
from pydantic import BaseModel, Field
import time


class GestureType(str, Enum):
    NO_HAND = "NO_HAND"
    OPEN_PALM = "OPEN_PALM"
    CLOSED_FIST = "CLOSED_FIST"
    MOVE = "MOVE"
    PINCH = "PINCH"


class InteractionState(str, Enum):
    IDLE = "IDLE"
    TRACKING = "TRACKING"
    HOVERING = "HOVERING"
    DRAGGING = "DRAGGING"
    SCALING = "SCALING"
    MODELING = "MODELING"
    LOST_TRACKING = "LOST_TRACKING"


class NormalizedPoint(BaseModel):
    x: float = Field(..., description="Coordenada X normalizada [0.0, 1.0]")
    y: float = Field(..., description="Coordenada Y normalizada [0.0, 1.0]")
    z: float = Field(default=0.0, description="Profundidade Z relativa estimada")


class CursorPosition(BaseModel):
    x: float = Field(..., description="Cursor normalizado X [0.0, 1.0]")
    y: float = Field(..., description="Cursor normalizado Y [0.0, 1.0]")


class SingleHandData(BaseModel):
    hand_id: str
    handedness: str  # "Left" ou "Right"
    gesture: GestureType = GestureType.NO_HAND
    confidence: float = 0.0
    cursor: CursorPosition
    landmarks: List[NormalizedPoint]
    pinch_distance: float = 1.0
    is_pinching: bool = False
    is_fist: bool = False


class GestureEvent(BaseModel):
    version: str = "2.0.0"
    sequence: int = Field(..., description="Número sequencial incremental de evento")
    timestamp: float = Field(default_factory=time.time, description="Timestamp UNIX")
    event_type: str = Field(..., description="Tipo do evento")
    
    # Suporte Bimanual (Duas Mãos)
    hands: List[SingleHandData] = Field(default_factory=list)
    hands_count: int = 0
    two_hand_distance: Optional[float] = None
    two_hand_angle: Optional[float] = None
    
    # Compatibilidade primária
    gesture: GestureType = GestureType.NO_HAND
    interaction_state: InteractionState = InteractionState.IDLE
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    cursor: Optional[CursorPosition] = None
    handedness: Optional[str] = None
    raw_landmarks: Optional[List[NormalizedPoint]] = None
    
    fps: float = 0.0
    latency_ms: float = 0.0
    is_simulation: bool = False
    camera_opened: bool = False
    details: Optional[Dict[str, Any]] = None
