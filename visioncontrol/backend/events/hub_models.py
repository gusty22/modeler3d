import time
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CalibrationConfig(BaseModel):
    dominant_hand: str = "Right"
    mirror_x: bool = True
    sensitivity: float = 1.0
    smoothing: float = 0.5
    pinch_threshold: float = 0.08
    active_zone_margin: float = 0.1
