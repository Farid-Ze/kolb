from app.assessments.klsi_v4.logic import STYLE_CUTS


def test_boundaries_acce_5_6():
    # ACCE=5 belongs to Low band → Imagining/Experiencing/Initiating depending on AERO
    assert STYLE_CUTS["Imagining"](5, 0)
    assert STYLE_CUTS["Experiencing"](5, 1)
    assert STYLE_CUTS["Experiencing"](5, 11)
    assert STYLE_CUTS["Initiating"](5, 12)
    # ACCE=6 switches to Mid band → Reflecting/Balancing/Acting depending on AERO
    assert STYLE_CUTS["Reflecting"](6, 0)
    assert STYLE_CUTS["Balancing"](6, 1)
    assert STYLE_CUTS["Acting"](6, 12)


def test_boundaries_acce_14_15():
    # ACCE=14 still Mid
    assert STYLE_CUTS["Reflecting"](14, 0)
    assert STYLE_CUTS["Balancing"](14, 11)
    assert STYLE_CUTS["Acting"](14, 12)
    # ACCE=15 switches to High
    assert STYLE_CUTS["Analyzing"](15, 0)
    assert STYLE_CUTS["Thinking"](15, 1)
    assert STYLE_CUTS["Deciding"](15, 12)


def test_boundaries_aero_0_1_11_12():
    # AERO<=0 low band
    assert STYLE_CUTS["Imagining"](0, 0)  # Boundary case: low ACCE, low AERO
    assert STYLE_CUTS["Reflecting"](6, 0)
    assert STYLE_CUTS["Analyzing"](15, 0)
    # AERO=1..11 mid band
    assert STYLE_CUTS["Experiencing"](0, 1)
    assert STYLE_CUTS["Balancing"](6, 11)
    assert STYLE_CUTS["Thinking"](15, 11)
    # AERO>=12 high band
    assert STYLE_CUTS["Initiating"](0, 12)
    assert STYLE_CUTS["Acting"](6, 12)
    assert STYLE_CUTS["Deciding"](15, 12)
