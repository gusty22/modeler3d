import os
import math
from typing import Optional, Tuple, List, Dict, Any
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from visioncontrol.backend.events.models import GestureType, NormalizedPoint, SingleHandData, CursorPosition
from visioncontrol.backend.gestures.geometric import GeometryClassifier


class HybridGestureEngine:
    """
    Motor híbrido de gestos com suporte a detecção e rastreamento de DUAS MÃOS simultâneas.
    Calcula distância de pinça (pinch) para cada mão e distância/rotação bimanual para modelagem 3D.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
            "models", "gesture_recognizer.task"
        )
        self.recognizer = None
        self._init_recognizer()

    def _init_recognizer(self):
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    model_buffer = f.read()
                base_options = python.BaseOptions(model_asset_buffer=model_buffer)
                options = vision.GestureRecognizerOptions(
                    base_options=base_options,
                    running_mode=vision.RunningMode.IMAGE,
                    num_hands=2,  # Rastrear 2 mãos simultaneamente
                    min_hand_detection_confidence=0.5,
                    min_hand_presence_confidence=0.5,
                    min_tracking_confidence=0.5
                )
                self.recognizer = vision.GestureRecognizer.create_from_options(options)
                print("[HybridGestureEngine] Suporte a 2 mãos ativo com sucesso!")
            except Exception as e:
                print(f"[HybridGestureEngine] Warning: Erro ao carregar GestureRecognizer: {e}.")
                self.recognizer = None
        else:
            print(f"[HybridGestureEngine] Warning: Modelo {self.model_path} não encontrado.")

    def process_multi_hand(self, mp_image, rgb_frame=None) -> List[SingleHandData]:
        """
        Processa a imagem e retorna uma lista com os dados detalhados de cada mão detectada (até 2 mãos).
        """
        hands_data: List[SingleHandData] = []
        if self.recognizer is None:
            return hands_data

        try:
            result = self.recognizer.recognize(mp_image)
            if not result.hand_landmarks:
                return hands_data

            num_detected = len(result.hand_landmarks)
            for i in range(num_detected):
                raw_lms = result.hand_landmarks[i]
                landmarks = [NormalizedPoint(x=lm.x, y=lm.y, z=lm.z) for lm in raw_lms]

                handedness = "Right"
                if result.handedness and i < len(result.handedness) and len(result.handedness[i]) > 0:
                    handedness = result.handedness[i][0].category_name

                # Gesto MediaPipe
                mp_gesture_name = "None"
                mp_conf = 0.0
                if result.gestures and i < len(result.gestures) and len(result.gestures[i]) > 0:
                    mp_gesture_name = result.gestures[i][0].category_name
                    mp_conf = result.gestures[i][0].score

                # Gesto Geométrico
                geo_gesture, geo_conf = GeometryClassifier.classify(landmarks, handedness)

                if mp_gesture_name == "Closed_Fist":
                    final_gesture = GestureType.CLOSED_FIST
                    final_conf = max(mp_conf, geo_conf)
                elif mp_gesture_name == "Open_Palm":
                    final_gesture = GestureType.OPEN_PALM
                    final_conf = max(mp_conf, geo_conf)
                elif mp_gesture_name in ["Pointing_Up", "Victory"]:
                    final_gesture = GestureType.MOVE
                    final_conf = mp_conf
                else:
                    final_gesture = geo_gesture
                    final_conf = geo_conf

                if geo_gesture == GestureType.CLOSED_FIST and geo_conf > 0.85:
                    final_gesture = GestureType.CLOSED_FIST

                # Centro de gravidade (MCP Médio 9 ou Ponta Indicador 8)
                ref_pt = landmarks[9]
                # Cursor normalizado com espelhamento horizontal para tela
                cur_x = max(0.0, min(1.0, 1.0 - ref_pt.x))
                cur_y = max(0.0, min(1.0, ref_pt.y))

                # Cálculo de Pinça (Pinch: Polegar nó 4 e Indicador nó 8)
                thumb_tip = landmarks[4]
                index_tip = landmarks[8]
                palm_size = GeometryClassifier.distance(landmarks[0], landmarks[9]) + 1e-6
                raw_pinch_dist = GeometryClassifier.distance(thumb_tip, index_tip)
                rel_pinch = raw_pinch_dist / palm_size

                is_pinching = rel_pinch < 0.28
                if is_pinching:
                    final_gesture = GestureType.PINCH

                is_fist = (final_gesture == GestureType.CLOSED_FIST)

                hand_obj = SingleHandData(
                    hand_id=f"hand_{i}_{handedness}",
                    handedness=handedness,
                    gesture=final_gesture,
                    confidence=float(final_conf),
                    cursor=CursorPosition(x=round(cur_x, 4), y=round(cur_y, 4)),
                    landmarks=landmarks,
                    pinch_distance=round(rel_pinch, 3),
                    is_pinching=is_pinching,
                    is_fist=is_fist
                )
                hands_data.append(hand_obj)

        except Exception as ex:
            print(f"[HybridGestureEngine] Erro na inferência multi-hand: {ex}")

        return hands_data
