import asyncio
import time
import math
import cv2
import numpy as np
from typing import Set, Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from visioncontrol.backend.events.models import (
    GestureEvent, GestureType, InteractionState, CursorPosition, SingleHandData, NormalizedPoint
)
from visioncontrol.backend.camera.manager import CameraManager
from visioncontrol.backend.camera.simulation import SimulationGenerator
from visioncontrol.backend.gestures.engine import HybridGestureEngine
from visioncontrol.backend.tracking.state_machine import InteractionStateMachine
from visioncontrol.backend.events.hub_models import CalibrationConfig

app = FastAPI(
    title="HoloForge 3D Modeling Server",
    version="2.0.0",
    description="Motor bimanual de modelagem e manipulação espacial 3D em tempo real."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (5, 9), (9, 10), (10, 11), (11, 12),
    (9, 13), (13, 14), (14, 15), (15, 16),
    (13, 17), (17, 18), (18, 19), (19, 20),
    (0, 17)
]

class SystemRuntime:
    def __init__(self):
        self.camera_manager = CameraManager()
        self.gesture_engine = HybridGestureEngine()
        self.state_machine = InteractionStateMachine()
        self.simulation_gen = SimulationGenerator()
        self.calibration = CalibrationConfig()
        self.connected_clients: Set[WebSocket] = set()
        self.is_simulation_mode = False
        self.sequence = 0
        self.is_running = False
        self.worker_task: Optional[asyncio.Task] = None
        self.fps = 0.0
        self.last_latency_ms = 0.0
        self.latest_annotated_jpeg: Optional[bytes] = None
        self.active_experience: str = "modeler"

runtime = SystemRuntime()

class ModeRequest(BaseModel):
    simulation: bool

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "HoloForge 3D Modeling Server",
        "version": "2.0.0",
        "camera_opened": runtime.camera_manager.is_opened,
        "is_simulation_mode": runtime.is_simulation_mode,
        "connected_clients": len(runtime.connected_clients),
        "fps": runtime.fps,
        "latency_ms": runtime.last_latency_ms,
        "model_loaded": runtime.gesture_engine.recognizer is not None
    }

@app.post("/api/camera/start")
def start_camera():
    runtime.is_simulation_mode = False
    success = runtime.camera_manager.start()
    return {
        "success": success,
        "camera_opened": runtime.camera_manager.is_opened,
        "is_simulation_mode": runtime.is_simulation_mode
    }

@app.post("/api/camera/stop")
def stop_camera():
    runtime.camera_manager.stop()
    return {
        "success": True,
        "camera_opened": runtime.camera_manager.is_opened,
        "is_simulation_mode": runtime.is_simulation_mode
    }

@app.get("/video_feed")
def video_feed():
    def frame_generator():
        while runtime.is_running:
            if runtime.latest_annotated_jpeg is not None:
                yield (b"--frame\r\n"
                       b"Content-Type: image/jpeg\r\n\r\n" + runtime.latest_annotated_jpeg + b"\r\n")
            time.sleep(0.033)

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

async def broadcast_event(event: GestureEvent):
    if not runtime.connected_clients:
        return
    message_json = event.model_dump_json()
    disconnected = set()
    for ws in runtime.connected_clients:
        try:
            await ws.send_text(message_json)
        except Exception:
            disconnected.add(ws)
    for ws in disconnected:
        runtime.connected_clients.discard(ws)

def annotate_frame_3d(frame, hands: List[SingleHandData], state: InteractionState, fps: float, latency: float):
    annotated = cv2.flip(frame, 1)
    h, w, _ = annotated.shape

    colors = {
        "Left": ((56, 189, 248), (200, 240, 255)),
        "Right": ((74, 222, 128), (220, 255, 220))
    }

    hand_centers = []

    for hand in hands:
        line_color, joint_color = colors.get(hand.handedness, ((56, 189, 248), (255, 255, 255)))
        pts = [(int((1.0 - lm.x) * w), int(lm.y * h)) for lm in hand.landmarks]

        for s_idx, e_idx in HAND_CONNECTIONS:
            cv2.line(annotated, pts[s_idx], pts[e_idx], line_color, 2)

        for idx, pt in enumerate(pts):
            radius = 6 if idx in [4, 8, 9] else 3
            c = (236, 72, 153) if idx in [4, 8] and hand.is_pinching else joint_color
            cv2.circle(annotated, pt, radius, c, -1)
            cv2.circle(annotated, pt, radius + 1, (255, 255, 255), 1)

        wrist_pt = pts[0]
        hand_label = f"{hand.handedness}: {hand.gesture.value}"
        cv2.putText(annotated, hand_label, (wrist_pt[0] - 30, wrist_pt[1] + 24),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, line_color, 2)

        hand_centers.append(pts[9])

    if len(hand_centers) >= 2:
        cv2.line(annotated, hand_centers[0], hand_centers[1], (234, 179, 8), 2)
        mid_x = (hand_centers[0][0] + hand_centers[1][0]) // 2
        mid_y = (hand_centers[0][1] + hand_centers[1][1]) // 2
        cv2.circle(annotated, (mid_x, mid_y), 5, (234, 179, 8), -1)
        cv2.putText(annotated, "BIMANUAL 3D SCALING", (mid_x - 70, mid_y - 12),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (234, 179, 8), 1)

    cv2.rectangle(annotated, (0, 0), (w, 36), (15, 23, 42), -1)
    status_text = f"3D MODELER | STATE: {state.value} | {fps:.1f} FPS"
    cv2.putText(annotated, status_text, (12, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (248, 250, 252), 2)

    ret, buffer = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 80])
    if ret:
        return buffer.tobytes()
    return None

async def vision_processing_loop():
    while runtime.is_running:
        t0 = time.time()
        runtime.sequence += 1

        hands_list: List[SingleHandData] = []
        raw_frame = None
        is_sim = False

        if runtime.is_simulation_mode or not runtime.camera_manager.is_opened:
            is_sim = True
            runtime.fps = 30.0
            g, lms, hand_side = runtime.simulation_gen.get_simulated_frame()
            if lms and len(lms) >= 21:
                cur = CursorPosition(x=round(1.0 - lms[9].x, 4), y=round(lms[9].y, 4))
                hands_list.append(SingleHandData(
                    hand_id="sim_hand_1",
                    handedness=hand_side,
                    gesture=g,
                    confidence=0.95,
                    cursor=cur,
                    landmarks=lms,
                    pinch_distance=0.2 if g == GestureType.CLOSED_FIST else 0.8,
                    is_pinching=(g == GestureType.CLOSED_FIST),
                    is_fist=(g == GestureType.CLOSED_FIST)
                ))
        else:
            success, bgr_frame, mp_image = runtime.camera_manager.read_frame()
            raw_frame = bgr_frame
            if success and mp_image is not None:
                hands_list = runtime.gesture_engine.process_multi_hand(mp_image, bgr_frame)
            runtime.fps = runtime.camera_manager.fps

        hands_count = len(hands_list)
        two_dist = None
        two_angle = None

        if hands_count >= 2:
            h1, h2 = hands_list[0], hands_list[1]
            dx = h2.cursor.x - h1.cursor.x
            dy = h2.cursor.y - h1.cursor.y
            two_dist = math.hypot(dx, dy)
            two_angle = math.atan2(dy, dx)

            if (h1.is_pinching or h1.is_fist) and (h2.is_pinching or h2.is_fist):
                global_state = InteractionState.SCALING
            elif h1.is_pinching or h2.is_pinching:
                global_state = InteractionState.MODELING
            else:
                global_state = InteractionState.TRACKING
        elif hands_count == 1:
            primary_hand = hands_list[0]
            global_state, _ = runtime.state_machine.update(
                primary_hand.gesture, primary_hand.landmarks, timestamp=time.time()
            )
            if primary_hand.is_pinching:
                global_state = InteractionState.MODELING
        else:
            global_state = runtime.state_machine.update(GestureType.NO_HAND, None, timestamp=time.time())[0]

        latency = (time.time() - t0) * 1000.0
        runtime.last_latency_ms = round(latency, 2)

        if raw_frame is not None:
            runtime.latest_annotated_jpeg = annotate_frame_3d(
                raw_frame, hands_list, global_state, runtime.fps, runtime.last_latency_ms
            )
        elif is_sim:
            blank = np.zeros((360, 480, 3), dtype=np.uint8)
            blank[:] = (20, 20, 30)
            runtime.latest_annotated_jpeg = annotate_frame_3d(
                blank, hands_list, global_state, runtime.fps, runtime.last_latency_ms
            )

        primary_cursor = hands_list[0].cursor if hands_list else None
        primary_gesture = hands_list[0].gesture if hands_list else GestureType.NO_HAND
        primary_lms = hands_list[0].landmarks if hands_list else None
        primary_hand_side = hands_list[0].handedness if hands_list else None
        primary_conf = hands_list[0].confidence if hands_list else 0.0

        event = GestureEvent(
            version="2.0.0",
            sequence=runtime.sequence,
            timestamp=time.time(),
            event_type="GESTURE_UPDATE",
            hands=hands_list,
            hands_count=hands_count,
            two_hand_distance=two_dist,
            two_hand_angle=two_angle,
            gesture=primary_gesture,
            interaction_state=global_state,
            confidence=round(primary_conf, 3),
            cursor=primary_cursor,
            handedness=primary_hand_side,
            raw_landmarks=primary_lms[:21] if primary_lms else None,
            fps=runtime.fps,
            latency_ms=runtime.last_latency_ms,
            is_simulation=is_sim,
            camera_opened=runtime.camera_manager.is_opened,
            details={
                "active_experience": "modeler"
            }
        )

        await broadcast_event(event)

        elapsed = time.time() - t0
        delay = max(0.005, (1.0 / 30.0) - elapsed)
        await asyncio.sleep(delay)

@app.on_event("startup")
async def startup_event():
    runtime.is_running = True
    started = runtime.camera_manager.start()
    if not started:
        runtime.is_simulation_mode = True
    runtime.worker_task = asyncio.create_task(vision_processing_loop())

@app.on_event("shutdown")
async def shutdown_event():
    runtime.is_running = False
    if runtime.worker_task:
        runtime.worker_task.cancel()
    runtime.camera_manager.stop()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    runtime.connected_clients.add(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if "type" in data:
                msg_type = data["type"]
                if msg_type == "SET_HOVER":
                    runtime.state_machine.set_hover(data.get("hovering", False))
                elif msg_type == "SET_MODE":
                    runtime.is_simulation_mode = data.get("simulation", False)
                    if runtime.is_simulation_mode:
                        runtime.camera_manager.stop()
                    else:
                        runtime.camera_manager.start()
                elif msg_type == "SET_CAMERA":
                    enabled = data.get("enabled", True)
                    if enabled:
                        runtime.is_simulation_mode = False
                        runtime.camera_manager.start()
                    else:
                        runtime.camera_manager.stop()
    except WebSocketDisconnect:
        runtime.connected_clients.discard(websocket)
    except Exception:
        runtime.connected_clients.discard(websocket)
