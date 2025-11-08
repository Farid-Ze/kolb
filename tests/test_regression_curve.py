from app.services.regression import predict_lfi, predicted_curve


def test_inverted_u_shape_basic():
    # Extreme assimilative (large negative), balance (~mean), extreme accommodative (large positive)
    low = predict_lfi(acc_assm=-50)
    mid = predict_lfi(acc_assm=0)  # near balance
    high = predict_lfi(acc_assm=50)
    # Expect mid > high and mid > low; curve peak near balance
    assert mid > low
    assert mid > high


def test_curve_contains_peak_near_zero():
    pts = predicted_curve(range(-30, 31))
    # Find max
    peak = max(pts, key=lambda d: d["pred_lfi"])['acc_assm']
    # Peak should be near 0 (balance); allow small tolerance
    assert abs(peak) <= 5
