# KLSI 4.0 API & UI Sitemap

Dokumen ini memetakan:

1. **Sitemap API** (endpoint nyata FastAPI yang ada di `app/routers/`)
2. **Mental model domain & engine** (assessment → runtime → norms → report)
3. **Sitemap UI (frontend)** yang logis di atas API tersebut

Sumber utama (lebih dari 100 file) mencakup antara lain:

- Router: `app/routers/auth.py`, `sessions.py`, `engine.py`, `reports.py`, `teams.py`, `research.py`, `admin.py`, `score.py`
- Services: `app/services/scoring.py`, `score_preview.py`, `engine.py`, `report.py`, `rollup.py`, `validation.py`, `batch_scores.py`, `security.py`, `seeds.py`, `provenance.py`, `pipelines.py`
- Engine: `app/engine/runtime.py`, `runtime_logic.py`, `runtime_components.py`, `finalize.py`, `pipelines.py`, `registry.py`, `strategy_registry.py`, `norms/*`, `authoring/*`, `strategies/*`, `exceptions.py`, `validation.py`, `constants.py`, `interfaces.py`
- Assessments: `app/assessments/validators.py`, `constants.py`, `enums.py`, `klsi_v4/__init__.py`, `klsi_v4/config.yaml`, `klsi_v4/types.py`, `klsi_v4/calculations.py`, `klsi_v4/logic.py`, `klsi_v4/definition.py`
- DB layer: `app/db/database.py`, `db/repositories/*.py`, `db/README.md`
- Models: `app/models/klsi/**/*`, `app/models/engine.py`, `app/models/team.py`, `app/models/research.py`
- i18n: `app/i18n/__init__.py`, `id_messages.py`, `id_styles.py`, `id_messages.json`, `en_messages.json`, `id_styles.yaml`, `en_styles.yaml`, `i18n/README.md`
- Instruments & authoring: `app/instruments/klsi4/*.py`, `instrument.yaml`
- Core util: `app/core/config.py`, `logging.py`, `metrics.py`, `profiling.py`, `numeric.py`, `formatting.py`, `errors.py`, `sentinels.py`
- Data: `app/data/norms.py`, `session_designs.py`
- Entrypoint: `app/main.py`, `app/routers/exceptions.py`

---

## 1. API Sitemap (Backend)

### 1.1 Health & Root

- `GET /health`  
  - File: `app/main.py`  
  - Fungsi: health check, versi, waktu start, total request (via metrics & `_app_start_time`).

- `GET /`  
  - File: `app/main.py`  
  - Fungsi: root info sederhana (banner / metadata).

---

### 1.2 Auth (`app/routers/auth.py`)

- `POST /auth/register`
  - Body: `UserCreate`
    - Contoh:
      ```json
      {
        "full_name": "Budi Santoso",
        "email": "12345678@if.uns.ac.id",
        "password": "P@ssw0rd123",
        "nim": "12345678",
        "kelas": "IF-45",
        "tahun_masuk": 2022
      }
      ```
  - Logic:
    - Validasi domain mahasiswa (`settings.allowed_student_domain`) jika mengisi NIM.
    - Validasi NIM (8 digit), format kelas (`IF-\d+`), dan rentang `tahun_masuk`.
    - Role otomatis: `MAHASISWA` jika domain cocok, selain itu `MEDIATOR`.
    - Cek email unik via `UserRepository.get_by_email`.
    - Simpan user baru via `UserRepository.create` + `hash_password`.
  - Output: `UserOut` (id, full_name, email, role, profil dasar).

- `POST /auth/login`
  - Query params: `email`, `password`.
    - Contoh:
      ```http
      POST /auth/login?email=12345678@if.uns.ac.id&password=P@ssw0rd123
      ```
  - Logic:
    - Cari user via `UserRepository.get_by_email`.
    - Verifikasi password dengan `verify_password`.
    - Jika gagal → `401 INVALID_CREDENTIALS`.
    - Jika sukses → buat JWT via `create_access_token`.
  - Output: `Token`:
    ```json
    {
      "access_token": "<jwt>",
      "token_type": "bearer"
    }
    ```

**UI mental model:**

- Page: `/auth/register` (form lengkap mahasiswa/mediator).
- Page: `/auth/login` (email + password, kirim sebagai query params atau form wrapper ke endpoint di atas).
- State: simpan `access_token` dan kirim sebagai header `Authorization: Bearer <token>` untuk endpoint lain.

---

### 1.3 Legacy Session API (`app/routers/sessions.py`)

> Jalur legacy yang menempel langsung ke runtime KLSI, masih dipertahankan untuk kompatibilitas.

- `POST /sessions/start`
  - Header: `Authorization: Bearer <token>` (wajib).
  - Logic: resolve user via `get_current_user`, lalu `runtime.start_session(..., instrument_code="KLSI", instrument_version="4.0")`.
  - Output:
    ```json
    { "session_id": 123 }
    ```

- `GET /sessions/{session_id}/items`
  - Output: daftar item (12 learning-style + 8 konteks LFI) dengan bentuk:
    ```json
    [
      { "id": 1, "number": 1, "type": "LS", "stem": "Saya belajar terbaik ketika..." },
      { "id": 2, "number": 2, "type": "LS", "stem": "..." }
    ]
    ```

- `POST /sessions/{session_id}/submit_item` (deprecated)
  - Header: `Authorization` wajib.
  - Query/body: `item_id`, `ranks: { "<choice_id>": <rank> }`.
  - Behavior:
    - Jika `settings.disable_legacy_submission` dan env bukan dev/test → `410`.
    - Set header `Deprecation: true`, `Link: </sessions/{session_id}/submit_all_responses>; rel=successor-version`, opsional `Sunset`.
    - Payload di-validate ke `LegacyItemSubmissionPayload`, lalu `runtime.submit_payload`.

- `POST /sessions/{session_id}/submit_context` (deprecated)
  - Header: `Authorization` wajib.
  - Query params: `context_name`, `CE`, `RO`, `AC`, `AE`, `overwrite?`.
  - Validasi ke `LegacyContextSubmissionPayload`, disimpan sebagai `LFIContextScore` via `runtime.submit_payload`.

- `POST /sessions/{session_id}/submit_all_responses`
  - Header: `Authorization` wajib.
  - Body: `SessionSubmissionPayload`:
    ```json
    {
      "items": [
        {
          "item_id": 1,
          "ranks": { "101": 1, "102": 2, "103": 3, "104": 4 }
        }
      ],
      "contexts": [
        {
          "context_name": "Belajar di kelas",
          "CE": 1, "RO": 2, "AC": 3, "AE": 4
        }
      ]
    }
    ```
  - Behavior:
    - Loop `payload.items` → insert `UserResponse` langsung ke DB.
    - Loop `payload.contexts` → insert `LFIContextScore`.
    - `db.commit()` lalu jalankan `runtime.finalize_with_audit`.
  - Output ringkas:
    ```json
    {
      "ok": true,
      "result": {
        "ACCE": 10,
        "AERO": 5,
        "style_primary_id": 3,
        "LFI": 0.65,
        "delta": { "seconds": 0.12 },
        "percentile_sources": { "AC": "DB:EDU:University" },
        "validation": { "ready": true, "issues": [] },
        "override": false
      }
    }
    ```

- `POST /sessions/{session_id}/finalize`
  - Header: `Authorization` wajib.
  - Validasi dulu via `run_session_validations`; jika belum lengkap → `400` dengan `issues`.
  - Jika lengkap → `runtime.finalize_with_audit` dengan payload audit.
  - Output sama bentuknya dengan `submit_all_responses`.

- `GET /sessions/{session_id}/validation`
  - Auth opsional:
    - Jika ada token → boleh owner atau mediator.
    - Jika tidak ada token → read-only untuk sesi (tanpa proteksi user), hanya jika diizinkan use case internal.
  - Output: snapshot validasi dari `run_session_validations`.

- `POST /sessions/{session_id}/force_finalize`
  - Header: `Authorization` wajib, role harus `MEDIATOR`.
  - Body: `ForceFinalizeRequest`:
    ```json
    { "reason": "Sesi hampir lengkap tapi perlu dipaksa finalize" }
    ```
  - Behavior: skip validation (flag `skip_validation=True`) dan tetap tulis audit payload override.

**UI:**

- Flow mahasiswa:
  1. `/sessions/start` → redirect ke `/sessions/{id}/items`
  2. Halaman pengisian 12+8 item (wizard / form)
  3. Submit via `/sessions/{id}/submit_all_responses`
  4. Tombol “Selesaikan / Finalize” memanggil `/sessions/{id}/finalize`
  5. Redirect ke `/reports/{id}`

- Flow mediator:
  - Dapat memanggil `/sessions/{id}/force_finalize` untuk sesi bermasalah.

---

### 1.4 Generic Engine API (`app/routers/engine.py`)

> Lapisan engine generik di atas authoring spec + plugin; sudah aktif untuk KLSI 4.0.

#### Instruments & locale resources

- `GET /engine/instruments`
  - Header: `Authorization` wajib (user apa pun).
  - Output:
    ```json
    {
      "instruments": [
        {
          "code": "KLSI",
          "version": "4.0",
          "title": "Kolb Learning Style Inventory 4.0",
          "description": "...",
          "delivery": { "forced_choice": true, "sections": [...] }
        }
      ]
    }
    ```

- `GET /engine/instruments/{instrument_code}/{instrument_version}`
  - Output: `{ "instrument": spec.manifest() }` dengan detail lengkap manifest.

- `GET /engine/instruments/{instrument_code}/{instrument_version}/resources/{locale}`
  - Output: mapping resource i18n, misal:
    ```json
    {
      "locale": "id",
      "resources": {
        "items": { "1": "Saya belajar terbaik ketika..." },
        "contexts": { "C1": "Belajar di kelas" }
      }
    }
    ```

#### Engine sessions (generic)

- `POST /engine/sessions/start`
  - Header: `Authorization` wajib.
  - Body:
    ```json
    {
      "instrument_code": "KLSI",
      "instrument_version": "4.0"
    }
    ```
  - Output: `{ "session_id": 456 }`.

- `GET /engine/sessions/{session_id}/delivery`
  - Query: `locale` opsional (misal: `?locale=id`).
  - Output: delivery package lengkap (items + manifest + i18n) dari `EngineSessionService.delivery_package`.

- `POST /engine/sessions/{session_id}/submit_all`
  - Body: `SessionSubmissionPayload` (sama bentuk dengan legacy `submit_all_responses`).
  - Output:
    ```json
    {
      "ok": true,
      "result": {
        "ACCE": 10,
        "AERO": 5,
        "style_primary_id": 3,
        "LFI": 0.65,
        "delta": { "seconds": 0.12 },
        "percentile_sources": { "AC": "DB:EDU:University" },
        "validation": { "ready": true },
        "override": false
      }
    }
    ```

- `POST /engine/sessions/{session_id}/interactions`
  - Body: `SubmissionPayload`:
    ```json
    { "kind": "item", "item_id": 1, "ranks": { "101": 1, "102": 2, "103": 3, "104": 4 } }
    ```
  - Deprecated, hanya untuk kompatibilitas lama; meng-set header `Deprecation` dan `Link` ke `/engine/sessions/{id}/submit_all`.

- `POST /engine/sessions/{session_id}/finalize`
  - Barrel endpoint yang memanggil `EngineSessionService.finalize_session` (mirip submit_all + finalize).

- `GET /engine/sessions/{session_id}/report`
  - Output: report generik dari `EngineSessionService.build_report` (untuk KLSI isi identik dengan `/reports/{id}`).

- `POST /engine/sessions/{session_id}/force-finalize`
  - Body: `ForceFinalizeRequest { "reason": "..." }`.
  - Hanya mediator yang diizinkan (`get_current_user` + check `user.role`).

#### Engine metrics

- `GET /engine/metrics`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Query: `reset`, `include_last_runs`.
  - Output: `timings`, `counters`, `histograms`, dan opsional `last_runs`.

**UI:**

- Untuk masa depan multi-instrument:
  - `/engine/instruments` → halaman “Daftar Instrumen”.
  - `/engine/instruments/KLSI/4.0` → detail instrumen (metadata, contexts).
  - `/engine/sessions/start` → wizard generik.
  - `/engine/sessions/{id}` → form generik (menggunakan manifest `delivery` + `items`).
  - `/engine/sessions/{id}/report` → report generik, tergantung instrument plugin.

---

### 1.5 Laporan (Reports) (`app/routers/reports.py`)

- `GET /reports/{session_id}`
  - Header: `Authorization` opsional.
  - Aturan akses:
    - Tanpa token → tetap bisa, tetapi hanya jika use case internal mengizinkan (disarankan UI selalu kirim token).
    - Dengan token:
      - Jika `viewer.role == "MEDIATOR"` → dapat melihat sesi siapa pun dengan analytics penuh.
      - Jika mahasiswa dan `viewer.id != session.user_id` → `403 FORBIDDEN`.
  - Logic:
    - Ambil sesi via `SessionRepository.get_by_id`.
    - Jika tidak ada → `404 NOT_FOUND`.
    - Tentukan `viewer_role` (`"MEDIATOR"` atau `None`).
    - Panggil `build_report(db, session_id, viewer_role=viewer_role)`.
  - Output (kontrak API):
    - Response berupa JSON object (schema internal, tidak dibungkus `{ "ok": ... }`).
    - Struktur lengkap dibangun oleh `build_report` dan dapat bertambah field baru, tetapi nama kunci utama stabil di sekitar informasi sesi, skor, gaya, ruang belajar, meta-learning, dan narasi.

#### 1.5.1 Bentuk Ringkas Response Report (Ilustratif)

Catatan: contoh di bawah **bersifat ilustratif**, bukan definisi schema formal. Gunakan ini untuk desain UI, dan selalu cross-check ke response nyata API ketika mengimplementasikan frontend.

Untuk keperluan frontend, bentuk high-level response `GET /reports/{session_id}` dapat diasumsikan seperti ini (field dapat bertambah, tapi nama kunci utama stabil):

```json
{
  "session": {
    "id": 123,
    "user": {
      "id": 42,
      "full_name": "Budi Santoso",
      "role": "MAHASISWA"
    },
    "completed_at": "2025-01-01T10:00:00Z"
  },
  "scores": {
    "raw": { "CE": 28, "RO": 32, "AC": 36, "AE": 24 },
    "dialectic": { "ACCE": 8, "AERO": -4 },
    "lfi": { "score": 0.65, "band": "Moderate" },
    "balance": {
      "ACCE_distance": 3,
      "AERO_distance": 2,
      "ACCE_percentile": 70,
      "AERO_percentile": 68
    },
    "percentiles": {
      "CE": 55,
      "RO": 60,
      "AC": 70,
      "AE": 45,
      "ACCE": 62,
      "AERO": 58
    }
  },
  "style": {
    "primary": {
      "code": "ACCOMMODATING",
      "name": "Accommodating",
      "quadrant": "CE-AE"
    },
    "backup": [
      { "code": "DIVERGING", "name": "Diverging" }
    ]
  },
  "learning_space": {
    "ACCE": 8,
    "AERO": -4,
    "region": "Quadrant II"
  },
  "meta_learning": {
    "weakest_mode": "AC",
    "tips": [
      "Latih refleksi konseptual dengan menulis ringkasan teori.",
      "Diskusikan konsep dengan teman untuk menguatkan abstraksi."
    ]
  },
  "narrative": {
    "summary": "Anda cenderung belajar melalui pengalaman konkret dan eksperimen aktif...",
    "educator_recommendations": [
      "Gunakan aktivitas pengalaman langsung dalam pembelajaran.",
      "Sediakan ruang refleksi setelah eksperimen."
    ]
  }
}
```

Frontend sebaiknya hanya mengandalkan nama-nama kunci besar (`session`, `scores`, `style`, `learning_space`, `meta_learning`, `narrative`) dan tidak mengasumsikan bahwa subfield kecil tidak akan bertambah di masa depan.

**UI:**

- Halaman `/reports/{session_id}`:
  - Panel: “Ringkasan Gaya Belajar” (primary style, intensity, quadrant)
  - Panel: “Distribusi Mode & Dialektik” (CE/RO/AC/AE, ACCE/AERO)
  - Panel: “Learning Flexibility Index” (LFI score, tertiles, narrative)
  - Panel: “Norma & Persentil” (per mode + ACCE/AERO + heuristik BALANCE)
  - Panel (role MEDIATOR): analytics tambahan, heatmap, rekomendasi edukator, session designs.
  - Bantuan: icon/help drawer yang memuat ringkasan singkat + link ke `student_profile.<locale>.md` untuk mahasiswa dan `educator_responsible_use.<locale>.md` untuk mediator.

---

### 1.6 Skor “Preview” tanpa DB (`app/routers/score.py`)

- `POST /score/raw`
  - Body: `ScorePreviewRequest`:
    ```json
    {
      "raw": {
        "CE_raw": 28,
        "RO_raw": 32,
        "AC_raw": 36,
        "AE_raw": 24
      },
      "contexts": [
        { "context_name": "Belajar di kelas", "CE": 1, "RO": 2, "AC": 3, "AE": 4 }
      ]
    }
    ```
  - Logic: `build_score_preview`:
    - Hitung ACCE/AERO, LFI, gaya belajar, percentil (menggunakan fallback Appendix bila perlu).
  - Output: `ScorePreviewResponse` dengan struktur skor lengkap, tanpa menyentuh DB.

**Use-case UI:**

- Halaman / tool untuk dosen / peneliti:
  - Form manual: input CE/RO/AC/AE + 8 konteks → klik “Preview” → lihat grafik & rekomendasi tanpa menyimpan ke DB.

---

### 1.7 Tim & Kelas (`app/routers/teams.py`)

- `POST /teams`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Body: `TeamCreate`:
    ```json
    { "name": "IF-45A", "kelas": "IF-45", "description": "Kelas A 2022" }
    ```
  - Output: `TeamOut` (id, name, kelas, description, timestamps).

- `GET /teams`
  - Query: `skip=0`, `limit=50`, `q` opsional (pencarian nama).
  - Output: list `TeamOut`.

- `GET /teams/{team_id}`
  - Output: `TeamOut` atau `404` jika tidak ditemukan.

- `PATCH /teams/{team_id}`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Body: `TeamUpdate` (semua field opsional).
  - Behavior: validasi nama unik; update field yang di-set.
  - Output: `TeamOut` terbaru.

- `DELETE /teams/{team_id}`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Behavior: cek anggota & rollup via repo; jika ada → `409 REMOVE_DEPENDENCIES_FIRST`.
  - Output: `{ "ok": true }` jika sukses.

- `GET /teams/{team_id}/members`
  - Output: list `TeamMemberOut`.

- `POST /teams/{team_id}/members`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Body: `TeamMemberAdd`:
    ```json
    { "user_id": 42, "role_in_team": "MAHASISWA" }
    ```
  - Output: `TeamMemberOut`.

- `DELETE /teams/{team_id}/members/{member_id}`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Output: `{ "ok": true }` jika anggota ditemukan dan dihapus.

- `GET /teams/{team_id}/rollups`
  - Output: list `TeamRollupOut` (tanggal, total_sessions, avg_lfi, distribusi gaya, dsb.).

- `POST /teams/{team_id}/rollup/run`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Query: `for_date` opsional dalam format `YYYY-MM-DD`.
  - Behavior: panggil `compute_team_rollup`, commit ke DB, kembalikan row.
  - Output: `TeamRollupOut`.

**UI:**

- `/teams` (list) – untuk mediator:
  - Tabel tim (nama, kelas, deskripsi, jumlah anggota, quick stats).
- `/teams/{id}`:
  - Tab: “Anggota” (CRUD membership)
  - Tab: “Rollup Harian / Mingguan” (grafik total_sessions, avg_lfi, style_counts)
  - Tombol: “Run Rollup” → memanggil `/teams/{id}/rollup/run`.

---

### 1.8 Research (`app/routers/research.py`)

Repositori: `ResearchStudyRepository`, `ReliabilityRepository`, `ValidityRepository`.

- `POST /research/studies`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Body: `ResearchStudyCreate` (judul, deskripsi, populasi, dsb.).
  - Output: `ResearchStudyOut`.

- `GET /research/studies`
  - Query: `skip`, `limit`, `q` untuk pencarian.
  - Output: list `ResearchStudyOut`.

- `GET /research/studies/{study_id}`
  - Output: `ResearchStudyOut` atau `404`.

- `PATCH /research/studies/{study_id}`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Body: `ResearchStudyUpdate`.
  - Output: `ResearchStudyOut` setelah diupdate.

- `DELETE /research/studies/{study_id}`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Behavior: jika ada nilai reliabilitas/validitas terkait → `409 REMOVE_EVIDENCE_FIRST`.
  - Output: `{ "ok": true }`.

- `POST /research/studies/{study_id}/reliability`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Body: `ReliabilityCreate` (metric_name, value, notes, dsb.).
  - Output (simplified dict): `{ "id": <int>, "metric_name": <str>, "value": <float> }`.

- `GET /research/studies/{study_id}/reliability`
  - Output: list objek `{ id, metric_name, value, notes }`.

- `POST /research/studies/{study_id}/validity`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Body: `ValidityCreate` (evidence_type, metric_name, value, description).
  - Output: `{ "id": <int>, "evidence_type": <str> }`.

- `GET /research/studies/{study_id}/validity`
  - Output: list objek `{ id, evidence_type, metric_name, value, description }`.

**UI:**

- `/research/studies`:
  - Daftar studi (judul, periode, keterangan, jumlah bukti reliabilitas/validitas).
- `/research/studies/{id}`:
  - Tab: “Detail Studi”
  - Tab: “Reliabilitas” (list Cronbach α, dsb)
  - Tab: “Validitas” (korelasi, kriteria, dsb)

---

### 1.9 Admin & Norms (`app/routers/admin.py`)

- `POST /admin/norms/import`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Query: `norm_group`, `norm_version` (default `"default"`).
  - File upload: CSV dengan header tepat `scale_name,raw_score,percentile`.
  - Behavior:
    - Validasi nama group & version (panjang, non-empty).
    - Baca CSV, grup per scale_name, sort by raw_score, cek monotonik percentil.
    - Upsert ke `NormativeConversionRepository` dalam transaksi.
    - Tambah `AuditLog` dengan hash batch.
    - Invalidate cache via `build_composite_norm_provider`, `clear_norm_db_cache`, `clear_percentile_cache`.

- `GET /admin/norms/cache-stats`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Output: `{"cache": ..., "preload": ...}` dari `norm_cache_stats` + `preload_cache_stats`.

- `GET /admin/norms/external-cache-stats`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Jika `external_norms_enabled` false → `{ "enabled": false, "message": ... }`.
  - Jika true → kembalikan metrik cache eksternal via `external_cache_stats`.

- `GET /admin/perf-metrics`
  - Header: `Authorization` wajib, role `MEDIATOR`.
  - Query: `reset` opsional.
  - Output: `timings`, `counters`, `norm_db_cache`, `external_norm_cache`, `norm_preload`, `toggles` (environment & flags legacy).

- Pipeline management:
  - `GET /admin/instruments/{instrument_code}/pipelines`
  - `POST /admin/instruments/{instrument_code}/pipelines/{pipeline_id}/activate`
  - `POST /admin/instruments/{instrument_code}/pipelines/{pipeline_id}/clone`
    - Body: `ClonePipelineRequest { version, pipeline_code?, description?, metadata? }`.
  - `DELETE /admin/instruments/{instrument_code}/pipelines/{pipeline_id}`

**UI:**

- `/admin/norms`:
  - Upload CSV, lihat grup/version yang ada, lihat cache stats, tombol “Clear cache”.
- `/admin/pipelines`:
  - List pipeline per instrument, versi, aktif/tidak, nodes detail (lihat `services/pipelines.list_pipelines`).

---

## 2. Mental Model Domain & Engine

### 2.1 Domain objek utama

- User (`models/klsi/user.py`)
- AssessmentSession (`models/klsi/assessment.py`)
- Item & UserResponse (`models/klsi/items.py`)
- ScaleScore & CombinationScore (`models/klsi/learning.py`)
- LearningStyleType & UserLearningStyle (+ BackupLearningStyle)
- LFIContextScore & LearningFlexibilityIndex
- PercentileScore & NormativeConversionTable
- Team & Team rollup
- ResearchStudy & ReliabilityResult & ValidityEvidence
- Engine-specific:
  - Instrument, ScoringPipeline, ScoringPipelineNode
  - EngineInstrument, EngineForm, EnginePage, EngineItem, EngineScoringRule (eksperimen future DSL)

### 2.2 Engine runtime

- `EngineRuntime` (`app/engine/runtime.py`):
  - start_session → membuat `AssessmentSession`
  - delivery_package → gunakan plugin `InstrumentPlugin` + authoring spec
  - submit_payload / finalize / finalize_with_audit
- Registries:
  - `AssessmentRegistry` & `EngineRegistry` (`engine/registry.py`)
  - `StrategyRegistry` (`engine/strategy_registry.py`)
- Pipelines:
  - `PipelineDefinition`, `StageDefinition` (`engine/pipelines.py`)
  - `KLSI_STAGE_DEFINITIONS`, `KLSI_PIPELINE_CONFIG`
- Norms:
  - DB lookups (LRU) → `_make_cached_db_lookup`
  - Preload (`_maybe_build_preloaded_map`)
  - Lazy loader (`LazyNormLoader`)
  - Composite providers (`DatabaseNormProvider`, `AppendixNormProvider`, `ExternalNormProvider`, `CachedCompositeNormProvider`, `InMemoryNormRepository`).
- Authoring:
  - `InstrumentSpec` (`engine/authoring/spec.py` + YAML)
  - Registry: `authoring/registry.py`
  - KLSI instrument spec: `app/instruments/klsi4`.

### 2.3 Psychometrics

Sesuai `docs/psychometrics_spec.md` & constants:

- Ipsative ranks: `validators.validate_ipsative_ranks`, `services/validation`
- Mode totals: `aggregate_mode_scores`, `ScoreVector`
- Dialectics & balance: `calculate_combination_metrics`, `CombinationMetrics`
- Style windows & codes: `KLSIParameters.style_windows`, `STYLE_CUTS`, DB `LearningStyleType`
- LFI: `compute_kendalls_w`, `compute_lfi`, `LearningFlexibilityIndex`
- Norm precedence: `resolve_norm_groups` (EDU → COUNTRY → AGE → GENDER → Total → Appendix/external)
- Fallback & provenance: `PercentileScore` + `services/provenance.upsert_scale_provenance`

---

## 3. UI Sitemap (Frontend)

Berbasis API di atas, berikut sitemap UI yang disarankan.

### 3.1 Public / Landing

- `/` – Landing page
  - Intro KLSI 4.0
  - Tombol: “Masuk Mahasiswa”, “Masuk Mediator”, “Dokumentasi”

- `/docs` – Link ke dokumentasi (termasuk `docs/`, SITEMAP ini, panduan ELT).

### 3.2 Auth

- `/auth/register`
- `/auth/login`

### 3.3 Mahasiswa Dashboard

- `/me`
  - Ringkasan akun
  - Link: “Mulai Asesmen KLSI 4.0”
  - Riwayat sesi (list `AssessmentSession` user)

- `/sessions/new`
  - Memanggil `/sessions/start` atau `/engine/sessions/start`
  - Redirect ke `/sessions/{id}/fill`

- `/sessions/{id}/fill`
  - Stepper 1–12 item gaya belajar
  - Stepper 13–20 konteks LFI
  - Validasi sisi klien sesuai `schemas/session.py`
  - Submit ke `/sessions/{id}/submit_all_responses`
  - Tautkan bantuan “Cara mengisi dengan benar” → fetch `/static/guides/student_profile.<locale>.md` untuk menampilkan ringkasan di drawer

- `/sessions/{id}/review`
  - Tampilkan ringkasan jawaban + hasil validasi (GET `/sessions/{id}/validation`)
  - Tombol “Finalize” → POST `/sessions/{id}/finalize`

- `/reports/{id}`
  - Render hasil lengkap (skor, gaya, LFI, tips belajar).
  - Trigger telemetry ketika panel bantuan dibuka (`POST /telemetry/guide-open`).

### 3.4 Mediator Dashboard

- `/mediator`
  - Overview: jumlah peserta, distribusi gaya global, rata-rata LFI.

- `/mediator/sessions`
  - Pencarian sesi berdasar user, kelas, tanggal
  - Aksi:
    - Buka report `/reports/{id}`
    - `force_finalize` bila status tidak lengkap tapi dibutuhkan.
  - CTA bantuan mediator membuka `educator_responsible_use.<locale>.md` dan mencatat telemetry.

- `/teams`
  - Daftar tim / kelas.
  - `/teams/{id}`:
    - Tab “Profil”: info tim
    - Tab “Anggota”: tambahkan / hapus anggota (via `/teams/{id}/members`)
    - Tab “Rollup”: panggil `/teams/{id}/rollups` & `/teams/{id}/rollup/run`, tampilkan grafik.

- `/research`
  - `/research/studies`
  - `/research/studies/{id}` dengan tab “Reliabilitas” & “Validitas”.

### 3.5 Admin / Norm & Engine

- `/admin`
  - Card:
    - “Normative Data”
    - “Pipelines”
    - “Engine metrics”

- `/admin/norms`
  - Upload CSV → `/admin/norms/import`
  - Lihat cache & preload stats → `/admin/norms/cache-stats`, `/admin/norms/external-cache-stats`

- `/admin/pipelines`
  - Pilih instrument (KLSI)
  - Lihat pipeline list → `/admin/instruments/KLSI/pipelines`
  - Aksi:
    - Activate pipeline
    - Clone pipeline
    - Delete pipeline

- `/admin/metrics`
  - Integrasi `engine/metrics` + `admin/perf-metrics` untuk melihat:
    - Latency finalize
    - Norm lookup profiling
    - Pipeline timing, histogram (bucket ms)

### 3.6 Tools & Utilities

- `/tools/score-preview`
  - Form manual `ScorePreviewRequest` → call `/score/raw`
  - Visualisasi predicted LFI curve.

- `/tools/diagnostics`
  - Menampilkan `percentile_scores.norm_provenance`, `scale_provenance` untuk session tertentu (via laporan / endpoint khusus di masa depan).

---

## 4. Hubungan Endpoint ↔ Layer

Diagram kasar layer terhadap endpoint:

- Routers (`app/routers/*`):
  - Auth → `services/security`, `db.repositories.user`
  - Sessions/Engine → `services/engine`, `engine.runtime`, `engine.finalize`, `assessments/klsi_v4/*`
  - Reports → `services/report`
  - Teams → `db.repositories.team`, `services/rollup`
  - Research → `db.repositories.research`
  - Admin → `db.repositories.normative`, `engine.norms.factory`, `assessments/klsi_v4.logic`, `core.metrics`

- Services:
  - `scoring`, `score_preview`, `validation`, `regression`, `provenance`, `batch_scores` menyediakan lapisan domain di atas models.

- Engine:
  - `runtime` orchestrates
  - `pipelines`, `finalize` implement pipeline semantics & atomicity
  - `norms/*` handle norm lookup stack & caching

Frontend sebaiknya memanfaatkan struktur ini dengan:

- **Satu service layer di FE** memetakan tiap kelompok endpoint (`authService`, `sessionService`, `engineService`, `teamService`, `researchService`, `adminService`).
- **State global** untuk:
  - `currentUser` (decoded JWT minimal: id, role)
  - `currentSession` (id, status)
  - `normSettings` (untuk menampilkan info normative group yang digunakan – bisa dari report payload)
- **Route guard** untuk MEDIATOR vs MAHASISWA berdasarkan role.

---

Dokumen ini bisa dikembangkan lagi dengan:

- Menambahkan contoh payload nyata per endpoint (snapshot dari test / dev).
- Menautkan ke `docs/psychometrics_spec.md`, `docs/17-architecture-engine.md`, dan DB ERD (`docs/er_model.md`) agar FE dan BE tim punya referensi tunggal.