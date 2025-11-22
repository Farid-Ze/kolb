import pytest
from app.services.assessments import detect_blindspots, detect_strengths

def test_detect_blindspots_basic():
    # CE=10, RO=20, AC=30, AE=40
    # Sorted: (CE, 10), (RO, 20), (AC, 30), (AE, 40)
    # Bottom 2: CE, RO
    kite = {"CE": 10.0, "RO": 20.0, "AC": 30.0, "AE": 40.0}
    blindspots = detect_blindspots(kite, limit=2)
    assert blindspots == ["CE", "RO"]

def test_detect_blindspots_tie():
    # CE=10, RO=10, AC=30, AE=40
    # Bottom 2: CE, RO (order might vary depending on sort stability, but values are same)
    kite = {"CE": 10.0, "RO": 10.0, "AC": 30.0, "AE": 40.0}
    blindspots = detect_blindspots(kite, limit=2)
    assert "CE" in blindspots
    assert "RO" in blindspots
    assert len(blindspots) == 2

def test_detect_strengths_basic():
    # CE=10, RO=20, AC=30, AE=40
    # Sorted Desc: (AE, 40), (AC, 30), (RO, 20), (CE, 10)
    # Top 2: AE, AC
    kite = {"CE": 10.0, "RO": 20.0, "AC": 30.0, "AE": 40.0}
    strengths = detect_strengths(kite, limit=2)
    assert strengths == ["AE", "AC"]

def test_detect_empty():
    assert detect_blindspots({}) == []
    assert detect_strengths(None) == []

def test_detect_limit_1():
    kite = {"CE": 10.0, "RO": 20.0, "AC": 30.0, "AE": 40.0}
    blindspots = detect_blindspots(kite, limit=1)
    assert blindspots == ["CE"]
