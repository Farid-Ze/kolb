from app.assessments.klsi_v4.logic import STYLE_CUTS
from app.services.scoring import compute_kendalls_w


def test_kendalls_w_extremes():
    # identical ranks across contexts -> W=1
    ctxs_same = [{"CE":1,"RO":2,"AC":3,"AE":4} for _ in range(8)]
    w_same = compute_kendalls_w(ctxs_same)
    assert abs(w_same - 1.0) < 1e-9

    # perfectly counterbalanced ranks across contexts -> W near 0
    ctxs_var = []
    rorders = [
        {"CE":1,"RO":2,"AC":3,"AE":4},
        {"CE":2,"RO":3,"AC":4,"AE":1},
        {"CE":3,"RO":4,"AC":1,"AE":2},
        {"CE":4,"RO":1,"AC":2,"AE":3},
        {"CE":1,"RO":3,"AC":2,"AE":4},
        {"CE":2,"RO":4,"AC":3,"AE":1},
        {"CE":3,"RO":1,"AC":4,"AE":2},
        {"CE":4,"RO":2,"AC":1,"AE":3},
    ]
    ctxs_var.extend(rorders)
    w_var = compute_kendalls_w(ctxs_var)
    assert w_var <= 0.1


def test_style_cuts_boundaries():
    # Check a few boundary conditions
    # Imagining: ACCE<=5 and AERO<=0
    assert STYLE_CUTS["Imagining"](5, 0)
    # Experiencing: ACCE<=5 and 1<=AERO<=11
    assert STYLE_CUTS["Experiencing"](5, 1)
    assert STYLE_CUTS["Experiencing"](5, 11)
    # Initiating: ACCE<=5 and AERO>=12
    assert STYLE_CUTS["Initiating"](5, 12)
    # Reflecting: 6<=ACCE<=14 and AERO<=0
    assert STYLE_CUTS["Reflecting"](6, 0)
    assert STYLE_CUTS["Reflecting"](14, -5)
    # Balancing: 6<=ACCE<=14 and 1<=AERO<=11
    assert STYLE_CUTS["Balancing"](6, 1)
    assert STYLE_CUTS["Balancing"](14, 11)
    # Acting: 6<=ACCE<=14 and AERO>=12
    assert STYLE_CUTS["Acting"](10, 12)
    # Analyzing: ACCE>=15 and AERO<=0
    assert STYLE_CUTS["Analyzing"](15, 0)
    # Thinking: ACCE>=15 and 1<=AERO<=11
    assert STYLE_CUTS["Thinking"](15, 11)
    # Deciding: ACCE>=15 and AERO>=12
    assert STYLE_CUTS["Deciding"](15, 12)
