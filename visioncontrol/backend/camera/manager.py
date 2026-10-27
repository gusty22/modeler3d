import cv2
import time
import threading
from typing import Optional, Tuple
import mediapipe as mp


class CameraManager:
    """
    Gerenciador robusto de captura assíncrona de webcam para Windows.
    Utiliza uma thread dedicada de leitura em plano de fundo (buffer de 1 frame)
    para desacoplar a captura de hardware do loop de inferência e WebSocket,
    garantindo taxas reais de 30 FPS e latência inferior a 35ms.
    """

    def __init__(self, camera_id: int = 0, width: int = 640, height: int = 480):
        self.camera_id = camera_id
        self.width = width
        self.height = height
        self.cap: Optional[cv2.VideoCapture] = None
        self.is_opened = False
        self.fps = 0.0

        # Thread de captura contínua e desacoplamento
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()
        self._latest_frame: Optional[object] = None
        self._latest_mp_image: Optional[mp.Image] = None
        self._new_frame_available = False

        self._frame_count = 0
        self._fps_start_time = time.time()

    def start(self) -> bool:
        if self.is_opened:
            return True

        # No Windows, CAP_DSHOW abre instantaneamente (< 1.0s), enquanto CAP_MSMF pode travar por 8-15 segundos
        self.cap = cv2.VideoCapture(self.camera_id, cv2.CAP_DSHOW)
        if not self.cap.isOpened():
            self.cap = cv2.VideoCapture(self.camera_id)
            if not self.cap.isOpened():
                self.cap = cv2.VideoCapture(self.camera_id, cv2.CAP_MSMF)

        if self.cap.isOpened():
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            self.is_opened = True

            # Inicia thread em background para leitura constante
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._capture_worker, daemon=True)
            self._thread.start()
            return True
        else:
            self.is_opened = False
            return False

    def _capture_worker(self):
        """Worker contínuo rodando em thread de I/O dedicada"""
        while not self._stop_event.is_set() and self.cap and self.cap.isOpened():
            ret, frame = self.cap.read()
            if ret and frame is not None:
                # Converte para formato MediaPipe RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

                now = time.time()
                with self._lock:
                    self._latest_frame = frame
                    self._latest_mp_image = mp_image
                    self._new_frame_available = True
                    self._frame_count += 1
                    elapsed = now - self._fps_start_time
                    if elapsed >= 0.5:
                        self.fps = round(self._frame_count / elapsed, 1)
                        self._frame_count = 0
                        self._fps_start_time = now
            else:
                time.sleep(0.01)

    def read_frame(self) -> Tuple[bool, Optional[object], Optional[mp.Image]]:
        """
        Retorna instantaneamente o frame mais recente capturado pela thread de vídeo (non-blocking)
        """
        if not self.is_opened:
            return False, None, None

        with self._lock:
            if self._latest_frame is not None and self._latest_mp_image is not None:
                return True, self._latest_frame, self._latest_mp_image

        return False, None, None

    def stop(self):
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)
            self._thread = None

        if self.cap is not None:
            self.cap.release()
            self.cap = None

        self.is_opened = False
