import pytest
from visioncontrol.backend.events.models import NormalizedPoint
from visioncontrol.backend.gestures.translator_engine import GestureTranslatorEngine
from visioncontrol.backend.tests.test_gesture_engine import create_synthetic_hand

def test_translator_engine_open_palm():
    lms = create_synthetic_hand("OPEN_PALM")
    gesture, conf = GestureTranslatorEngine.classify_custom_gesture(lms)
    assert gesture == "OPEN_PALM"
    assert conf >= 0.9

def test_translator_engine_closed_fist():
    lms = create_synthetic_hand("CLOSED_FIST")
    gesture, conf = GestureTranslatorEngine.classify_custom_gesture(lms)
    assert gesture == "CLOSED_FIST"
    assert conf >= 0.9
