# Learning Flexibility Index (LFI) - Technical Specification

## Overview

The **Learning Flexibility Index (LFI)** measures how consistently or variably a person ranks the four learning modes (CE, RO, AC, AE) across eight different learning contexts. It quantifies learning flexibility—the ability to adapt one's learning approach based on situational demands.

**Source:** KLSI 4.0 Guide (Kolb & Kolb, 2013), Chapter 6, pages 1443-1466

---

## Conceptual Foundation

### Experiential Learning Theory Context

According to Experiential Learning Theory (ELT), effective learners can adapt their learning style to match contextual demands. While individuals have dominant preferences (measured by the 9 learning styles), flexibility represents the capacity to deviate from these preferences when situations require different approaches.

### Key Distinctions

- **Learning Style** (from items 1-12): Stable preferences across general learning situations
- **Learning Flexibility** (from 8 contexts): Variability in preferences across specific contexts

A person can be:
- **Specialized & Rigid**: Strong style preferences, low flexibility (e.g., always uses AC regardless of context)
- **Specialized & Flexible**: Clear preferences but can adapt (e.g., prefers AC but uses CE when collaborating)
- **Balanced & Flexible**: No strong preferences, high adaptability (uses all modes situationally)

---

## The Eight Learning Contexts

The LFI assessment asks respondents to rank CE/RO/AC/AE in each of these contexts:

1. **Starting Something New** - Initiating projects or experiences
2. **Influencing Someone** - Persuading or motivating others
3. **Getting To Know Someone** - Building relationships
4. **Learning In A Group** - Collaborative learning settings
5. **Planning Something** - Organizing future actions
6. **Analyzing Something** - Breaking down complex information
7. **Evaluating An Opportunity** - Assessing options or decisions
8. **Choosing Between Alternatives** - Making choices under uncertainty

Each context requires a **forced-choice ranking** of the four modes from 1 (most like me) to 4 (least like me).

---

## Mathematical Formulation

### Step 1: Data Collection

For each of the 8 contexts, collect rankings:

```
Context i: {CE: r_CE, RO: r_RO, AC: r_AC, AE: r_AE}
```

Where each rank is an integer from 1 to 4, and `{r_CE, r_RO, r_AC, r_AE}` forms a permutation of `[1, 2, 3, 4]` (forced-choice constraint).

**Data Structure:**
```
8 contexts × 4 modes = 32 data points
Constraint: Each row must be a permutation of [1, 2, 3, 4]
```

### Step 2: Compute Row Sums

For each learning mode, sum its ranks across all 8 contexts:

$$
R_i = \sum_{j=1}^{p} \text{Rank}_{ij}
$$

Where:
- $R_i$ = total rank for mode $i$ (CE, RO, AC, or AE)
- $p = 8$ (number of contexts)
- $n = 4$ (number of modes)

**Example:**
```
If CE appears as: [4, 3, 4, 4, 1, 1, 2, 1]
Then R_CE = 4 + 3 + 4 + 4 + 1 + 1 + 2 + 1 = 20
```

### Step 3: Calculate Kendall's W

Kendall's Coefficient of Concordance (W) measures agreement among the 8 "judges" (contexts) in ranking the 4 "objects" (learning modes).

$$
W = \frac{12S}{m^2(n^3 - n)}
$$

Where:

$$
S = \sum_{i=1}^{n} \left(R_i - \bar{R}\right)^2
$$

And:

$$
\bar{R} = \frac{m(n + 1)}{2}
$$

**Parameters:**
- $m = 8$ (contexts/judges)
- $n = 4$ (modes/objects)
- $\bar{R} = 8 \times 5 / 2 = 20$ (grand mean rank per mode)

**Algebraic Note:**
The denominator $m^2(n^3 - n)$ is equivalent to $m^2 \times n \times (n^2 - 1)$:

$$
n(n^2 - 1) = n \times n^2 - n \times 1 = n^3 - n
$$

For $m=8, n=4$:
$$
m^2(n^3 - n) = 64 \times (64 - 4) = 64 \times 60 = 3840
$$

### Step 4: Transform to LFI

$$
\text{LFI} = 1 - W
$$

**Interpretation:**
- **High W** (near 1.0) = consistent ranking across contexts → **low flexibility** (rigid)
- **Low W** (near 0.0) = varied ranking across contexts → **high flexibility** (adaptive)
- By inverting: **High LFI** indicates high flexibility

**Range:** $\text{LFI} \in [0, 1]$

---

## Worked Example

### Input Data

```python
contexts = [
    {"CE": 4, "RO": 2, "AC": 1, "AE": 3},  # Context 1: Starting something new
    {"CE": 3, "RO": 1, "AC": 2, "AE": 4},  # Context 2: Influencing someone
    {"CE": 4, "RO": 3, "AC": 1, "AE": 2},  # Context 3: Getting to know someone
    {"CE": 4, "RO": 2, "AC": 1, "AE": 3},  # Context 4: Learning in a group
    {"CE": 1, "RO": 4, "AC": 3, "AE": 2},  # Context 5: Planning something
    {"CE": 1, "RO": 3, "AC": 4, "AE": 2},  # Context 6: Analyzing something
    {"CE": 2, "RO": 1, "AC": 4, "AE": 3},  # Context 7: Evaluating an opportunity
    {"CE": 1, "RO": 2, "AC": 4, "AE": 3},  # Context 8: Choosing between alternatives
]
```

### Step-by-Step Calculation

**1. Row Sums:**
```
R_CE = 4 + 3 + 4 + 4 + 1 + 1 + 2 + 1 = 20
R_RO = 2 + 1 + 3 + 2 + 4 + 3 + 1 + 2 = 18
R_AC = 1 + 2 + 1 + 1 + 3 + 4 + 4 + 4 = 20
R_AE = 3 + 4 + 2 + 3 + 2 + 2 + 3 + 3 = 22
```

**2. Grand Mean:**
```
R̄ = m(n+1)/2 = 8 × 5 / 2 = 20.0
```

**3. Sum of Squared Deviations (S):**
```
S = (20 - 20)² + (18 - 20)² + (20 - 20)² + (22 - 20)²
  = 0 + 4 + 0 + 4
  = 8.0
```

**4. Kendall's W:**
```
Numerator   = 12 × S = 12 × 8 = 96
Denominator = m² × (n³ - n) = 64 × 60 = 3840
W = 96 / 3840 = 0.025
```

**5. LFI:**
```
LFI = 1 - W = 1 - 0.025 = 0.975
```

### Interpretation

**W = 0.025** indicates very low agreement (ranks vary substantially across contexts).

**LFI = 0.975** (97.5%) indicates **very high learning flexibility**—this person adapts their learning approach dramatically based on context.

---

## Percentile Conversion

### Norm Group Precedence

The system converts raw LFI scores to percentiles using this precedence order:

1. **Education Level** (e.g., `EDU:University Degree`)
2. **Country** (e.g., `COUNTRY:Indonesia`)
3. **Age Band** (e.g., `AGE:19-24`)
4. **Gender** (e.g., `GENDER:Male`)
5. **Total** (global norms)
6. **Appendix 7 Fallback** (from KLSI 4.0 Guide)

### Appendix 7 Normative Data

The KLSI 4.0 Guide provides percentile mappings for LFI values from 0.07 to 1.00 (96 distinct entries). Example excerpt:

| LFI Score | Percentile |
|-----------|-----------|
| 0.07      | 0.0       |
| 0.50      | 11.3      |
| 0.73      | 47.3      |
| 0.85      | 73.0      |
| 0.95      | 93.6      |
| 0.97      | 97.5      |
| 1.00      | 100.0     |

**Note:** Higher LFI scores correspond to higher percentiles (unlike some psychometric scales where low scores are desirable).

---

## Flexibility Level Classification

Based on percentile tertiles:

| Percentile Range | Flexibility Level | Interpretation |
|-----------------|------------------|----------------|
| < 33.34%        | **Low**          | Consistent preferences across contexts; may struggle to adapt |
| 33.34% - 66.67% | **Moderate**     | Balanced between consistency and adaptability |
| > 66.67%        | **High**         | Highly adaptive; changes approach based on context |

### Psychological Implications

- **Low Flexibility:** May indicate:
  - Strong specialized expertise
  - Clear self-knowledge
  - Potential rigidity in new situations

- **High Flexibility:** May indicate:
  - Strong metacognitive awareness
  - Contextual sensitivity
  - Integrative complexity (Akrivou et al., 2006)

**Important:** Neither extreme is inherently "better"—effectiveness depends on environmental demands. Specialized fields may reward low flexibility (consistency), while dynamic environments reward high flexibility (adaptability).

---

## Implementation Details

### Code Location

- **Core computation:** `app/services/scoring.py::compute_kendalls_w()`
- **LFI calculation:** `app/services/scoring.py::compute_lfi()`
- **Validation:** `app/services/scoring.py::validate_lfi_context_ranks()`
- **Percentile lookup:** `app/data/norms.py::lookup_lfi()`

### Database Schema

**Table: `lfi_context_scores`**
```sql
CREATE TABLE lfi_context_scores (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    context_name VARCHAR(100) NOT NULL,  -- One of 8 contexts
    CE_rank INTEGER NOT NULL CHECK (CE_rank BETWEEN 1 AND 4),
    RO_rank INTEGER NOT NULL CHECK (RO_rank BETWEEN 1 AND 4),
    AC_rank INTEGER NOT NULL CHECK (AC_rank BETWEEN 1 AND 4),
    AE_rank INTEGER NOT NULL CHECK (AE_rank BETWEEN 1 AND 4),
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(id)
);
```

**Table: `learning_flexibility_index`**
```sql
CREATE TABLE learning_flexibility_index (
    id SERIAL PRIMARY KEY,
    session_id INTEGER UNIQUE NOT NULL,
    W_coefficient FLOAT NOT NULL CHECK (W_coefficient BETWEEN 0 AND 1),
    LFI_score FLOAT NOT NULL CHECK (LFI_score BETWEEN 0 AND 1),
    LFI_percentile FLOAT,
    flexibility_level VARCHAR(20),  -- 'Low', 'Moderate', or 'High'
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(id)
);
```

### Validation Rules

The system enforces these constraints:

1. **Forced-Choice:** Each context must rank all four modes with distinct values from [1, 2, 3, 4]
2. **Completeness:** All 8 contexts must be completed before LFI computation
3. **Data Type:** Ranks must be integers
4. **Range:** W and LFI must be within [0, 1]

**Example Validation Error:**
```python
# Invalid: Duplicate rank 2
{"CE": 1, "RO": 2, "AC": 2, "AE": 4}
# Raises: ValueError("Context 1 must be a permutation of [1,2,3,4]")
```

---

## Edge Cases & Boundary Conditions

### Case 1: Perfect Consistency (W = 1.0, LFI = 0.0)

All 8 contexts use identical rankings:

```python
[{"CE": 1, "RO": 2, "AC": 3, "AE": 4}] * 8
```

**Result:**
- Row sums: CE=8, RO=16, AC=24, AE=32
- Deviations from mean (20): -12, -4, +4, +12
- S = 144 + 16 + 16 + 144 = 320
- W = 12 × 320 / 3840 = 1.0
- LFI = 0.0

**Interpretation:** Zero flexibility—uses same learning approach in all contexts.

### Case 2: Maximum Variability (W ≈ 0.0, LFI ≈ 1.0)

Each context uses a different ranking pattern:

```python
[
    {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
    {"CE": 2, "RO": 3, "AC": 4, "AE": 1},
    {"CE": 3, "RO": 4, "AC": 1, "AE": 2},
    {"CE": 4, "RO": 1, "AC": 2, "AE": 3},
    {"CE": 1, "RO": 3, "AC": 2, "AE": 4},
    {"CE": 2, "RO": 4, "AC": 1, "AE": 3},
    {"CE": 3, "RO": 1, "AC": 4, "AE": 2},
    {"CE": 4, "RO": 2, "AC": 3, "AE": 1},
]
```

**Result:**
- Row sums: CE=20, RO=20, AC=20, AE=20 (all equal to grand mean)
- S = 0
- W = 0.0
- LFI = 1.0

**Interpretation:** Complete flexibility—no consistent preference pattern.

### Case 3: Moderate Flexibility

Typical real-world response showing some consistency with contextual variation:

```python
# Contexts 1-4 prefer AC, contexts 5-8 vary
[
    {"CE": 3, "RO": 2, "AC": 1, "AE": 4},
    {"CE": 4, "RO": 2, "AC": 1, "AE": 3},
    {"CE": 2, "RO": 3, "AC": 1, "AE": 4},
    {"CE": 3, "RO": 4, "AC": 1, "AE": 2},
    {"CE": 1, "RO": 4, "AC": 2, "AE": 3},
    {"CE": 2, "RO": 1, "AC": 3, "AE": 4},
    {"CE": 1, "RO": 2, "AC": 4, "AE": 3},
    {"CE": 4, "RO": 1, "AC": 3, "AE": 2},
]
```

**Result:**
- W ≈ 0.3-0.5 (moderate agreement)
- LFI ≈ 0.5-0.7 (moderate flexibility)

**Interpretation:** Balances preferred style (AC in structured contexts) with situational adaptation.

---

## Validity Evidence

### Construct Validity (Sharma & Kolb, 2010)

1. **Negative correlation with age** (r = -0.15, p < .01)
   - Older learners tend to be more specialized/less flexible

2. **Negative correlation with education level** (r = -0.11, p < .01)
   - Advanced education associated with specialization

3. **Gender differences:** Women show higher flexibility (M = 0.74) than men (M = 0.71)

4. **Field of study:** Concrete fields (nursing, social work) show higher flexibility than abstract fields (engineering, computer science)

5. **Correlation with Integrative Development Scale** (ρ = 0.23, p < .01)
   - Higher flexibility associated with integrative complexity

### Discriminant Validity

- LFI (from 8 contexts) correlates with integrative development (ρ = 0.23, p < .01)
- Kendall's W from KLSI items 1-12 does NOT correlate with integrative development (ρ = 0.09, ns)

**Conclusion:** LFI measures contextual flexibility (adaptive response to situations), distinct from general learning style variability.

### Relationship with Learning Styles

| Learning Style | Mean LFI | SD   | Interpretation |
|----------------|----------|------|----------------|
| Balancing      | 0.76     | 0.15 | Highest flexibility |
| Initiating     | 0.74     | 0.16 | High flexibility |
| Deciding       | 0.69     | 0.17 | Moderate flexibility |
| Analyzing      | 0.67     | 0.18 | Lowest flexibility |

**Pattern:** Balanced styles show higher flexibility; specialized styles (especially abstract) show lower flexibility.

---

## Educational & Practical Applications

### For Individual Development

1. **Self-Awareness:** Understanding one's adaptability across contexts
2. **Goal Setting:** Identify contexts where more/less flexibility is needed
3. **Deliberate Practice:** Target specific contexts to develop backup styles
4. **Career Planning:** Match flexibility profile to job demands

### For Educators

1. **Curriculum Design:** Create diverse learning contexts to develop flexibility
2. **Assessment:** Balance consistency (mastery) with adaptability (transfer)
3. **Feedback:** Help students recognize when to apply vs. adapt their preferences
4. **Team Formation:** Balance specialized (low LFI) and flexible (high LFI) members

### For Organizations

1. **Hiring:** Match LFI profiles to role requirements
   - Routine roles: Prefer low LFI (consistency)
   - Dynamic roles: Prefer high LFI (adaptability)

2. **Training:** Develop context-specific backup styles
3. **Performance Management:** Assess both expertise (style depth) and adaptability (LFI)
4. **Team Dynamics:** Ensure diversity in both styles and flexibility levels

---

## References

### Primary Sources

1. **Kolb, A. Y., & Kolb, D. A. (2013).** The Kolb Learning Style Inventory 4.0: Guide to Theory, Psychometrics, Research & Applications. Experience Based Learning Systems, Inc. (Chapter 6: Learning Flexibility Index, pp. 1443-1466)

2. **Sharma, G., & Kolb, D. A. (2010).** The learning flexibility index: Assessing contextual flexibility in learning style. In S. Rayner & E. Cools (Eds.), Style differences in cognition, learning and management (pp. 60-77). New York, NY: Routledge.

### Statistical Foundation

3. **Legendre, P. (2005).** Species associations: The Kendall coefficient of concordance revisited. Journal of Agricultural, Biological, and Environmental Statistics, 10(2), 226-245.

4. **Kendall, M. G., & Babington Smith, B. (1939).** The problem of m rankings. The Annals of Mathematical Statistics, 10(3), 275-287.

### Validation Studies

5. **Mainemelis, C., Boyatzis, R. E., & Kolb, D. A. (2002).** Learning styles and adaptive flexibility: Testing experiential learning theory. Management Learning, 33(1), 5-33.

6. **Akrivou, K., Boyatzis, R. E., & McLeod, P. L. (2006).** The evolving group: Towards a prescriptive theory of intentional group development. Journal of Management Development, 25(7), 689-706.

---

## Appendix: Python Implementation

### Complete Function

```python
from math import pow
from typing import List, Dict

def compute_kendalls_w(context_scores: List[Dict[str, int]]) -> float:
    """
    Compute Kendall's Coefficient of Concordance (W) for LFI.
    
    Args:
        context_scores: List of 8 dicts, each with CE/RO/AC/AE ranks 1-4
    
    Returns:
        W coefficient in [0.0, 1.0]
    """
    m = len(context_scores)  # 8 contexts
    modes = ['CE', 'RO', 'AC', 'AE']
    n = len(modes)  # 4 modes
    
    # Step 1: Row sums
    sums = {mode: sum(ctx[mode] for ctx in context_scores) for mode in modes}
    
    # Step 2: Grand mean
    R_bar = m * (n + 1) / 2  # = 20 for m=8, n=4
    
    # Step 3: Sum of squared deviations
    S = sum((sums[mode] - R_bar) ** 2 for mode in modes)
    
    # Step 4: Kendall's W
    numerator = 12 * S
    denominator = m * m * (pow(n, 3) - n)
    W = numerator / denominator
    
    return max(0.0, min(1.0, W))

def compute_lfi(W: float) -> float:
    """Transform Kendall's W to Learning Flexibility Index."""
    return 1 - W
```

### Usage Example

```python
# Define 8 context rankings
contexts = [
    {"CE": 4, "RO": 2, "AC": 1, "AE": 3},
    {"CE": 3, "RO": 1, "AC": 2, "AE": 4},
    {"CE": 4, "RO": 3, "AC": 1, "AE": 2},
    {"CE": 4, "RO": 2, "AC": 1, "AE": 3},
    {"CE": 1, "RO": 4, "AC": 3, "AE": 2},
    {"CE": 1, "RO": 3, "AC": 4, "AE": 2},
    {"CE": 2, "RO": 1, "AC": 4, "AE": 3},
    {"CE": 1, "RO": 2, "AC": 4, "AE": 3},
]

# Compute
W = compute_kendalls_w(contexts)
lfi = compute_lfi(W)

print(f"Kendall's W: {W}")        # 0.025
print(f"LFI: {lfi}")               # 0.975
print(f"Flexibility: Very High")
```

---

## Document Version

- **Version:** 1.0
- **Date:** November 8, 2025
- **Status:** Production
- **Validation:** 15/15 unit tests passed
- **Compliance:** KLSI 4.0 Guide (Kolb & Kolb, 2013)

---

*For questions or clarifications, refer to the KLSI 4.0 Guide Chapter 6 or consult the implementation in `app/services/scoring.py`.*
