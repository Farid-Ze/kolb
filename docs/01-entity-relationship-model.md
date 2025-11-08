# Model Entitas-Relational (ER) KLSI 4.0
## Dokumen Analisis Data dari "The Kolb Learning Style Inventory 4.0"

### METADATA DOKUMEN
- Sumber: The Kolb Learning Style Inventory 4.0 - Guide to Theory, Psychometrics, Research & Applications
- Basis Teori: Experiential Learning Theory (ELT) by David A. Kolb (1984)
- Versi Assessment: KLSI 4.0 (Kolb & Kolb, 2011)
- Normative Sample: N=10,423

---

## 1. IDENTIFIKASI ENTITAS UTAMA

### 1.1 **ENTITAS: USER (Pengguna/Responden)**
**Deskripsi**: Individu yang mengambil assessment KLSI 4.0

**Atribut**:
- user_id (PK) : BIGINT, PRIMARY KEY
- full_name : VARCHAR(255), NOT NULL
- email : VARCHAR(255), UNIQUE, NOT NULL
- date_of_birth : DATE, NOT NULL
- gender : ENUM('Male', 'Female', 'Other', 'Prefer not to say')
- education_level : ENUM('Primary School', 'Secondary School', 'University Degree', 'Master\'s Degree', 'Doctoral Degree')
- country : VARCHAR(100)
- occupation : VARCHAR(255)
- created_at : TIMESTAMP
- updated_at : TIMESTAMP

**Business Rules**:
- User minimal berusia 13 tahun (teens and adults)
- Email harus unik untuk setiap user
- Age_group tidak disimpan; dihitung otomatis saat diperlukan dari date_of_birth menjadi band Appendix 2 (<19, 19–24, 25–34, 35–44, 45–54, 55–64, >64)

---

### 1.2 **ENTITAS: ASSESSMENT_SESSION**
**Deskripsi**: Sesi pengambilan assessment KLSI 4.0 oleh user

**Atribut**:
- session_id (PK) : BIGINT, PRIMARY KEY
- user_id (FK) : BIGINT, FOREIGN KEY → USER(user_id)
- start_time : TIMESTAMP, NOT NULL
- end_time : TIMESTAMP
- completion_status : ENUM('Started', 'In Progress', 'Completed', 'Abandoned')
- version : VARCHAR(10) DEFAULT 'KLSI 4.0'
- session_type : ENUM('Initial', 'Retest', 'Follow-up')
- days_since_last_session : INT (untuk test-retest reliability studies)

**Business Rules**:
- Satu user dapat memiliki multiple sessions
- Session harus completed untuk menghasilkan valid report
- Retest reliability study: minimal 5-8 minggu interval (berdasarkan studies)

---

### 1.3 **ENTITAS: ASSESSMENT_ITEM**
**Deskripsi**: Item/pertanyaan dalam KLSI 4.0 (20 items total: 12 learning style + 8 LFI)

**Atribut**:
- item_id (PK) : INT, PRIMARY KEY (1-20)
- item_number : INT, NOT NULL (1-20)
- item_type : ENUM('Learning_Style', 'Learning_Flexibility')
- item_stem : TEXT, NOT NULL (contoh: "When I learn", "When I start something new")
- item_category : VARCHAR(100) (untuk LFI: 'Starting_New', 'Influencing', 'Getting_to_Know', 'Learning_Group', 'Planning', 'Analyzing', 'Evaluating', 'Choosing')
- item_order_position : INT (untuk randomized format)
- reading_level : VARCHAR(20) DEFAULT '7th grade'
- language : VARCHAR(10) DEFAULT 'English'

**Business Rules**:
- Item 1-12: Learning Style assessment items (similar to KLSI 3.1)
- Item 13-20: Learning Flexibility Index (LFI) items (8 context-specific items)
- Items menggunakan forced-choice ranking format
- Item stems harus setara social desirability

---

### 1.4 **ENTITAS: ITEM_CHOICE**
**Deskripsi**: Pilihan jawaban untuk setiap item (4 choices per item representing CE, RO, AC, AE)

**Atribut**:
- choice_id (PK) : INT, PRIMARY KEY
- item_id (FK) : INT, FOREIGN KEY → ASSESSMENT_ITEM(item_id)
- learning_mode : ENUM('CE', 'RO', 'AC', 'AE'), NOT NULL
- choice_text : TEXT, NOT NULL
- choice_label : CHAR(1) ('A', 'B', 'C', 'D')
- social_desirability_score : DECIMAL(3,2) (hasil rating dari panel)

**Business Rules**:
- Setiap item memiliki EXACTLY 4 choices (CE, RO, AC, AE)
- Choices harus balanced social desirability (Beutell & Kressel 1984: SD < 4%)
- No duplicate learning_mode per item_id

**Contoh Data** (Item 13 - LFI "Starting something new"):
```
choice_id | item_id | learning_mode | choice_text
----------|---------|---------------|----------------------------------
49        | 13      | CE            | I rely on my feelings to guide me
50        | 13      | RO            | I imagine different possibilities
51        | 13      | AC            | I analyze the situation
52        | 13      | AE            | I try to be practical and realistic
```

---

### 1.5 **ENTITAS: USER_RESPONSE**
**Deskripsi**: Jawaban ranking user untuk setiap item (forced-choice ranking: 1-4)

**Atribut**:
- response_id (PK) : BIGINT, PRIMARY KEY
- session_id (FK) : BIGINT, FOREIGN KEY → ASSESSMENT_SESSION(session_id)
- item_id (FK) : INT, FOREIGN KEY → ASSESSMENT_ITEM(item_id)
- choice_id (FK) : INT, FOREIGN KEY → ITEM_CHOICE(choice_id)
- rank_value : INT, NOT NULL CHECK (rank_value BETWEEN 1 AND 4)
- response_time_seconds : INT
- modified_count : INT DEFAULT 0

**Business Rules**:
- **CRITICAL**: Forced-choice ranking = user MUST rank all 4 choices (1,2,3,4)
- No duplicate rank_value per session_id + item_id combination
- Rank 4 = most preferred, Rank 1 = least preferred
- Ipsative scoring: sum of ranks per item = 1+2+3+4 = 10 (constant)

**Constraint**:
```sql
UNIQUE (session_id, item_id, rank_value)
CHECK (rank_value IN (1,2,3,4))
```

---

### 1.6 **ENTITAS: SCALE_SCORE**
**Deskripsi**: Skor mentah (raw scores) untuk 4 primary modes dari 12 learning style items

**Atribut**:
- scale_score_id (PK) : BIGINT, PRIMARY KEY
- session_id (FK) : BIGINT, FOREIGN KEY → ASSESSMENT_SESSION(session_id)
- CE_raw : INT, NOT NULL CHECK (CE_raw BETWEEN 11 AND 44) -- range 11-44
- RO_raw : INT, NOT NULL CHECK (RO_raw BETWEEN 11 AND 44)
- AC_raw : INT, NOT NULL CHECK (AC_raw BETWEEN 11 AND 44)
- AE_raw : INT, NOT NULL CHECK (AE_raw BETWEEN 11 AND 44)
- computed_at : TIMESTAMP

**Business Rules**:
- Raw scores = sum of ranks untuk 12 items per learning mode
- Theoretical range: 12 (all rank 1) to 48 (all rank 4)
- Observed range dalam normative sample: 11-44 (Appendix 1)
- Ipsative constraint: CE_raw + RO_raw + AC_raw + AE_raw = constant (120)

**Rumus Perhitungan**:
```
CE_raw = Σ(ranks for CE choices across 12 learning style items)
RO_raw = Σ(ranks for RO choices across 12 learning style items)
AC_raw = Σ(ranks for AC choices across 12 learning style items)
AE_raw = Σ(ranks for AE choices across 12 learning style items)
```

**Method-induced Correlation**:
- Predicted average correlation = -1/(m-1) = -1/3 = -0.33 (Johnson et al. 1988)
- Observed empirical correlation ≈ -0.33 (confirmed by random simulation)

---

### 1.7 **ENTITAS: COMBINATION_SCORE**
**Deskripsi**: Skor kombinasi dialectic (difference scores yang mengurangi efek ipsatif)

**Atribut**:
- combination_score_id (PK) : BIGINT, PRIMARY KEY
- session_id (FK) : BIGINT, UNIQUE, FOREIGN KEY → ASSESSMENT_SESSION(session_id)
- ACCE_raw : INT, NOT NULL CHECK (ACCE_raw BETWEEN -33 AND 33) -- AC - CE
- AERO_raw : INT, NOT NULL CHECK (AERO_raw BETWEEN -33 AND 33) -- AE - RO
- ASSIMILATION_ACCOMMODATION : INT -- (AC+RO) - (AE+CE)
- CONVERGING_DIVERGING : INT -- (AC+AE) - (CE+RO)
- computed_at : TIMESTAMP

**Business Rules**:
- ACCE dan AERO adalah difference scores (AC−CE, AE−RO) yang secara desain mengurangi artefak ipsatif dari format forced‑choice; keduanya merupakan dimensi ortogonal teoretis.
- Empirically, korelasi ACCE & AERO rendah (≈ −0.09 pada KLSI 4.0 normative sample), bukan −1.0 seperti korelasi antarmode mentah yang terinduksi format.
- Catatan: data dasar tetap ipsatif; klaim “non‑ipsative absolut” tidak digunakan. Validasi fokus pada korelasi rendah dan stabilitas klasifikasi.

**Rumus Dialectics**:
```sql
ACCE_raw = AC_raw - CE_raw          -- Grasping dimension (Abstract vs Concrete)
AERO_raw = AE_raw - RO_raw          -- Transforming dimension (Action vs Reflection)

ASSIMILATION_ACCOMMODATION = (AC_raw + RO_raw) - (AE_raw + CE_raw)
-- High = Assimilation (generalized conceptual learning)
-- Low = Accommodation (active contextual learning)

CONVERGING_DIVERGING = (AC_raw + AE_raw) - (CE_raw + RO_raw)
-- High = Converging (evaluative decision making, close down)
-- Low = Diverging (imaginative possibilities, open up)
```

---

### 1.8 **ENTITAS: NORMATIVE_CONVERSION_TABLE**
**Deskripsi**: Tabel konversi raw score → percentile (berdasarkan normative sample N=10,423)

**Atribut**:
- conversion_id (PK) : INT, PRIMARY KEY
- norm_group : VARCHAR(50) -- fleksibel; contoh: 'Total', 'EDU:University Degree', 'AGE:19-24', 'GENDER:Male'
- scale_name : VARCHAR(5) -- 'CE','RO','AC','AE','ACCE','AERO','LFI'
- raw_score : INT, NOT NULL
- percentile : DECIMAL(5,2), NOT NULL CHECK (percentile BETWEEN 0 AND 100)

**Business Rules**:
- Conversion tables ada di Appendix 1 (CE, RO, AC, AE; ACCE, AERO difference distributions) & Appendix 7 (LFI percentiles)
- Purpose: scale comparability among individual's LSI scores (Barron 1996)
- Default norm_group = 'Total' (N=10,423)
- Sub-groups available untuk specialized comparisons (Appendix 2–5) memakai label konvensi: `EDU:<label>`, `AGE:<band>`, `GENDER:<value>`

**Contoh Data** (CE scale, Total norm group):
```
raw_score | percentile
----------|------------
11        | 0.10
12        | 0.30
...
28        | 50.00      -- Median
...
44        | 99.90
```

---

### 1.9 **ENTITAS: PERCENTILE_SCORE**
**Deskripsi**: Skor percentile hasil konversi dari raw scores

**Atribut**:
- percentile_score_id (PK) : BIGINT, PRIMARY KEY
- session_id (FK) : BIGINT, UNIQUE, FOREIGN KEY → ASSESSMENT_SESSION(session_id)
- norm_group_used : VARCHAR(50) DEFAULT 'Total'
- CE_percentile : DECIMAL(5,2), NOT NULL
- RO_percentile : DECIMAL(5,2), NOT NULL
- AC_percentile : DECIMAL(5,2), NOT NULL
- AE_percentile : DECIMAL(5,2), NOT NULL
- ACCE_percentile : DECIMAL(5,2), NOT NULL
- AERO_percentile : DECIMAL(5,2), NOT NULL
- computed_at : TIMESTAMP

**Business Rules**:
- Percentiles dipakai untuk interpretabilitas relatif terhadap norma (reporting), bukan untuk menentukan tipe gaya.
- Klasifikasi 9 gaya memakai cut-point RAW pada difference scores sesuai grid KLSI 4.0: 
  - ACCE bands: Low (≤5), Mid (6–14), High (≥15)
  - AERO bands: Low (≤0), Mid (1–11), High (≥12)

---

### 1.10 **ENTITAS: LEARNING_STYLE_TYPE**
**Deskripsi**: Definisi 9 learning style types (KLSI 4.0 typology)

**Atribut**:
- style_type_id (PK) : INT, PRIMARY KEY
- style_name : VARCHAR(50), UNIQUE, NOT NULL
- style_code : VARCHAR(20), UNIQUE
- ACCE_min : INT
- ACCE_max : INT
- AERO_min : INT
- AERO_max : INT
- quadrant : ENUM('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'CENTER')
- description : TEXT
- learning_strengths : TEXT
- learning_challenges : TEXT
- preferred_learning_space : TEXT
- others_perceive_as : TEXT

**Data (9 Style Types)**:
```sql
INSERT INTO LEARNING_STYLE_TYPE VALUES
(1, 'Initiating', 'INIT', -999, 5, 12, 999, 'NW', 
   'Ability to initiate action to deal with experiences...', ...),
(2, 'Experiencing', 'EXP', -999, 5, 1, 11, 'W', 
   'Ability to find meaning from deep involvement...', ...),
(3, 'Imagining', 'IMAG', -999, 5, -999, 0, 'SW', 
   'Creating style - observing and reflecting...', ...),
(4, 'Reflecting', 'REFL', 6, 14, -999, 0, 'S', 
   'Connect experience and ideas through sustained reflection...', ...),
(5, 'Analyzing', 'ANAL', 15, 999, -999, 0, 'SE', 
   'Integrate and systematize ideas through reflection...', ...),
(6, 'Thinking', 'THINK', 15, 999, 1, 11, 'E', 
   'Disciplined involvement in abstract reasoning...', ...),
(7, 'Deciding', 'DEC', 15, 999, 12, 999, 'NE', 
   'Use theories and models to decide on solutions...', ...),
(8, 'Acting', 'ACT', 6, 14, 12, 999, 'N', 
   'Goal directed action integrating people and tasks...', ...),
(9, 'Balancing', 'BAL', 6, 14, 1, 11, 'CENTER', 
   'Flexibly adapt by weighing pros and cons...', ...)
```

**Business Rules**:
- 9 styles didefinisikan melalui grid dua dimensi ACCE/AERO dengan band kanonik dari Guide: ACCE <6 / 6–14 / >14 dan AERO <1 / 1–11 / >11 (pembagian kira‑kira sepertiga distribusi).
- Formula rentang (Appendix, disarikan):
  - Initiating: ACCE <6, AERO >11
  - Experiencing: ACCE <6, AERO >0 & <12
  - Imagining: ACCE <6, AERO <1
  - Reflecting: ACCE >5 & <15, AERO <1
  - Analyzing: ACCE >14, AERO <1
  - Thinking: ACCE >14, AERO >0 & <12
  - Deciding: ACCE >14, AERO >11
  - Acting: ACCE >5 & <15, AERO >11
  - Balancing: ACCE >5 & <15, AERO >0 & <12

---

### 1.11 **ENTITAS: USER_LEARNING_STYLE**
**Deskripsi**: Learning style type assignment untuk user berdasarkan hasil assessment

**Atribut**:
- user_style_id (PK) : BIGINT, PRIMARY KEY
- session_id (FK) : BIGINT, UNIQUE, FOREIGN KEY → ASSESSMENT_SESSION(session_id)
- primary_style_type_id (FK) : INT, FOREIGN KEY → LEARNING_STYLE_TYPE(style_type_id)
- ACCE_raw : INT, NOT NULL (denormalized for quick access)
- AERO_raw : INT, NOT NULL
- kite_coordinates : JSON -- {CE: x, RO: y, AC: z, AE: w} for visualization
- style_intensity_score : DECIMAL(5,2) -- distance from center
- assigned_at : TIMESTAMP

**Business Rules**:
- Primary style determined by ACCE_raw and AERO_raw ranges
- "Kite shape" visualization pada Learning Cycle target
- Borderline cases resolved by new 9-type typology (no ambiguity)

---

### 1.12 **ENTITAS: LFI_CONTEXT_SCORE**
**Deskripsi**: Skor untuk 8 learning contexts (LFI items 13-20)

**Atribut**:
- lfi_context_id (PK) : BIGINT, PRIMARY KEY
- session_id (FK) : BIGINT, FOREIGN KEY → ASSESSMENT_SESSION(session_id)
- context_name : VARCHAR(50) -- 'Starting_New', 'Influencing', etc.
- CE_rank : INT CHECK (CE_rank BETWEEN 1 AND 4)
- RO_rank : INT CHECK (RO_rank BETWEEN 1 AND 4)
- AC_rank : INT CHECK (AC_rank BETWEEN 1 AND 4)
- AE_rank : INT CHECK (AE_rank BETWEEN 1 AND 4)
- dominant_mode_in_context : ENUM('CE', 'RO', 'AC', 'AE')

**Business Rules**:
- 8 contexts represent different emphasis around learning cycle:
  1. "Starting something new" → AE & CE emphasis
  2. "Influencing someone" → AE & CE emphasis
  3. "Getting to know someone" → CE & RO emphasis
  4. "Learning in a group" → CE & RO emphasis
  5. "Planning something" → RO & AC emphasis
  6. "Analyzing something" → RO & AC emphasis
  7. "Evaluating an opportunity" → AC & AE emphasis
  8. "Choosing between alternatives" → AC & AE emphasis

---

### 1.13 **ENTITAS: LEARNING_FLEXIBILITY_INDEX**
**Deskripsi**: Overall measure of learning style flexibility

**Atribut**:
- lfi_id (PK) : BIGINT, PRIMARY KEY
- session_id (FK) : BIGINT, UNIQUE, FOREIGN KEY → ASSESSMENT_SESSION(session_id)
- W_coefficient : DECIMAL(5,4) -- Kendall's Coefficient of Concordance
- LFI_score : DECIMAL(5,4), NOT NULL -- LFI = 1 - W
- flexibility_level : ENUM('Low', 'Moderate', 'High')
- LFI_percentile : DECIMAL(5,2)
- computed_at : TIMESTAMP

**Business Rules**:
- **Formula**: LFI = 1 - W (where W = Kendall's Coefficient of Concordance)
- W measures degree of consistency across 8 contexts
- High LFI = more flexible (adapts style to context)
- Low LFI = more consistent (uses same style across contexts)
- Validation study: Sharma & Kolb 2010

**Rumus W (Kendall's Coefficient)**:
```
W = [12 * Σ(Rj - R̄)²] / [m² * (n³ - n)]

where:
- m = number of judges/contexts (8)
- n = number of objects/modes (4: CE, RO, AC, AE)
- Rj = sum of ranks for mode j across 8 contexts
- R̄ = mean of rank sums = m*(n+1)/2 = 8*5/2 = 20
```

---

### 1.14 **ENTITAS: BACKUP_LEARNING_STYLE**
**Deskripsi**: Secondary learning style (cadangan) terdekat berdasarkan koordinat ACCE/AERO

**Atribut**:
- backup_style_id (PK) : BIGINT, PRIMARY KEY
- session_id (FK) : BIGINT, FOREIGN KEY → ASSESSMENT_SESSION(session_id)
- style_type_id (FK) : INT, FOREIGN KEY → LEARNING_STYLE_TYPE(style_type_id)
- frequency_count : INT -- berapa kali style ini muncul across 8 contexts
- contexts_used : JSON -- array of context names where this style appears
- percentage : DECIMAL(5,2) -- frequency / 8 contexts * 100

**Business Rules**:
- Backup ditetapkan secara objektif: style window terdekat kedua berdasarkan jarak Manhattan (L1) ke interval ACCE/AERO (bukan dari frekuensi konteks).
- Konteks (Appendix 8) dapat dipakai untuk studi lanjutan frekuensi gaya per konteks (roadmap), namun tidak menjadi dasar penetapan backup saat ini.
- Membantu mengkomunikasikan ambiguitas borderline tanpa mengubah primary style.

---

### 1.15 **ENTITAS: CONTINUOUS_BALANCE_SCORE**
**Deskripsi**: (Roadmap riset) Continuous measures of balance on ACCE and AERO dimensions

**Atribut**:
- balance_score_id (PK) : BIGINT, PRIMARY KEY
- session_id (FK) : BIGINT, UNIQUE, FOREIGN KEY → ASSESSMENT_SESSION(session_id)
- BALANCE_ACCE : DECIMAL(5,2), NOT NULL -- ABS[AC - (CE + 9)]
- BALANCE_AERO : DECIMAL(5,2), NOT NULL -- ABS[AE - (RO + 6)]
- balance_level : ENUM('Specialized', 'Moderate', 'Balanced')

**Business Rules**:
- Belum diimplementasikan di ORM saat ini; dipertahankan sebagai rencana untuk analisis lanjutan.
- Referensi penelitian: Mainemelis et al. 2002; Sharma & Kolb 2010.

**Rumus**:
```sql
BALANCE_ACCE = ABS(AC_raw - (CE_raw + 9))
BALANCE_AERO = ABS(AE_raw - (RO_raw + 6))
```

**Interpretation**:
- Low scores = balanced on that dimension
- High scores = specialized (strong preference for one pole)

---

### 1.16 **ENTITAS: ASSESSMENT_REPORT**
**Deskripsi**: Generated report untuk user (PDF/digital format)

**Atribut**:
- report_id (PK) : BIGINT, PRIMARY KEY
- session_id (FK) : BIGINT, UNIQUE, FOREIGN KEY → ASSESSMENT_SESSION(session_id)
- report_type : ENUM('Personal', 'Team', 'Educational', 'Research')
- generated_at : TIMESTAMP
- report_format : ENUM('PDF', 'HTML', 'Interactive')
- report_url : VARCHAR(500)
- includes_lfi : BOOLEAN DEFAULT TRUE
- includes_interpretation : BOOLEAN DEFAULT TRUE
- includes_development_plan : BOOLEAN DEFAULT TRUE

**Business Rules**:
- Report includes:
  1. Learning Cycle target with kite shape
  2. Primary learning style description
  3. Learning strengths and challenges
  4. LFI score and backup styles
  5. Personalized learning effectiveness tips
  6. Application guide (work and personal life)
  7. Team learning implications (if team report)

---

### 1.17 **ENTITAS: RELIABILITY_STUDY**
**Deskripsi**: Data untuk reliability studies (internal consistency & test-retest)

**Atribut**:
- study_id (PK) : BIGINT, PRIMARY KEY
- study_type : ENUM('Internal_Consistency', 'Test_Retest')
- session_id (FK) : BIGINT, FOREIGN KEY → ASSESSMENT_SESSION(session_id)
- retest_session_id (FK) : BIGINT, NULLABLE, FOREIGN KEY → ASSESSMENT_SESSION(session_id)
- time_between_tests_days : INT
- cronbach_alpha_CE : DECIMAL(4,3)
- cronbach_alpha_RO : DECIMAL(4,3)
- cronbach_alpha_AC : DECIMAL(4,3)
- cronbach_alpha_AE : DECIMAL(4,3)
- average_alpha : DECIMAL(4,3)
- test_retest_correlation : JSON -- {CE: r, RO: r, AC: r, AE: r, ACCE: r, AERO: r}
- kappa_coefficient : DECIMAL(4,3) -- for style type agreement

**Business Rules**:
- KLSI 4.0 average Cronbach Alpha = 0.81 (Table 3)
- Test-retest reliability studies: 5-8 weeks interval
- Kappa coefficient measures style type stability across retest
- ELT hypothesis: learning style is situational (may change with context)

---

### 1.18 **ENTITAS: VALIDITY_STUDY**
**Deskripsi**: Data untuk validity studies (demographic, educational, concurrent)

**Atribut**:
- validity_id (PK) : BIGINT, PRIMARY KEY
- study_type : ENUM('Age_Correlation', 'Gender_Difference', 'Education_Level', 'Concurrent_Validity', 'External_Validity')
- session_id (FK) : BIGINT, FOREIGN KEY → ASSESSMENT_SESSION(session_id)
- comparison_instrument : VARCHAR(100) -- e.g., 'LSI 3.1', 'ASI', 'LSP', 'LSQ'
- correlation_coefficients : JSON
- significance_level : DECIMAL(4,3)
- effect_size : DECIMAL(5,3)

**Business Rules**:
- KLSI 4.0 vs KLSI 3.1: average correlation = 0.92 (Table 6)
- Age correlation: linear increase in AC-CE with age (Figure 14)
- Gender: males more abstract than females (p<.001)
- Educational specialization studies: validity of ELT knowledge structure theory

---

### 1.19 **ENTITAS: TEAM**
**Deskripsi**: Team/group entity untuk team learning research

**Atribut**:
- team_id (PK) : BIGINT, PRIMARY KEY
- team_name : VARCHAR(255), NOT NULL
- team_type : ENUM('Educational', 'Work', 'Research', 'Project')
- industry : VARCHAR(100)
- team_size : INT
- task_type : ENUM('Routine', 'Non-Routine', 'Creative', 'Analytical')
- created_at : TIMESTAMP

**Business Rules**:
- Teams with diverse learning styles perform better (Wolfe 1977)
- Heterogeneous teams earn ~2x more than homogeneous (business simulation)
- Team performance enhanced when covering all 4 learning modes

---

### 1.20 **ENTITAS: TEAM_MEMBER**
**Deskripsi**: Junction table untuk Team-User relationship

**Atribut**:
- team_member_id (PK) : BIGINT, PRIMARY KEY
- team_id (FK) : BIGINT, FOREIGN KEY → TEAM(team_id)
- user_id (FK) : BIGINT, FOREIGN KEY → USER(user_id)
- session_id (FK) : BIGINT, FOREIGN KEY → ASSESSMENT_SESSION(session_id)
- team_role : VARCHAR(100) -- e.g., 'Leader', 'Artist', 'Writer', 'Speaker' (McMurray 1998)
- belbin_role : VARCHAR(50) -- if using Belbin team role model
- joined_at : TIMESTAMP

**Business Rules**:
- Team roles can match strongest learning mode (McMurray 1998):
  - Leader → CE (concrete experience)
  - Artist → RO (reflective observation)
  - Writer → AC (abstract conceptualization)
  - Speaker → AE (active experimentation)

---

### 1.21 **ENTITAS: TEAM_PERFORMANCE**
**Deskripsi**: Team performance metrics dan learning outcomes

**Atribut**:
- performance_id (PK) : BIGINT, PRIMARY KEY
- team_id (FK) : BIGINT, FOREIGN KEY → TEAM(team_id)
- assessment_date : DATE
- learning_style_diversity_index : DECIMAL(5,3) -- measure of style heterogeneity
- experiential_learning_norms_score : DECIMAL(5,2)
- decision_making_quality : INT CHECK (decision_making_quality BETWEEN 1 AND 10)
- goal_achievement_score : DECIMAL(5,2)
- overall_performance_rating : DECIMAL(5,2)
- psychological_safety_score : DECIMAL(5,2) -- Wyss-Flamm (2002)

**Business Rules**:
- Learning style diversity positively related to performance (Jules 2007)
- Experiential learning norms enhance performance (Lingham 2004)
- Best teams adopt all 9 Belbin roles covering all learning cycle stages (Park & Bang 2002)

---

### 1.22 **ENTITAS: NORMATIVE_STATISTICS**
**Deskripsi**: Descriptive statistics untuk normative groups

**Atribut**:
- stat_id (PK) : INT, PRIMARY KEY
- norm_group : VARCHAR(50) -- 'Total', 'Medical', 'Nursing', etc.
- sample_size : INT
- CE_mean : DECIMAL(5,2)
- CE_stdev : DECIMAL(5,2)
- RO_mean : DECIMAL(5,2)
- RO_stdev : DECIMAL(5,2)
- AC_mean : DECIMAL(5,2)
- AC_stdev : DECIMAL(5,2)
- AE_mean : DECIMAL(5,2)
- AE_stdev : DECIMAL(5,2)
- ACCE_mean : DECIMAL(5,2)
- ACCE_stdev : DECIMAL(5,2)
- AERO_mean : DECIMAL(5,2)
- AERO_stdev : DECIMAL(5,2)
- gender_distribution : JSON -- {Male: %, Female: %}
- age_distribution : JSON
- education_distribution : JSON

**Data (dari Table 2)**:
```sql
-- Total Normative Group N=10,423
CE_mean: 19.84, CE_stdev: 6.47
RO_mean: 26.22, RO_stdev: 7.02
AC_mean: 28.99, AC_stdev: 6.66
AE_mean: 31.84, AE_stdev: 5.93
ACCE_mean: 9.16, ACCE_stdev: 10.86
AERO_mean: 5.62, AERO_stdev: 10.92

Gender: 53% Female, 47% Male
Age: 19-24=19.9%, 25-34=29.6%, 35-44=26.5%, 45-54=17.9%
Education: University=49.9%, Master's=20.5%, Doctoral=10.5%
```

---

## 2. RELASI ANTAR ENTITAS

### 2.1 **RELASI: USER - ASSESSMENT_SESSION**
- **Kardinalitas**: 1:N (One-to-Many)
- **Deskripsi**: Satu user dapat mengambil multiple assessment sessions
- **Foreign Key**: ASSESSMENT_SESSION.user_id → USER.user_id
- **Business Rule**: User dapat retest untuk reliability studies

### 2.2 **RELASI: ASSESSMENT_SESSION - USER_RESPONSE**
- **Kardinalitas**: 1:N (One-to-Many)
- **Deskripsi**: Satu session memiliki 20 responses (20 items × 4 choices ranked)
- **Foreign Key**: USER_RESPONSE.session_id → ASSESSMENT_SESSION.session_id
- **Business Rule**: Session harus memiliki EXACTLY 20 complete responses (80 total rankings)

### 2.3 **RELASI: ASSESSMENT_ITEM - ITEM_CHOICE**
- **Kardinalitas**: 1:4 (One-to-Four, mandatory)
- **Deskripsi**: Setiap item memiliki EXACTLY 4 choices (CE, RO, AC, AE)
- **Foreign Key**: ITEM_CHOICE.item_id → ASSESSMENT_ITEM.item_id
- **Business Rule**: No item without complete 4 choices

### 2.4 **RELASI: ASSESSMENT_SESSION - SCALE_SCORE**
- **Kardinalitas**: 1:1 (One-to-One)
- **Deskripsi**: Setiap completed session memiliki 1 scale score record
- **Foreign Key**: SCALE_SCORE.session_id → ASSESSMENT_SESSION.session_id
- **Business Rule**: Only computed when session is completed

### 2.5 **RELASI: SCALE_SCORE - COMBINATION_SCORE**
- **Kardinalitas**: 1:1 (One-to-One)
- **Deskripsi**: Scale scores menghasilkan combination scores
- **Foreign Key**: COMBINATION_SCORE.session_id → SCALE_SCORE.session_id
- **Derivation**: Computed from scale_score values

### 2.6 **RELASI: COMBINATION_SCORE - USER_LEARNING_STYLE**
- **Kardinalitas**: 1:1 (One-to-One)
- **Deskripsi**: Combination scores menentukan learning style type
- **Foreign Key**: USER_LEARNING_STYLE.session_id → COMBINATION_SCORE.session_id
- **Business Rule**: Style type assignment based on ACCE & AERO ranges

### 2.7 **RELASI: USER_LEARNING_STYLE - LEARNING_STYLE_TYPE**
- **Kardinalitas**: N:1 (Many-to-One)
- **Deskripsi**: Multiple users dapat memiliki same learning style type
- **Foreign Key**: USER_LEARNING_STYLE.primary_style_type_id → LEARNING_STYLE_TYPE.style_type_id

### 2.8 **RELASI: ASSESSMENT_SESSION - LFI_CONTEXT_SCORE**
- **Kardinalitas**: 1:8 (One-to-Eight, mandatory)
- **Deskripsi**: Setiap session memiliki 8 LFI context scores
- **Foreign Key**: LFI_CONTEXT_SCORE.session_id → ASSESSMENT_SESSION.session_id
- **Business Rule**: 8 contexts represent different learning situations

### 2.9 **RELASI: LFI_CONTEXT_SCORE - LEARNING_FLEXIBILITY_INDEX**
- **Kardinalitas**: 8:1 (Eight-to-One)
- **Deskripsi**: 8 context scores dihitung menjadi 1 LFI score
- **Foreign Key**: LEARNING_FLEXIBILITY_INDEX.session_id → ASSESSMENT_SESSION.session_id
- **Computation**: Kendall's W coefficient from 8 contexts

### 2.10 **RELASI: ASSESSMENT_SESSION - BACKUP_LEARNING_STYLE**
- **Kardinalitas**: 1:N (One-to-Many)
- **Deskripsi**: Session dapat identify multiple backup styles
- **Foreign Key**: BACKUP_LEARNING_STYLE.session_id → ASSESSMENT_SESSION.session_id
- **Foreign Key**: BACKUP_LEARNING_STYLE.style_type_id → LEARNING_STYLE_TYPE.style_type_id

### 2.11 **RELASI: TEAM - TEAM_MEMBER - USER**
- **Kardinalitas**: M:N (Many-to-Many through junction table)
- **Deskripsi**: Teams memiliki multiple members, users dapat join multiple teams
- **Foreign Key**: TEAM_MEMBER.team_id → TEAM.team_id
- **Foreign Key**: TEAM_MEMBER.user_id → USER.user_id
- **Foreign Key**: TEAM_MEMBER.session_id → ASSESSMENT_SESSION.session_id

### 2.12 **RELASI: TEAM - TEAM_PERFORMANCE**
- **Kardinalitas**: 1:N (One-to-Many)
- **Deskripsi**: Team dapat dinilai multiple times
- **Foreign Key**: TEAM_PERFORMANCE.team_id → TEAM.team_id
- **Business Rule**: Performance assessment over time untuk longitudinal studies

---

## 3. DIAGRAM ER

### 3.1 CORE ASSESSMENT FLOW
```
┌──────────────┐
│     USER     │
│   (PK: id)   │
└──────┬───────┘
       │ 1
       │
       │ N
┌──────▼──────────────┐
│ ASSESSMENT_SESSION  │
│   (PK: session_id)  │
│   (FK: user_id)     │
└──────┬──────────────┘
       │ 1
       │
       ├────────────────────────┐
       │                        │
       │ 20                     │ 1
┌──────▼──────────┐    ┌────────▼────────────┐
│  USER_RESPONSE  │    │    SCALE_SCORE     │
│   (FK: session) │    │  (CE,RO,AC,AE raw)  │
│   (FK: item)    │    └────────┬────────────┘
│   (FK: choice)  │             │ 1
│   (rank: 1-4)   │             │
└────┬────────────┘    ┌────────▼──────────────┐
     │                 │  COMBINATION_SCORE   │
     │ N               │  (ACCE, AERO, etc.)  │
     │                 └────────┬──────────────┘
     │ 1                        │ 1
┌────▼──────────────┐  ┌────────▼────────────────┐
│  ASSESSMENT_ITEM  │  │ USER_LEARNING_STYLE    │
│  (20 items total) │  │ (FK: style_type_id)    │
└────┬──────────────┘  └────────┬────────────────┘
     │ 1                        │ N
     │                          │ 1
     │ 4              ┌─────────▼─────────────────┐
┌────▼─────────────┐  │ LEARNING_STYLE_TYPE      │
│   ITEM_CHOICE    │  │ (9 types: Initiating,    │
│ (CE,RO,AC,AE)    │  │  Experiencing, ...)      │
└──────────────────┘  └──────────────────────────┘
```

### 3.2 LEARNING FLEXIBILITY MODULE
```
┌──────────────────────┐
│  ASSESSMENT_SESSION  │
└──────┬───────────────┘
       │ 1
       │
       │ 8
┌──────▼────────────────┐
│  LFI_CONTEXT_SCORE   │
│  (8 learning contexts)│
└──────┬────────────────┘
       │ 8
       │
       │ 1
┌──────▼─────────────────────┐
│ LEARNING_FLEXIBILITY_INDEX │
│   (LFI = 1 - W)            │
│   (Kendall's W coeff)      │
└────────────────────────────┘

┌──────────────────────┐
│  ASSESSMENT_SESSION  │
└──────┬───────────────┘
       │ 1
       │
       │ N
┌──────▼──────────────────┐
│ BACKUP_LEARNING_STYLE   │
│ (FK: style_type_id)     │
│ (frequency, contexts)   │
└─────────────────────────┘
```

### 3.3 NORMATIVE & SCORING
```
┌──────────────────────────┐
│  NORMATIVE_CONVERSION   │
│  TABLE (Appendix 1)     │
│  (raw → percentile)     │
└──────┬───────────────────┘
       │
       │ lookup
       │
┌──────▼──────────────────┐
│  PERCENTILE_SCORE       │
│  (CE%, RO%, AC%, AE%)  │
│  (ACCE%, AERO%)        │
└─────────────────────────┘
```

### 3.4 TEAM LEARNING MODULE
```
┌──────────┐              ┌──────────┐
│   USER   │              │   TEAM   │
└────┬─────┘              └────┬─────┘
     │ N                       │ 1
     │                         │
     │         M      N        │
     └─────►TEAM_MEMBER◄──────┘
            (junction)
            (FK: user_id)
            (FK: team_id)
            (FK: session_id)
                  │
                  │ N
                  │ 1
            ┌─────▼─────────────┐
            │ TEAM_PERFORMANCE  │
            │ (diversity_index, │
            │  performance_rating)
            └───────────────────┘
```

---

## 4. BUSINESS RULES & CONSTRAINTS

### 4.1 IPSATIVE SCORING CONSTRAINTS
```sql
-- Forced-choice ranking: all 4 ranks must be present per item
CHECK (
  (SELECT COUNT(DISTINCT rank_value) 
   FROM USER_RESPONSE 
   WHERE session_id = ? AND item_id = ?) = 4
)

-- Ipsative constraint: sum of raw scores = constant
CHECK (CE_raw + RO_raw + AC_raw + AE_raw = 120)

-- Method-induced negative correlation
-- Expected average correlation ≈ -0.33 among primary scales
```

### 4.2 NON-IPSATIVE COMBINATION SCORES
```sql
-- ACCE and AERO are independent (not ipsative)
-- Correlation between ACCE & AERO should be LOW (not -1.0)
-- KLSI 4.0: observed correlation = -0.09 (improvement from 3.1: -0.27)
```

### 4.3 LEARNING STYLE TYPE ASSIGNMENT
```sql
-- 9 Style Type Classification Logic
CREATE FUNCTION assign_learning_style(ACCE INT, AERO INT) 
RETURNS VARCHAR(20) AS $$
BEGIN
  IF ACCE < 6 AND AERO > 11 THEN RETURN 'Initiating';
  ELSIF ACCE < 6 AND AERO > 0 AND AERO < 12 THEN RETURN 'Experiencing';
  ELSIF ACCE < 6 AND AERO < 1 THEN RETURN 'Imagining';
  ELSIF ACCE > 5 AND ACCE < 15 AND AERO < 1 THEN RETURN 'Reflecting';
  ELSIF ACCE > 14 AND AERO < 1 THEN RETURN 'Analyzing';
  ELSIF ACCE > 14 AND AERO > 0 AND AERO < 12 THEN RETURN 'Thinking';
  ELSIF ACCE > 14 AND AERO > 11 THEN RETURN 'Deciding';
  ELSIF ACCE > 5 AND ACCE < 15 AND AERO > 11 THEN RETURN 'Acting';
  ELSIF ACCE > 5 AND ACCE < 15 AND AERO > 0 AND AERO < 12 THEN RETURN 'Balancing';
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### 4.4 LEARNING FLEXIBILITY INDEX COMPUTATION
```sql
-- Kendall's Coefficient of Concordance
CREATE FUNCTION compute_kendalls_w(context_scores JSON[]) 
RETURNS DECIMAL(5,4) AS $$
DECLARE
  m INT := 8;  -- number of contexts
  n INT := 4;  -- number of modes (CE, RO, AC, AE)
  sum_squares DECIMAL;
  W DECIMAL;
BEGIN
  -- Compute sum of squared deviations
  -- W = [12 * Σ(Rj - R̄)²] / [m² * (n³ - n)]
  -- where R̄ = m*(n+1)/2 = 8*5/2 = 20
  
  -- [Implementation details]
  
  RETURN W;
END;
$$ LANGUAGE plpgsql;

-- LFI Score
LFI = 1 - W
```

### 4.5 RELIABILITY & VALIDITY CONSTRAINTS
```sql
-- Internal Consistency (Cronbach's Alpha)
-- KLSI 4.0: Average α = 0.81
-- Individual scales: CE, RO, AC, AE all > 0.77

-- Test-Retest Reliability
-- Recommended interval: 5-8 weeks
-- Kappa coefficient for style type agreement

-- Concurrent Validity
-- KLSI 4.0 vs KLSI 3.1: average correlation = 0.92
```

---

## 5. INTEGRITAS REFERENSIAL

### 5.1 CASCADE DELETE RULES
```sql
-- User deletion cascades to all related sessions
ALTER TABLE ASSESSMENT_SESSION
  ADD CONSTRAINT fk_user
  FOREIGN KEY (user_id) 
  REFERENCES USER(user_id)
  ON DELETE CASCADE;

-- Session deletion cascades to all results
ALTER TABLE USER_RESPONSE
  ADD CONSTRAINT fk_session
  FOREIGN KEY (session_id)
  REFERENCES ASSESSMENT_SESSION(session_id)
  ON DELETE CASCADE;

-- Preserve normative data (no cascade)
ALTER TABLE NORMATIVE_CONVERSION_TABLE
  NO CASCADE DELETE;
```

### 5.2 UPDATE CONSTRAINTS
```sql
-- Scale scores cannot be modified after computation
ALTER TABLE SCALE_SCORE
  ADD CONSTRAINT immutable_scores
  CHECK (computed_at IS NOT NULL);

-- Response modifications tracked
UPDATE USER_RESPONSE
SET modified_count = modified_count + 1
WHERE response_id = ?;
```

---

## 6. INDEKS & OPTIMISASI

### 6.1 PRIMARY INDEXES
```sql
-- Performance optimization for lookups
CREATE INDEX idx_user_email ON USER(email);
CREATE INDEX idx_session_user ON ASSESSMENT_SESSION(user_id);
CREATE INDEX idx_session_status ON ASSESSMENT_SESSION(completion_status);
CREATE INDEX idx_response_session ON USER_RESPONSE(session_id);
CREATE INDEX idx_style_acce_aero ON USER_LEARNING_STYLE(ACCE_raw, AERO_raw);
```

### 6.2 COMPOSITE INDEXES
```sql
-- For learning style type queries
CREATE INDEX idx_combination_scores 
  ON COMBINATION_SCORE(ACCE_raw, AERO_raw);

-- For team performance analysis
CREATE INDEX idx_team_performance 
  ON TEAM_PERFORMANCE(team_id, assessment_date);
```

---

## 7. DATA VALIDATION RULES

### 7.1 INPUT VALIDATION
```sql
-- Age validation (teens and adults only)
CHECK (YEAR(CURRENT_DATE) - YEAR(date_of_birth) >= 13)

-- Rank validation (must be 1-4)
CHECK (rank_value BETWEEN 1 AND 4)

-- Raw score validation (observed ranges from normative sample)
CHECK (CE_raw BETWEEN 11 AND 44)
CHECK (RO_raw BETWEEN 11 AND 44)
CHECK (AC_raw BETWEEN 11 AND 44)
CHECK (AE_raw BETWEEN 11 AND 44)

-- Percentile validation
CHECK (CE_percentile BETWEEN 0 AND 100)
```

### 7.2 BUSINESS LOGIC VALIDATION
```sql
-- Session must have exactly 20 completed items
CREATE TRIGGER validate_session_completion
BEFORE UPDATE ON ASSESSMENT_SESSION
FOR EACH ROW
WHEN (NEW.completion_status = 'Completed')
EXECUTE FUNCTION check_response_count();

CREATE FUNCTION check_response_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(DISTINCT item_id) 
      FROM USER_RESPONSE 
      WHERE session_id = NEW.session_id) != 20 THEN
    RAISE EXCEPTION 'Session must have exactly 20 completed items';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 8. KEAMANAN & PRIVACY

### 8.1 DATA PRIVACY
```sql
-- PII (Personally Identifiable Information) protection
-- Encrypt sensitive fields
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE USER
  ALTER COLUMN email TYPE BYTEA USING pgp_sym_encrypt(email, 'secret_key');

-- Research data anonymization
CREATE VIEW anonymous_research_data AS
SELECT 
  session_id,
  age_group,
  gender,
  education_level,
  CE_raw, RO_raw, AC_raw, AE_raw,
  ACCE_raw, AERO_raw,
  style_name
FROM ASSESSMENT_SESSION
JOIN USER ON ...
JOIN USER_LEARNING_STYLE ON ...
-- Exclude: full_name, email, date_of_birth
```

### 8.2 ACCESS CONTROL
```sql
-- Role-based access
GRANT SELECT ON USER_LEARNING_STYLE TO researcher_role;
GRANT INSERT, UPDATE ON ASSESSMENT_SESSION TO test_administrator_role;
GRANT ALL ON NORMATIVE_CONVERSION_TABLE TO data_scientist_role;
```

---

## 9. SUMMARY STATISTIK MODEL

### 9.1 ENTITAS COUNT
- **Total Entitas**: 22
- **Core Assessment**: 10 entities
- **Learning Flexibility**: 4 entities
- **Team Learning**: 3 entities
- **Research/Validation**: 3 entities
- **Supporting Tables**: 2 entities

### 9.2 RELASI COUNT
- **One-to-One**: 6 relations
- **One-to-Many**: 12 relations
- **Many-to-Many**: 1 relation (Team-User)

### 9.3 DATA VOLUME ESTIMATES (N=10,423 users)
```
USER: 10,423 rows
ASSESSMENT_SESSION: ~15,000 rows (retest cases)
USER_RESPONSE: 15,000 × 20 items × 4 ranks = 1,200,000 rows
SCALE_SCORE: 15,000 rows
LEARNING_STYLE_TYPE: 9 rows (static reference)
NORMATIVE_CONVERSION_TABLE: 9 groups × 4 scales × ~35 scores = ~1,260 rows
```

---

## 10. VALIDASI AKADEMIK

### 10.1 THEORETICAL FOUNDATIONS
✅ **Experiential Learning Theory (Kolb 1984)**
- 4 learning modes: CE, RO, AC, AE
- 2 dialectic dimensions: AC-CE (grasping), AE-RO (transforming)
- Learning cycle: recursive spiral through modes

✅ **Psychometric Principles**
- Forced-choice ipsative format (Johnson et al. 1988)
- Scale comparability via percentile conversion (Barron 1996)
- Reliability: Cronbach's α = 0.81 (KLSI 4.0)
- Validity: concurrent, construct, external evidence

✅ **9 Learning Style Typology (Kolb & Kolb 2005)**
- Refinement dari original 4 types
- Based on empirical & clinical studies
- Cut-points: dividing distributions into thirds

✅ **Learning Flexibility Index (Sharma & Kolb 2010)**
- Kendall's W coefficient measurement
- Adaptive flexibility hypothesis
- 8 context-specific assessments

### 10.2 EMPIRICAL BASIS
✅ **Normative Sample (N=10,423)**
- Demographics: age, gender, education, occupation
- 7 specialized sub-groups (medical, law, etc.)
- International: 121 countries represented

✅ **Reliability Studies**
- Internal consistency: Table 3 (α ranges)
- Test-retest: Veres et al. 1991, Ruble & Stout 1991
- Kappa coefficients for style stability

✅ **Validity Studies**
- Internal: correlation studies (Table 7), factor analysis (Table 8)
- External: age (Figure 14), gender, education, educational specialization
- Concurrent: LSI 3.1, ASI, LSP, LSQ correlations
- Predictive: aptitude tests, academic performance

✅ **Team Learning Research**
- Wolfe 1977: heterogeneous teams perform better
- McMurray 1998: role assignment by learning mode
- Lingham 2004: conversational learning spaces
- Multiple studies supporting ELT in team contexts

---

## 11. CATATAN IMPLEMENTASI

### 11.1 CRITICAL BUSINESS RULES
1. **Forced-choice ranking**: user MUST rank all 4 options (1-4) untuk setiap item
2. **Ipsative constraint**: sum of primary raw scores = constant (120)
3. **Non-ipsative combination scores**: ACCE & AERO are independent
4. **9 style types**: based on percentile cut-points (33.33%, 66.67%)
5. **LFI computation**: Kendall's W from 8 context rankings
6. **Percentile conversion**: using normative reference group tables
7. **Reading level**: 7th grade (untuk accessibility)
8. **Age requirement**: 13+ years (teens and adults)

### 11.2 COMPUTATIONAL FORMULAS
```
Raw Scores:
  CE_raw = Σ(ranks for CE choices, items 1-12)
  RO_raw = Σ(ranks for RO choices, items 1-12)
  AC_raw = Σ(ranks for AC choices, items 1-12)
  AE_raw = Σ(ranks for AE choices, items 1-12)

Dialectic Scores:
  ACCE = AC_raw - CE_raw
  AERO = AE_raw - RO_raw
  ASSIMILATION_ACCOMMODATION = (AC+RO) - (AE+CE)
  CONVERGING_DIVERGING = (AC+AE) - (CE+RO)

Balance Scores:
  BALANCE_ACCE = ABS[AC - (CE + 9)]
  BALANCE_AERO = ABS[AE - (RO + 6)]

Learning Flexibility:
  W = [12 * Σ(Rj - R̄)²] / [m² * (n³ - n)]
  LFI = 1 - W
```

---

## REFERENSI DOKUMEN
Kolb, D. A., & Kolb, A. Y. (2011). *The Kolb Learning Style Inventory 4.0: Guide to Theory, Psychometrics, Research & Applications*. Experience Based Learning Systems, Inc.

**END OF ENTITY-RELATIONSHIP MODEL DOCUMENT**
