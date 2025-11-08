"""Normative percentile fallback dictionaries extracted from KLSI 4.0 Appendices.

Source: Appendix 1 (Raw→Cumulative Percent for CE, RO, AC, AE; ACCE = AC-CE; AERO = AE-RO)
        Appendix 7 (Learning Flexibility Index percentiles)

These mappings provide cumulative percent (treated as percentile) for each raw score
as published. They are used only as a fallback when the database normative tables
have not been imported. If a DB row exists, DB values take precedence.

NOTE:
 - Values are transcribed exactly from the excerpt supplied; if a source row
   appeared multiple times (duplicate valid percent rows), the last cumulative
   percentage is retained.
 - Ranges not present in the excerpt remain absent; lookup code should handle
   missing keys gracefully (e.g., nearest-lower or None).
 - ACCE/AERO distributions are difference scores; negative values allowed.
 - LFI values are decimal fractions (0.xx to 1.00); we store them in their
   original float form; nearest match will be used during lookup.
"""

# Primary mode raw score → cumulative percentile (Appendix 1)
# Concrete Experience (CE) raw 11–44
CE_PERCENTILES = {
    11: 1.9, 12: 7.4, 13: 14.8, 14: 22.5, 15: 30.4, 16: 38.3, 17: 45.1,
    18: 51.3, 19: 57.2, 20: 62.2, 21: 66.7, 22: 70.9, 23: 74.7, 24: 78.3,
    25: 81.2, 26: 83.9, 27: 86.3, 28: 88.5, 29: 90.6, 30: 92.2, 31: 93.6,
    32: 94.8, 33: 95.7, 34: 96.6, 35: 97.3, 36: 97.9, 37: 98.4, 38: 98.9,
    39: 99.3, 40: 99.5, 41: 99.7, 42: 99.9, 43: 99.9, 44: 100.0
}

# Reflective Observation (RO)
RO_PERCENTILES = {
    11: 0.4, 12: 1.3, 13: 2.6, 14: 3.9, 15: 5.7, 16: 8.3, 17: 11.3,
    18: 14.8, 19: 18.9, 20: 22.9, 21: 27.5, 22: 32.3, 23: 37.2, 24: 42.3,
    25: 47.4, 26: 52.5, 27: 57.9, 28: 62.8, 29: 67.5, 30: 71.8, 31: 76.3,
    32: 80.1, 33: 83.4, 34: 86.2, 35: 89.2, 36: 91.7, 37: 93.7, 38: 95.3,
    39: 96.8, 40: 97.9, 41: 98.7, 42: 99.3, 43: 99.7, 44: 100.0
}

# Abstract Conceptualization (AC)
AC_PERCENTILES = {
    11: 0.0, 12: 0.1, 13: 0.4, 14: 0.7, 15: 1.4, 16: 2.1, 17: 3.6,
    18: 5.2, 19: 7.6, 20: 10.3, 21: 13.7, 22: 17.5, 23: 22.3, 24: 27.1,
    25: 32.5, 26: 37.7, 27: 42.9, 28: 48.6, 29: 54.0, 30: 59.4, 31: 64.9,
    32: 69.7, 33: 73.8, 34: 78.0, 35: 81.4, 36: 84.5, 37: 87.9, 38: 90.6,
    39: 92.9, 40: 95.2, 41: 96.9, 42: 98.3, 43: 99.4, 44: 100.0
}

# Active Experimentation (AE)
AE_PERCENTILES = {
    11: 0.0, 12: 0.1, 13: 0.2, 14: 0.4, 15: 0.6, 16: 0.9, 17: 1.4,
    18: 1.9, 19: 2.8, 20: 4.0, 21: 5.5, 22: 7.4, 23: 9.7, 24: 12.2,
    25: 15.5, 26: 19.4, 27: 23.4, 28: 27.6, 29: 32.5, 30: 38.2, 31: 43.8,
    32: 50.0, 33: 56.3, 34: 62.8, 35: 70.0, 36: 76.3, 37: 82.0, 38: 87.2,
    39: 91.7, 40: 95.0, 41: 97.5, 42: 99.0, 43: 99.7, 44: 100.0
}

# ACCE difference distribution (AC - CE); negative to positive (excerpt)
ACCE_PERCENTILES = {
    -29: 0.0, -28: 0.0, -27: 0.1, -26: 0.1, -25: 0.2, -24: 0.3, -23: 0.4,
    -22: 0.6, -21: 0.8, -20: 1.0, -19: 1.2, -18: 1.5, -17: 1.9, -16: 2.3,
    -15: 2.9, -14: 3.5, -13: 4.1, -12: 4.8, -11: 5.4, -10: 6.3, -9: 7.1,
    -8: 8.1, -7: 9.2, -6: 10.4, -5: 11.9, -4: 13.2, -3: 14.7, -2: 16.5,
    -1: 18.4, 0: 20.5, 1: 22.8, 2: 25.0, 3: 27.3, 4: 30.1, 5: 33.3,
    6: 36.5, 7: 40.1, 8: 43.6, 9: 47.4, 10: 51.3, 11: 54.9, 12: 58.7,
    13: 62.4, 14: 66.0, 15: 69.3, 16: 72.9, 17: 76.4, 18: 79.6, 19: 82.5,
    20: 85.3, 21: 87.9, 22: 90.2, 23: 92.2, 24: 93.9, 25: 95.4, 26: 96.8,
    27: 97.8, 28: 98.6, 29: 99.2, 30: 99.6, 31: 99.8, 32: 100.0, 33: 100.0
}

# AERO difference distribution (AE - RO)
AERO_PERCENTILES = {
    -33: 0.0, -31: 0.0, -30: 0.0, -29: 0.1, -28: 0.1, -27: 0.1, -26: 0.2,
    -25: 0.2, -24: 0.3, -23: 0.4, -22: 0.6, -21: 0.8, -20: 1.2, -19: 1.5,
    -18: 2.0, -17: 2.7, -16: 3.4, -15: 4.3, -14: 5.2, -13: 6.3, -12: 7.4,
    -11: 8.7, -10: 10.0, -9: 11.7, -8: 13.4, -7: 14.9, -6: 16.9, -5: 19.1,
    -4: 21.4, -3: 23.7, -2: 26.2, -1: 28.8, 0: 31.6, 1: 34.6, 2: 37.7,
    3: 40.5, 4: 43.7, 5: 47.0, 6: 50.2, 7: 53.3, 8: 56.8, 9: 60.0, 10: 63.7,
    11: 67.0, 12: 70.3, 13: 73.6, 14: 76.8, 15: 79.8, 16: 82.8, 17: 85.7,
    18: 88.0, 19: 90.2, 20: 92.2, 21: 94.0, 22: 95.6, 23: 96.8, 24: 97.7,
    25: 98.5, 26: 99.0, 27: 99.5, 28: 99.8, 29: 99.9, 30: 99.9, 31: 100.0,
    32: 100.0, 33: 100.0
}

# Learning Flexibility Index (LFI) percentiles (Appendix 7)
# Values are the LFI score (0.xx). We store cumulative percent as percentile.
LFI_PERCENTILES = {
    0.07: 0.0, 0.09: 0.0, 0.10: 0.0, 0.12: 0.0, 0.13: 0.1, 0.14: 0.1,
    0.16: 0.1, 0.17: 0.1, 0.18: 0.2, 0.19: 0.3, 0.20: 0.3, 0.21: 0.4,
    0.22: 0.4, 0.23: 0.5, 0.24: 0.6, 0.26: 0.7, 0.27: 0.9, 0.28: 1.1,
    0.29: 1.2, 0.30: 1.2, 0.31: 1.5, 0.32: 1.8, 0.33: 2.0, 0.34: 2.4,
    0.35: 2.5, 0.36: 3.2, 0.37: 3.3, 0.38: 3.9, 0.39: 4.7, 0.40: 4.7,
    0.41: 4.8, 0.42: 5.4, 0.43: 6.4, 0.44: 7.2, 0.45: 7.3, 0.46: 8.2,
    0.47: 9.0, 0.48: 9.9, 0.49: 11.2, 0.50: 11.3, 0.51: 12.1, 0.52: 12.8,
    0.53: 14.4, 0.54: 16.4, 0.55: 16.7, 0.56: 17.6, 0.57: 18.7, 0.58: 21.0,
    0.59: 22.1, 0.60: 22.2, 0.61: 24.1, 0.62: 25.8, 0.63: 27.3, 0.64: 29.9,
    0.66: 32.7, 0.67: 34.0, 0.68: 35.4, 0.69: 36.7, 0.70: 39.4, 0.71: 41.4,
    0.72: 44.0, 0.73: 47.3, 0.74: 49.4, 0.75: 50.0, 0.76: 51.8, 0.77: 54.7,
    0.78: 57.0, 0.79: 60.8, 0.80: 60.9, 0.81: 63.8, 0.82: 64.6, 0.83: 69.3,
    0.84: 72.8, 0.85: 73.0, 0.86: 75.4, 0.87: 77.2, 0.88: 80.6, 0.89: 83.4,
    0.90: 83.9, 0.91: 86.0, 0.92: 88.9, 0.93: 90.8, 0.94: 93.3, 0.95: 93.6,
    0.96: 96.3, 0.97: 97.5, 0.98: 99.1, 0.99: 100.0, 1.00: 100.0
}

def lookup_percentile(raw: int, table: dict[int, float]) -> float | None:
    """Return percentile for raw; if exact not found choose nearest raw BELOW; if none below, nearest ABOVE.
    This conservative approach avoids over-estimating rarity.
    """
    if raw in table:
        return table[raw]
    lower = [r for r in table.keys() if r < raw]
    if lower:
        return table[max(lower)]
    higher = [r for r in table.keys() if r > raw]
    if higher:
        return table[min(higher)]
    return None

def lookup_lfi(value: float) -> float | None:
    """Nearest match for LFI percentile (value between 0 and 1)."""
    if value in LFI_PERCENTILES:
        return LFI_PERCENTILES[value]
    # find closest absolute difference
    sorted_vals = sorted(LFI_PERCENTILES.keys())
    closest = min(sorted_vals, key=lambda v: abs(v - value))
    return LFI_PERCENTILES.get(closest)
