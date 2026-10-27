export type GestureType = "NO_HAND" | "OPEN_PALM" | "CLOSED_FIST" | "MOVE" | "PINCH";

export type InteractionState =
  | "IDLE"
  | "TRACKING"
  | "HOVERING"
  | "SELECTING"
  | "TRANSLATING"
  | "DRAGGING"
  | "ROTATING"
  | "SCALING"
  | "MODELING"
  | "MENU_ACTIVE"
  | "PREVIEWING"
  | "COMMITTING"
  | "LOST_TRACKING";

export interface NormalizedPoint {
  x: number;
  y: number;
  z?: number;
}

export interface CursorPosition {
  x: number;
  y: number;
}

export interface SingleHandData {
  hand_id: string;
  handedness: "Left" | "Right" | string;
  gesture: GestureType;
  confidence: number;
  cursor: CursorPosition;
  landmarks: NormalizedPoint[];
  pinch_distance: number;
  is_pinching: boolean;
  is_fist: boolean;
}

export interface GestureEvent {
  version: string;
  sequence: number;
  timestamp: number;
  event_type: string;
  hands?: SingleHandData[];
  hands_count?: number;
  two_hand_distance?: number;
  two_hand_angle?: number;
  gesture: GestureType;
  interaction_state: InteractionState;
  confidence: number;
  cursor?: CursorPosition;
  handedness?: string;
  raw_landmarks?: NormalizedPoint[];
  fps: number;
  latency_ms: number;
  is_simulation: boolean;
  camera_opened?: boolean;
  details?: Record<string, unknown>;
}
