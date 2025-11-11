# KLSI as Engine Definition (Illustrative)

This example shows how KLSI 4.0 could be expressed as data for a generic assessment engine.

```json
{
  "instrument": {
    "code": "KLSI",
    "version": "4.0",
    "title": "Kolb Learning Style Inventory 4.0",
    "locale_default": "EN"
  },
  "form": {
    "pages": [
      { "code": "STYLE_1_6", "items": ["LSI_01","LSI_02","LSI_03","LSI_04","LSI_05","LSI_06"] },
      { "code": "STYLE_7_12", "items": ["LSI_07","LSI_08","LSI_09","LSI_10","LSI_11","LSI_12"] },
      { "code": "LFI_CONTEXTS", "items": ["CTX_01","CTX_02","CTX_03","CTX_04","CTX_05","CTX_06","CTX_07","CTX_08"] }
    ]
  },
  "items": [
    {
      "id": "LSI_01",
      "type": "ipsative",
      "stem": "When I learn...",
      "ipsative_group": {
        "modes": ["CE","RO","AC","AE"],
        "options": [
          {"id": "LSI_01_CE", "label": "...", "mode": "CE"},
          {"id": "LSI_01_RO", "label": "...", "mode": "RO"},
          {"id": "LSI_01_AC", "label": "...", "mode": "AC"},
          {"id": "LSI_01_AE", "label": "...", "mode": "AE"}
        ],
        "ranks_required": [1,2,3,4]
      }
    }
  ],
  "scales": [
    {"name": "CE_raw", "rule": {"sum_ranks": {"mode": "CE"}}},
    {"name": "RO_raw", "rule": {"sum_ranks": {"mode": "RO"}}},
    {"name": "AC_raw", "rule": {"sum_ranks": {"mode": "AC"}}},
    {"name": "AE_raw", "rule": {"sum_ranks": {"mode": "AE"}}},
    {"name": "ACCE", "rule": {"diff": ["AC_raw","CE_raw"]}},
    {"name": "AERO", "rule": {"diff": ["AE_raw","RO_raw"]}},
    {"name": "BALANCE_ACCE", "rule": {"abs_diff_const": ["ACCE", 9]}},
    {"name": "BALANCE_AERO", "rule": {"abs_diff_const": ["AERO", 6]}}
  ],
  "classifiers": [
    {
      "name": "primary_style",
      "type": "grid_window",
      "axes": ["ACCE","AERO"],
      "windows": [
        {"name": "Imagining", "ACCE": {"max": 5}, "AERO": {"max": 0}},
        {"name": "Experiencing", "ACCE": {"max": 5}, "AERO": {"min": 1, "max": 11}},
        {"name": "Initiating", "ACCE": {"max": 5}, "AERO": {"min": 12}},
        {"name": "Reflecting", "ACCE": {"min": 6, "max": 14}, "AERO": {"max": 0}},
        {"name": "Balancing", "ACCE": {"min": 6, "max": 14}, "AERO": {"min": 1, "max": 11}},
        {"name": "Acting", "ACCE": {"min": 6, "max": 14}, "AERO": {"min": 12}},
        {"name": "Analyzing", "ACCE": {"min": 15}, "AERO": {"max": 0}},
        {"name": "Thinking", "ACCE": {"min": 15}, "AERO": {"min": 1, "max": 11}},
        {"name": "Deciding", "ACCE": {"min": 15}, "AERO": {"min": 12}}
      ],
      "backup": {"method": "l1_distance_to_windows"}
    }
  ],
  "lfi": {
    "contexts": 8,
    "modes": ["CE","RO","AC","AE"],
    "stat": "kendalls_w",
    "transform": {"lfi": {"one_minus": "W"}}
  }
}
```
