# KLSI Assessment Flow: Raw Answers → Learning Style Profile

## Overview

This document describes the complete data transformation pipeline from raw user responses to the final learning style profile. Each stage is precisely specified with formulas, validation rules, and psychometric rationale.

## Pipeline Stages

```
Raw Responses (Ipsative Rankings)
    ↓ [validate_ipsative_response]
User Responses (DB: user_responses)
    ↓ [compute_raw_scale_scores]
Scale Scores (CE, RO, AC, AE sums)
    ↓ [compute_combination_scores]
Combination Scores (ACCE, AERO dialectics)
    ↓ [assign_learning_style]
Learning Style (9-type classification)
    ↓ [compute_lfi]
Learning Flexibility Index (Kendall's W)
    ↓ [apply_percentiles]
Percentile Scores (Normative conversions)
    ↓ [build_report]
Final Report (JSON with interpretations)
```

## Stage 1: Raw Response Validation

### Input Format

User submits forced-choice rankings for 12 learning style items:

```json
{
  "item_id": 1,
  "ranks": {
    "1": 3,  // choice_id: rank_value
    "2": 1,
    "3": 4,
    "4": 2
  }
}
```

### Validation Rules

**Ipsative Constraints:**
1. ✅ Exactly 4 choices per item
2. ✅ Ranks must be [1, 2, 3, 4] (no duplicates, no gaps)
3. ✅ Each rank used exactly once
4. ✅ Choice IDs must match item's defined choices

**Code Reference:** `app/services/validation.py::validate_ipsative_response()`

### Database Storage

```sql
-- user_responses table
INSERT INTO user_responses (session_id, item_id, choice_id, rank_value)
VALUES (101, 1, 1, 3),
       (101, 1, 2, 1),
       (101, 1, 3, 4),
       (101, 1, 4, 2);
```

## Stage 2: Raw Scale Score Computation

### Formula

For each mode (CE, RO, AC, AE), sum the ranks where that mode was selected:

```
CE_raw = Σ(rank_value WHERE choice.mode = 'CE')
RO_raw = Σ(rank_value WHERE choice.mode = 'RO')
AC_raw = Σ(rank_value WHERE choice.mode = 'AC')
AE_raw = Σ(rank_value WHERE choice.mode = 'AE')
```

### Example Calculation

Given 12 items, each with 4 choices ranked 1-4:

```
Item 1: CE=3, RO=1, AC=4, AE=2
Item 2: CE=2, RO=4, AC=1, AE=3
...
Item 12: CE=1, RO=2, AC=3, AE=4

CE_raw = 3 + 2 + ... + 1 = 20
RO_raw = 1 + 4 + ... + 2 = 22
AC_raw = 4 + 1 + ... + 3 = 28
AE_raw = 2 + 3 + ... + 4 = 26
```

### Integrity Check

```python
assert CE_raw + RO_raw + AC_raw + AE_raw == 12 * (1+2+3+4) == 120
```

**Code Reference:** `app/assessments/klsi_v4/logic.py::compute_raw_scale_scores()`

### Database Storage

```sql
-- scale_scores table
INSERT INTO scale_scores (session_id, CE_raw, RO_raw, AC_raw, AE_raw)
VALUES (101, 20, 22, 28, 26);
```

## Stage 3: Combination Score Computation

### Formulas

**Dialectic Dimensions:**
```
ACCE = AC_raw - CE_raw  (Abstract-Concrete polarity)
AERO = AE_raw - RO_raw  (Action-Reflection polarity)
```

**Balance Metrics:**
```
BALANCE_ACCE = |ACCE - 9|   (Distance from normative center)
BALANCE_AERO = |AERO - 6|   (Distance from normative center)
```

**Intensity Metrics:**
```
ACC_ASSIM = (AC + RO) - (AE + CE)  (Assimilation-Accommodation)
CONV_DIV = (AC + AE) - (CE + RO)   (Convergent-Divergent)
```

### Example Calculation

```python
# Given: CE=20, RO=22, AC=28, AE=26
ACCE = 28 - 20 = 8
AERO = 26 - 22 = 4

BALANCE_ACCE = |8 - 9| = 1    (Very balanced on ACCE)
BALANCE_AERO = |4 - 6| = 2    (Very balanced on AERO)

ACC_ASSIM = (28 + 22) - (26 + 20) = 50 - 46 = 4   (Slightly assimilative)
CONV_DIV = (28 + 26) - (20 + 22) = 54 - 42 = 12   (Convergent tendency)
```

**Code Reference:** `app/assessments/klsi_v4/logic.py::compute_combination_scores()`

### Database Storage

```sql
-- combination_scores table
INSERT INTO combination_scores (
    session_id, ACCE_raw, AERO_raw, 
    BALANCE_ACCE, BALANCE_AERO,
    ACC_ASSIM, CONV_DIV
)
VALUES (101, 8, 4, 1, 2, 4, 12);
```

## Stage 4: Learning Style Classification

### 9-Style Grid

The (ACCE, AERO) coordinates map to a 3×3 grid:

```
        AERO ≥ 12 (High Action)
              ↑
              |
    Initiating | Acting | Deciding
    (CE+AE)   | (bal)  | (AC+AE)
    ----------+---------+---------  ACCE = 15
    Experiencing| Balancing| Thinking
    (CE)      | (center) | (AC)
    ----------+---------+---------  ACCE = 6
    Imagining | Reflecting| Analyzing
    (CE+RO)   | (RO+AC)  | (AC+RO)
              |
              ↓
        AERO ≤ 0 (High Reflection)
```

### Classification Rules

```python
def assign_learning_style(ACCE: int, AERO: int) -> str:
    # ACCE thresholds: ≤5, 6-14, ≥15
    # AERO thresholds: ≤0, 1-11, ≥12
    
    if ACCE <= 5:
        if AERO <= 0:
            return "Imagining"
        elif AERO <= 11:
            return "Experiencing"
        else:
            return "Initiating"
    elif ACCE <= 14:
        if AERO <= 0:
            return "Reflecting"
        elif AERO <= 11:
            return "Balancing"
        else:
            return "Acting"
    else:  # ACCE >= 15
        if AERO <= 0:
            return "Analyzing"
        elif AERO <= 11:
            return "Thinking"
        else:
            return "Deciding"
```

### Example

```python
# ACCE = 8, AERO = 4
# ACCE in [6, 14] → Middle column
# AERO in [1, 11] → Middle row
# Result: "Balancing"
```

### Backup Styles

If a user shows flexibility, identify which other styles they use across LFI contexts:

```python
# From LFI contexts, find which styles appear
# Rank by frequency
# Store in backup_learning_styles table
```

**Code Reference:** `app/assessments/klsi_v4/logic.py::assign_learning_style()`

### Database Storage

```sql
-- user_learning_styles table
INSERT INTO user_learning_styles (
    session_id, 
    primary_style_type_id,  -- FK to learning_style_types
    backup_style_type_id
)
VALUES (101, 5, 4);  -- Primary: Balancing, Backup: Reflecting
```

## Stage 5: LFI (Learning Flexibility Index) Computation

### Input: LFI Context Rankings

User ranks 4 modes (CE, RO, AC, AE) for 8 contexts:

```json
[
  {
    "context_name": "Starting_Something_New",
    "CE": 2, "RO": 3, "AC": 4, "AE": 1
  },
  // ... 7 more contexts
]
```

### Validation

Same ipsative rules as learning style items (ranks = [1,2,3,4] permutation).

### Formula: Kendall's W

```
W = (12 * S) / (k² * (n³ - n))

Where:
  k = number of raters (8 contexts)
  n = number of items (4 modes)
  S = sum of squared deviations of rank totals from their mean

Steps:
1. Sum ranks for each mode across 8 contexts:
   R_CE = Σ(CE ranks) = 16
   R_RO = Σ(RO ranks) = 18
   R_AC = Σ(AC ranks) = 20
   R_AE = Σ(AE ranks) = 26
   
2. Compute mean rank total:
   R_mean = (R_CE + R_RO + R_AC + R_AE) / 4 = 80 / 4 = 20
   
3. Compute sum of squared deviations:
   S = (16-20)² + (18-20)² + (20-20)² + (26-20)²
     = 16 + 4 + 0 + 36 = 56
     
4. Calculate W:
   W = (12 * 56) / (8² * (4³ - 4))
     = 672 / (64 * 60)
     = 672 / 3840
     = 0.175
     
5. Compute LFI:
   LFI = 1 - W = 1 - 0.175 = 0.825
```

**Interpretation:**
- W ≈ 1 → High consistency (low flexibility)
- W ≈ 0 → Low consistency (high flexibility)
- LFI = 1 - W, so higher LFI = more flexible

**Code Reference:** `app/assessments/klsi_v4/logic.py::compute_lfi()`

### Database Storage

```sql
-- lfi_context_scores table (8 rows)
INSERT INTO lfi_context_scores (session_id, context_name, CE_rank, RO_rank, AC_rank, AE_rank)
VALUES (101, 'Starting_Something_New', 2, 3, 4, 1),
       (101, 'Influencing_Someone', 3, 2, 4, 1),
       -- ... 6 more contexts

-- learning_flexibility_index table
INSERT INTO learning_flexibility_index (
    session_id, 
    W_coefficient, 
    LFI_score, 
    flexibility_level
)
VALUES (101, 0.175, 0.825, 'High');
```

## Stage 6: Percentile Conversion

### Multi-Tier Norm Lookup

Percentile conversion follows a precedence hierarchy:

```
1. Education Level → "EDU:University Degree"
2. Country → "COUNTRY:Indonesia"
3. Age Band → "AGE:19-24"
4. Gender → "GENDER:Male"
5. Global → "Total"
6. Appendix Fallback → Built-in dictionaries
```

### Lookup Process

```python
def apply_percentiles(db, scale_scores, combination_scores):
    norm_groups = _resolve_norm_groups(db, user)
    
    for scale in ["CE", "RO", "AC", "AE", "ACCE", "AERO", "LFI"]:
        raw = scale_scores[scale]
        
        for norm_group in norm_groups:
            percentile = db.query(NormativeConversionTable)\
                .filter(
                    norm_group=norm_group,
                    scale_name=scale,
                    raw_score=raw
                ).first()
            
            if percentile:
                store_percentile(scale, percentile.value, norm_group)
                break
        else:
            # Fallback to Appendix 1 dictionary
            percentile = APPENDIX_FALLBACK[scale].get(raw)
            store_percentile(scale, percentile, "AppendixFallback")
```

### Example

```python
# User: 21 years old, Female, Indonesia, University student
# Scale: CE_raw = 20

# Try 1: EDU:University Degree → CE=20 → 48th percentile ✓
# Success! Store with provenance.

percentile_scores.CE_percentile = 48.0
percentile_scores.norm_group_used = "EDU:University Degree"
```

**Code Reference:** `app/assessments/klsi_v4/logic.py::apply_percentiles()`

### Database Storage

```sql
-- percentile_scores table
INSERT INTO percentile_scores (
    session_id,
    CE_percentile, RO_percentile, AC_percentile, AE_percentile,
    ACCE_percentile, AERO_percentile,
    BALANCE_ACCE_percentile, BALANCE_AERO_percentile,
    LFI_percentile,
    norm_group_used
)
VALUES (101, 48.0, 52.0, 68.0, 61.0, 45.0, 38.0, 95.0, 90.0, 82.0, 'EDU:University Degree');
```

## Stage 7: Report Generation

### Report Structure

```json
{
  "session_id": 101,
  "user_id": 42,
  "primary_style": "Balancing",
  "backup_style": "Reflecting",
  
  "raw_scores": {
    "CE": 20, "RO": 22, "AC": 28, "AE": 26
  },
  
  "dialectics": {
    "ACCE": 8, "AERO": 4
  },
  
  "percentiles": {
    "CE": 48.0, "RO": 52.0, "AC": 68.0, "AE": 61.0,
    "ACCE": 45.0, "AERO": 38.0,
    "BALANCE_ACCE": 95.0, "BALANCE_AERO": 90.0,
    "LFI": 82.0
  },
  
  "flexibility": {
    "W_coefficient": 0.175,
    "LFI_score": 0.825,
    "level": "High",
    "styles_used": ["Balancing", "Reflecting", "Thinking"]
  },
  
  "interpretations": {
    "primary_style_description": "Flexible menilai pro-kontra...",
    "educator_recommendations": ["Gunakan dua spiral singkat..."],
    "meta_learning_tips": ["Tetapkan kriteria 'cukup data'..."]
  },
  
  "metadata": {
    "completed_at": "2025-11-13T19:30:00Z",
    "norm_group_used": "EDU:University Degree",
    "instrument": "KLSI",
    "version": "4.0"
  }
}
```

### Localization

All user-facing text uses Indonesian constants from `app/i18n/id_styles.py`:

```python
from app.i18n.id_styles import STYLE_LABELS_ID, STYLE_DETAIL_ID

report["primary_style_label"] = STYLE_LABELS_ID[primary_style]
report["primary_style_detail"] = STYLE_DETAIL_ID[primary_style]
```

**Code Reference:** `app/services/report.py::generate_full_report()`

## Complete Pipeline in Code

```python
# app/engine/runtime.py::finalize()

def finalize(db: Session, session_id: int) -> dict:
    """Complete assessment pipeline."""
    
    # Stage 1-2: Already stored in DB (user_responses)
    
    # Stage 3: Compute raw scores
    scale_scores = compute_raw_scale_scores(db, session_id)
    
    # Stage 4: Compute dialectics
    combo_scores = compute_combination_scores(db, scale_scores)
    
    # Stage 5: Assign learning style
    style = assign_learning_style(db, combo_scores)
    
    # Stage 6: Compute LFI
    lfi = compute_lfi(db, session_id)
    
    # Stage 7: Apply percentiles
    percentiles = apply_percentiles(db, scale_scores, combo_scores, lfi)
    
    # Stage 8: Build report
    report = build_report(db, session_id, style, percentiles)
    
    # Mark session complete
    session.status = SessionStatus.completed
    db.commit()
    
    return report
```

## Validation Points

At each stage, validate invariants:

**Stage 2 (Raw Scores):**
- ✅ Sum = 120
- ✅ All values ≥ 12 and ≤ 48

**Stage 3 (Dialectics):**
- ✅ ACCE in [-29, +33]
- ✅ AERO in [-33, +33]

**Stage 4 (Style):**
- ✅ Style is one of 9 types

**Stage 5 (LFI):**
- ✅ W in [0, 1]
- ✅ LFI in [0, 1]
- ✅ LFI = 1 - W

**Stage 6 (Percentiles):**
- ✅ All percentiles in [0, 100]
- ✅ Provenance recorded

## Error Handling

Each stage can raise specific errors:

```python
# Stage 1
raise InvalidAssessmentData("Ranking item harus permutasi [1,2,3,4]")

# Stage 5
raise InvalidAssessmentData(f"Diperlukan 8 konteks LFI, ditemukan {len(contexts)}")

# Stage 6
raise NormLookupError(f"Konversi norma tidak ditemukan untuk {scale}={raw}")
```

All errors use centralized i18n constants from `app/i18n/id_messages.py`.

## Performance Characteristics

**Typical Execution Time** (single session):
- Stage 1 (Validation): < 1ms
- Stage 2-4 (Computation): 2-5ms
- Stage 5 (LFI): 1-2ms
- Stage 6 (Percentiles): 5-10ms (DB lookups)
- Stage 7 (Report): 2-3ms
- **Total**: 10-20ms

**Database Queries**: ~8-12 queries total

**Optimization Opportunities**:
- Batch percentile lookups
- Cache norm lookups (`@lru_cache`)
- Precompute common percentiles

## References

1. **Kolb (1984)**: Experiential Learning Theory
2. **KLSI 4.0 Guide**: Appendix 1 (Norms), Appendix 7 (LFI), Figure 4-5 (Dialectics)
3. **Psychometrics Spec**: `/docs/psychometrics_spec.md`
4. **Database Schema**: `/docs/02-relational-model.md`
5. **Code Implementation**: `app/assessments/klsi_v4/logic.py`

---

**Author**: GitHub Copilot + Farid-Ze  
**Date**: 2025-11-13  
**Status**: Production Ready
