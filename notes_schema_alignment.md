Backend `build_report` payload fields (source: `backend/app/services/report.py`):

```
{
  session_id: int,
  raw: {
    CE, RO, AC, AE,
    ACCE, AERO,
    ACC_ASSM, CONV_DIV,
    BALANCE: { ACCE, AERO }
  },
  percentiles: {
    CE, RO, AC, AE,
    ACCE, AERO,
    bands: {
      ACCE: LOW/MID/HIGH,
      AERO: LOW/MID/HIGH
    },
    BALANCE: {
      ACCE, AERO,
      levels: { ACCE: HIGH/MODERATE/LOW, AERO: HIGH/MODERATE/LOW },
      note,
      heuristic,
      kind,
      reference,
    },
    source_provenance,
    norm_group_used,
    per_scale_provenance,
    per_scale_sources: {
      CE, RO, AC, AE, ACCE, AERO
    },
    used_fallback_any,
    raw_outside_norm_range,
    truncated_scales,
  } | null,
  style: {
    primary_code,
    primary_name,
    primary_brief,
    primary_detail,
    backup_name,
    backup_code,
    backup_brief,
    backup_detail,
    intensity,
    educator_reco,
  } | null,
  lfi: {
    value,
    percentile,
    level,
    level_label,
  } | null,
  visualization: {
    kite,
    dialectic: { ACCE, AERO, CONV_DIV, intensity }
  } | null,
  session_designs: Recommendation[],
  analytics: {
    predicted_lfi_curve,
    acc_assm_peak_note,
    meta: { heuristic, note }
  },
  learning_space: {
    meta: { heuristic, note },
    suggestions: [...],
    development: {...},
    meta_learning: {...},
    educator_roles: [...],
  },
  enhanced_analytics,
  notes: {
    psychometric_terms,
    acc_assm_definition,
    conv_div_definition,
    balance_definition,
    interpretation_summary,
  }
}
```

Frontend `Report` type currently expects:

```
{
  report_id,
  session_id,
  user_id,
  instrument_id,
  generated_at,
  status,
  raw_scores,
  dialectic_scores,
  learning_style,
  nine_style,
  flexibility,
  norm_group,
  percentile_scores,
  reliability_flags,
  responsible_use_notice,
  enhanced_analytics,
  delta,
}
```

Gaps / mismatches:
- Backend lacks `report_id`, `user_id`, `instrument_id`, `generated_at`, `status`, `learning_style` (as separate object), `nine_style`, `flexibility`, `norm_group`, `dialectic_scores`, `responsible_use_notice`, `delta`, etc. Instead it supplies `style`, `lfi`, `visualization`, `session_designs`, `analytics`, `learning_space`, `notes`.
- `raw_scores` vs backend's `raw` (includes extra derived fields) and `dialectic_scores` vs backend `raw` nested fields.
- `percentile_scores` vs backend `percentiles` (richer object w/ provenance & heuristic flags).
- Missing representation for `notes`, `session_designs`, `learning_space`, `analytics`, `visualization` in frontend types.

Action items:
1. Decide on canonical report response shape – likely adopt backend record and add optional metadata fields if needed.
2. Update `frontend/src/types/api.d.ts` to match backend keys: e.g., rename `raw_scores` -> `raw`, `dialectic_scores` -> maybe restructure, add `style`, `lfi`, `visualization`, `analytics`, `learning_space`, `notes`, `session_designs` definitions.
3. Update UI components to read from new structure or adapt via mapper in `useReport`.
4. Confirm existence/absence of fields like `responsible_use_notice` (may come from spec? need to verify backend).
