"""Localized Indonesian message constants used across routers/services.

This module centralizes all Indonesian text constants to support:
- Consistent localization across the application
- Easy maintenance and translation updates
- Single source of truth for user-facing messages
- Locale fallback validation (ensures no untranslated strings)
"""


class DomainErrorMessages:
    """Base domain error default messages."""

    DOMAIN_ERROR: str = "Terjadi kesalahan domain"
    VALIDATION_ERROR: str = "Data tidak valid"
    INVALID_ASSESSMENT_DATA: str = "Data asesmen tidak valid"
    PERMISSION_DENIED: str = "Akses ditolak"
    NOT_FOUND: str = "Resource tidak ditemukan"
    CONFLICT: str = "Terjadi konflik state"
    CONFIGURATION_ERROR: str = "Konfigurasi sistem tidak valid"


class SessionErrorMessages:
    """Session-related error messages for localization consolidation."""

    ACCESS_DENIED: str = "Akses sesi ditolak"
    FORBIDDEN: str = "Akses ditolak"
    NOT_FOUND: str = "Sesi tidak ditemukan"
    NOT_FOUND_WITH_ID: str = "Session {session_id} tidak ditemukan"
    ALREADY_COMPLETED: str = "Sesi sudah selesai"
    BATCH_FAILURE: str = "Gagal memproses submisi batch"
    LEGACY_ENDPOINT_DEPRECATED: str = "Endpoint sudah tidak berlaku. Gunakan /sessions/{session_id}/submit_all_responses."
    MEDIATOR_OVERRIDE_FORBIDDEN: str = "Hanya mediator yang dapat melakukan override"
    INCOMPLETE_ITEMS: str = "12 item gaya belajar belum terpenuhi"


class ValidationMessages:
    """Validation feedback texts for session completion checks."""

    ITEMS_INCOMPLETE: str = "Masih ada item gaya belajar yang belum memiliki peringkat lengkap 1..4."
    ITEM_RANK_GAPS: str = "Beberapa item memiliki peringkat yang tidak lengkap atau duplikat."
    ITEM_RANK_CONFLICT: str = "Terdapat ranking duplikat pada item forced-choice."
    LFI_CONTEXT_COUNT: str = "Konteks LFI harus lengkap {expected} entri."
    LFI_CONTEXT_UNKNOWN: str = "Ada nama konteks LFI yang tidak dikenal."
    LFI_CONTEXT_DUPLICATE: str = "Terdapat konteks LFI yang diisi lebih dari sekali."
    ITEM_RANK_COUNT: str = "Item harus memiliki tepat 4 pilihan dengan ranking"
    ITEM_RANK_PERMUTATION: str = "Ranking item harus merupakan permutasi [1,2,3,4]"
    CONTEXT_RANK_PERMUTATION: str = "Ranking konteks LFI harus permutasi [1,2,3,4]"
    DUPLICATE_ITEM_IDS: str = "Item ID duplikat dalam payload batch"
    DUPLICATE_CONTEXT_NAMES: str = "Nama konteks LFI duplikat dalam payload batch"
    CONTEXT_RANK_UNIQUE: str = "Setiap konteks harus menggunakan peringkat unik 1..4"
    CONTEXT_COUNT_REQUIRED: str = "Jumlah konteks harus tepat 8"


class BatchPayloadMessages:
    """Validation texts for batch submission payload issues."""

    MISSING_ITEMS: str = "Payload batch tidak memuat seluruh item gaya belajar yang wajib diisi"
    UNKNOWN_ITEMS: str = "Payload batch mengandung item yang tidak dikenal"
    UNKNOWN_CONTEXTS: str = "Payload batch mengandung nama konteks LFI yang tidak dikenali"


class TeamMessages:
    """Team management messages for routers/services."""

    NAME_EXISTS: str = "Nama tim sudah digunakan"
    NOT_FOUND: str = "Tim tidak ditemukan"
    REMOVE_DEPENDENCIES_FIRST: str = "Hapus anggota/rollup terlebih dahulu"
    MEMBER_EXISTS: str = "Pengguna sudah menjadi anggota tim"
    MEMBER_NOT_FOUND: str = "Anggota tidak ditemukan"
    INVALID_DATE_FORMAT: str = "Format tanggal harus YYYY-MM-DD"


class ResearchMessages:
    """Research study management messages for routers/services."""

    NOT_FOUND: str = "Studi tidak ditemukan"
    REMOVE_EVIDENCE_FIRST: str = "Hapus bukti reliabilitas/validitas terlebih dahulu"


class AuthMessages:
    """Authentication flow error messages."""

    INVALID_STUDENT_DOMAIN: str = "Domain email mahasiswa tidak valid untuk NIM"
    INVALID_NIM: str = "NIM harus 8 digit"
    INVALID_CLASS_FORMAT: str = "Format kelas harus IF-<nomor>"
    INVALID_ENROLLMENT_YEAR: str = "Tahun masuk tidak valid"
    EMAIL_ALREADY_REGISTERED: str = "Email sudah terdaftar"
    INVALID_CREDENTIALS: str = "Kredensial salah"


class AdminMessages:
    """Administration-specific Indonesian messages."""

    FILE_MUST_BE_CSV: str = "File harus CSV"
    NORM_GROUP_REQUIRED: str = "norm_group wajib diisi"
    NORM_GROUP_MAX_LENGTH: str = "norm_group maksimal 150 karakter"
    NORM_VERSION_MAX_LENGTH: str = "norm_version maksimal 40 karakter"
    CSV_HEADER_INVALID: str = "Header CSV harus scale_name,raw_score,percentile"
    ROW_FORMAT_INVALID: str = "Format baris tidak valid: {row}"
    PERCENTILE_NOT_MONOTONIC: str = (
        "Percentile tidak monotonic untuk skala {scale_name} pada raw {raw_score}"
    )
    EXTERNAL_NORMS_DISABLED: str = "Norma eksternal tidak diaktifkan"


class AuthorizationMessages:
    """Authorization-related Indonesian messages."""

    MEDIATOR_REQUIRED: str = "Hanya MEDIATOR yang diperbolehkan"
    MEDIATOR_NORM_IMPORT_ONLY: str = "Hanya MEDIATOR yang boleh impor norma"
    MEDIATOR_CACHE_STATS_ONLY: str = "Hanya MEDIATOR yang boleh melihat statistik cache"
    MEDIATOR_EXTERNAL_CACHE_STATS_ONLY: str = (
        "Hanya MEDIATOR yang boleh melihat statistik cache eksternal"
    )
    MEDIATOR_METRICS_ONLY: str = "Hanya MEDIATOR yang boleh melihat metrics"
    MEDIATOR_PIPELINE_ACCESS_ONLY: str = "Hanya MEDIATOR yang boleh mengakses pipeline"
    MEDIATOR_PIPELINE_MUTATION_ONLY: str = "Hanya MEDIATOR yang boleh mengubah pipeline"


class PipelineMessages:
    """Pipeline service messages reused across admin endpoints."""

    INSTRUMENT_NOT_FOUND: str = "Instrumen tidak ditemukan"
    PIPELINE_NOT_FOUND: str = "Pipeline tidak ditemukan"
    VERSION_EXISTS: str = "Versi pipeline sudah ada"
    CANNOT_DELETE_ACTIVE: str = "Tidak dapat menghapus pipeline aktif"


class EngineMessages:
    """Engine service and router localization constants."""

    MANIFEST_NOT_FOUND: str = "Instrument manifest tidak ditemukan"
    MANIFEST_NOT_CONFIGURED: str = "Instrument manifest belum dikonfigurasi"
    LOCALE_RESOURCE_NOT_FOUND: str = "Resource locale tidak ditemukan"
    PLUGIN_NOT_REGISTERED: str = "Instrument plugin belum terdaftar di engine"
    FINALIZE_FAILED: str = "Gagal menyelesaikan sesi"
    DEPENDENCY_NOT_AVAILABLE: str = "Dependency '{dep}' belum tersedia untuk step '{step}'"
    PIPELINE_NO_NODES: str = "Pipeline tidak memiliki node yang dapat dieksekusi"
    PIPELINE_UNSUPPORTED_NODE_KEY: str = "Pipeline mengandung node_key yang tidak didukung"


class AuthoringMessages:
    """Authoring spec validation messages."""

    DELIVERY_OBJECT_REQUIRED: str = "delivery section harus berupa objek"
    RESPONSE_MODEL_OBJECT_REQUIRED: str = "response model harus berupa objek"
    RESPONSE_MODEL_TYPE_REQUIRED: str = "response model membutuhkan field 'type'"
    RESPONSE_MODEL_OPTIONS_OBJECT: str = "response model options harus berupa objek"
    LOCALE_RESOURCE_OBJECT: str = "setiap locale resource harus berupa objek"
    LOCALE_RESOURCE_CODE_REQUIRED: str = "locale resource membutuhkan 'code'"
    LOCALE_RESOURCE_FILE_REQUIRED: str = "locale resource membutuhkan 'file'"
    LOCALE_RESOURCE_FILE_STRING: str = "locale resource 'file' harus berupa string"
    LOCALE_RESOURCE_FILE_NOT_FOUND: str = "File resource locale tidak ditemukan: {path}"
    LOCALE_RESOURCE_LOOKUP_FAILED: str = "Locale resource tidak ditemukan: {locale}"
    INSTRUMENT_SPEC_OBJECT_REQUIRED: str = "instrument spec harus berupa objek"
    INSTRUMENT_SECTION_REQUIRED: str = "Bagian 'instrument' wajib ada"
    INSTRUMENT_CODE_VERSION_REQUIRED: str = "Instrument membutuhkan 'code' dan 'version'"
    INSTRUMENT_SPEC_NOT_FOUND: str = "Instrument spec tidak ditemukan: {path}"
    RESPONSE_MODELS_OBJECT_REQUIRED: str = "response_models harus berupa objek"
    REGISTRY_OBJECT_REQUIRED: str = "registry harus berupa objek"
    REGISTRY_VALUE_STRING_REQUIRED: str = "registry.{key} harus berupa string"
    BRANCHING_OBJECT_REQUIRED: str = "branching harus berupa objek"
    RESOURCES_OBJECT_REQUIRED: str = "resources harus berupa objek"
    RESOURCES_LOCALES_ARRAY_REQUIRED: str = "resources.locales harus berupa array"
    COMPONENT_PATH_INVALID: str = "Dotted path tidak valid: {path}"
    COMPONENT_NOT_FOUND: str = "Komponen '{component}' tidak ditemukan"


class SecurityMessages:
    """Security and authentication header messages."""

    MISSING_AUTH_HEADER: str = "Header Authorization tidak ditemukan"
    INVALID_AUTH_HEADER: str = (
        "Format Authorization tidak valid. Gunakan Bearer <token>"
    )
    INVALID_TOKEN_PAYLOAD: str = "Payload token tidak valid"
    DB_SESSION_REQUIRED: str = "Sesi database tidak tersedia"
    USER_NOT_FOUND: str = "Pengguna tidak ditemukan"
    TOKEN_MISSING_SUB: str = "Token tidak memiliki klaim 'sub' (identifier pengguna)"
    INVALID_JWT_TOKEN: str = "Token JWT tidak valid: {detail}"
    TOKEN_VALIDATION_FAILED: str = "Validasi token gagal: {detail}"


class KLSI4Messages:
    """Instrument-specific localization for KLSI 4.0 plugin."""

    UNKNOWN_PAYLOAD_KIND: str = "Jenis payload tidak dikenal"
    UNKNOWN_SCALE: str = "Skala tidak dikenal untuk KLSI4"
    SESSION_NOT_FOUND: str = "Session tidak ditemukan"
    ITEM_AND_RANKS_REQUIRED: str = "item_id dan ranks wajib diisi"
    ITEM_ID_NUMERIC: str = "item_id harus numerik"
    RANKS_MUST_BE_OBJECT: str = "ranks harus berupa objek"
    CHOICE_AND_RANK_NUMERIC: str = "Pilihan dan peringkat harus numerik"
    RANKS_MUST_BE_UNIQUE: str = "Harus mengandung peringkat 1,2,3,4 masing-masing sekali"
    CHOICES_MISMATCH: str = "Pilihan tidak cocok dengan item"
    CONTEXT_NAME_REQUIRED: str = "context_name wajib string"
    CONTEXT_NAME_UNKNOWN: str = "Context name tidak dikenal"
    CONTEXT_RANKS_REQUIRED: str = "Semua peringkat konteks wajib diisi"
    CONTEXT_RANKS_NUMERIC: str = "Semua peringkat konteks harus numerik"
    CONTEXT_RANKS_UNIQUE: str = "Context ranks harus kombinasi unik 1..4"
    CONTEXT_ALREADY_SUBMITTED: str = "Konteks ini sudah dinilai. Hubungi mediator untuk koreksi."
    BOOLEAN_NOT_ALLOWED: str = "Nilai boolean tidak diperbolehkan"
    FLOAT_MUST_BE_INTEGER: str = "Nilai float harus ekuivalen dengan bilangan bulat"
    INTEGER_COMPATIBLE_REQUIRED: str = "Nilai harus berupa tipe numerik yang dapat dikonversi ke integer"


class ReportMessages:
    """Localized texts for report generation and enhanced analytics."""

    SESSION_NOT_FOUND: str = "Session tidak ditemukan"
    ENHANCED_CONTEXT_ERROR: str = "Diharapkan tepat 8 konteks LFI, ditemukan {found}"
    ENHANCED_CONTEXT_MESSAGE: str = (
        "Analitik LFI lanjutan tidak tersedia. Pengguna harus menyelesaikan seluruh 8 pemeringkatan konteks."
    )
    INTEGRATIVE_DEV_INTERPRETATION: str = (
        "Skor Perkembangan Integratif diprediksi: {score:.1f} (M=19.4, SD=3.5, rentang tipikal 13-26). "
        "LFI (β=0.25**) adalah prediktor terkuat dari perkembangan integratif, menunjukkan bahwa pembelajar "
        "fleksibel menunjukkan pemikiran integratif tingkat tinggi. Ini mengonfirmasi Hypothesis 6: fleksibilitas "
        "belajar secara positif terkait dengan tahapan perkembangan dewasa yang lebih tinggi (ego development, "
        "self-direction, integrative complexity)."
    )
    INTEGRATIVE_MODEL_INFO: str = "Hierarchical Regression Model 1 (N=169, R²=0.13, Adj. R²=0.10)"
    DEVELOPMENT_DISCLAIMER: str = (
        "Klasifikasi tahap perkembangan ini bersifat heuristik (bukan diagnosis). Didasarkan pada pola dialektika, "
        "fleksibilitas, dan intensitas gaya; gunakan sebagai pemicu refleksi, bukan label tetap."
    )
    FLEXIBILITY_NOTE_DEFAULT: str = (
        "Pertahankan keseimbangan aksi–refleksi dan pengalaman–konsep; sediakan ruang aman namun menantang untuk "
        "percakapan bermakna."
    )


class ReportDevelopmentLabels:
    """Labels for ELT spiral development stages."""

    ACQUISITION: str = "Tahap Akuisisi"
    SPECIALIZATION: str = "Tahap Spesialisasi"
    INTEGRATION: str = "Tahap Integrasi"


class ReportDeepLearningLabels:
    """Labels for depth-of-learning descriptors."""

    INTEGRATIVE: str = "Integratif"
    INTERPRETATIVE: str = "Interpretatif"
    REGISTRATIVE: str = "Registratif"


class ReportBalanceMessages:
    """Strings related to balance percentile explanations."""

    NOTE: str = (
        "BALANCE percentiles bersifat turunan teoritis dari jarak ke pusat normatif (ACCE≈9, AERO≈6); ini bukan persentil normatif populasi."
    )


class ReportAnalyticsMessages:
    """Narratives for analytics blocks."""

    ACC_ASSM_PEAK_NOTE: str = (
        "Kurva fleksibilitas belajar (LFI) terhadap indeks akomodasi-asimilasi menunjukkan bentuk U-terbalik: meningkat menuju titik seimbang kemudian menurun tajam pada ekstrem yang sangat asimilatif (internalisasi tinggi tanpa penyeimbang eksternal)."
    )


class ReportNotesMessages:
    """Footer notes explaining psychometric terms."""

    PSYCHOMETRIC_TERMS: str = (
        "Istilah seperti ACCE (AC−CE), AERO (AE−RO), Kendall’s W dan percentile dibiarkan dalam bahasa Inggris; ringkasan disampaikan dalam Bahasa Indonesia."
    )
    ACC_ASSM_DEFINITION: str = (
        "Assim−Acc = (AC + RO) − (AE + CE). Nilai positif = preferensi lebih asimilatif; nilai negatif = lebih akomodatif."
    )
    CONV_DIV_DEFINITION: str = (
        "Conv-Div = (AC + AE) − (CE + RO). Nilai positif = preferensi konvergen (penutupan pada satu opsi terbaik); nilai negatif = preferensi divergen (membuka alternatif)."
    )
    BALANCE_DEFINITION: str = (
        "BALANCE_ACCE = |ACCE − 9|, BALANCE_AERO = |AERO − 6|. Semakin kecil semakin seimbang; persentil BALANCE dihitung dengan penskalaan teoretis (bukan norma populasi)."
    )
    INTERPRETATION_SUMMARY: str = (
        "Fleksibilitas rendah terutama muncul ketika proses asimilasi (AC+RO) tidak diimbangi orientasi akomodasi (AE+CE)."
    )


class ReportLearningSpaceTips:
    """Narrative snippets guiding learning space design."""

    AERO_HIGH: str = (
        "Tambahkan jeda refleksi terstruktur (debrief, jurnal) untuk menyeimbangkan kecenderungan aksi."
    )
    AERO_LOW: str = (
        "Sisipkan eksperimen aktif berjangka pendek (prototyping, role-play) untuk melatih orientasi aksi."
    )
    ACCE_HIGH: str = (
        "Perkaya pengalaman konkret (lab, simulasi, studi lapangan) agar konsep teruji dalam realitas."
    )
    ACCE_LOW: str = (
        "Rangkum pengalaman ke dalam kerangka konseptual (peta konsep, model) untuk memperkuat abstraksi."
    )
    ACC_ASSM_HIGH: str = (
        "Waspadai over-asimilasi; dorong keterlibatan eksternal dengan stakeholders/klien (orientasi akomodasi)."
    )
    ACC_ASSM_LOW: str = (
        "Seimbangkan eksplorasi dengan konsolidasi analitis (review literatur, analisis data, penetapan kriteria)."
    )
    CONV_DIV_HIGH: str = (
        "Cegah penutupan terlalu dini; fasilitasi sesi divergen (brainstorm tanpa evaluasi, multiple options)."
    )
    CONV_DIV_LOW: str = (
        "Dorong konvergensi: gunakan matriks keputusan, kriteria eksplisit, dan time-boxing untuk memilih opsi."
    )
    HIGH_INTENSITY: str = (
        "Intensitas gaya tinggi: rancang aktivitas yang memaksa menyentuh keempat kuadran siklus belajar."
    )
    LOW_FLEXIBILITY: str = (
        "Fleksibilitas rendah: desain urutan sesi mengelilingi siklus (CE→RO→AC→AE) dengan dukungan dan tantangan seimbang."
    )


class ReportMetaLearningTips:
    """Meta-learning practice recommendations."""

    LFI_LOW: str = (
        "Rancang siklus belajar sadar (CE→RO→AC→AE) mingguan dan catat wawasan/aksi (tracking kemajuan, bukan nilai sesaat)."
    )
    ACCE_POSITIVE: str = (
        "Mindfulness untuk membuka pengalaman konkret (CE) sebelum pemodelan; tambah proyek lapangan singkat."
    )
    ACCE_NEGATIVE: str = (
        "Ringkas pengalaman ke kerangka (AC): peta konsep, model 2x2; lakukan review konsep setelah refleksi."
    )
    AERO_POSITIVE: str = (
        "Tambahkan jeda refleksi 10–15 menit pasca-aksi (journaling/debrief pasangan) untuk mengkonsolidasikan pelajaran."
    )
    AERO_NEGATIVE: str = (
        "Lakukan eksperimen kecil berjangka pendek (time-boxed) untuk mengaktifkan AE dan mendapatkan umpan balik nyata."
    )
    WEAKEST_CE: str = (
        "Latih kehadiran inderawi & empati (napas tenang 2 menit, perhatikan 5 indera) sebelum diskusi."
    )
    WEAKEST_RO: str = "Buat jurnal refleksi terstruktur (apa? so what? now what?) minimal 2x per minggu."
    WEAKEST_AC: str = (
        "Bangun model/hipotesis singkat dan uji; gunakan matriks keputusan atau kerangka teori 1 halaman."
    )
    WEAKEST_AE: str = (
        "Tetapkan goal kecil + umpan balik cepat (deliberate practice): coba–ukur–perbaiki dalam sprint 1–2 hari."
    )
    SELF_TALK: str = (
        "Pantau self-talk: ganti 'tidak bisa' dengan 'belum bisa—akan dilatih'; rangkum 3 keberhasilan mingguan untuk menyeimbangkan fokus."
    )


class ReportEducatorActions:
    """Standardized educator role actions in Indonesian."""

    FACILITATOR: tuple[str, ...] = ("aktivasi pengalaman", "dialog reflektif")
    EXPERT: tuple[str, ...] = ("pemetaan konsep", "model/teori")
    EVALUATOR: tuple[str, ...] = ("tugas kinerja", "umpan balik terhadap kriteria")
    COACH: tuple[str, ...] = ("rencana aksi personal", "prototipe")


class ReportEducatorRoleLabels:
    """Role names for educator recommendations."""

    FACILITATOR: str = "Fasilitator"
    EXPERT: str = "Pakar"
    EVALUATOR: str = "Evaluator"
    COACH: str = "Pelatih"


class ReportEducatorFocusLabels:
    """Focus descriptors for each educator role."""

    FACILITATOR: str = "CE+RO"
    EXPERT: str = "RO+AC"
    EVALUATOR: str = "AC+AE"
    COACH: str = "CE+AE"


class ReportEducatorHints:
    """Learning style-specific notes for educator sequences."""

    IMAGINING_OR_EXPERIENCING: str = (
        "Pastikan langkah konvergensi (Evaluator/Coach) time-boxed agar tidak 'terbuka' terlalu lama."
    )
    THINKING_DECIDING_ANALYZING: str = (
        "Pastikan tahap divergen (Facilitator/Expert) cukup lama sebelum penutupan."
    )
    INITIATING_OR_ACTING: str = (
        "Tambahkan debrief reflektif setelah setiap percobaan untuk menguatkan transfer."
    )
    BALANCING: str = "Gunakan dua spiral singkat untuk mengeksplorasi dua pendekatan berbeda."


class ReportFlexNarratives:
    """Localized flexibility narratives for different patterns."""

    HIGH: str = (
        "Profil fleksibilitas tinggi (LFI={score:.2f}): Pembelajar ini menunjukkan kemampuan adaptif yang kuat, "
        "menggunakan {style_count} gaya berbeda melintasi konteks pembelajaran. Seperti 'Mark' dalam studi kasus "
        "(persentil 98), individu ini nyaman beroperasi di semua empat kuadran ruang pembelajaran—menggabungkan "
        "pengalaman konkret, refleksi, konseptualisasi abstrak, dan eksperimen aktif sesuai tuntutan situasi. "
        "Fleksibilitas ini mendukung perkembangan integratif yang lebih tinggi dan kemampuan beradaptasi dengan "
        "beragam tantangan pembelajaran sepanjang hidup."
    )
    MODERATE: str = (
        "Profil fleksibilitas moderat (LFI={score:.2f}): Pembelajar ini menggunakan {style_count} gaya pembelajaran "
        "berbeda, menunjukkan kemampuan adaptasi yang wajar namun dengan beberapa preferensi yang lebih kuat. "
        "Terdapat peluang untuk memperluas repertoar gaya, khususnya dengan lebih banyak berlatih di kuadran yang kurang digunakan."
    )
    LOW: str = (
        "Profil fleksibilitas rendah (LFI={score:.2f}): Pembelajar ini cenderung mengandalkan {style_count} gaya yang "
        "terbatas melintasi konteks. Seperti 'Jason' dalam studi kasus (persentil 4), pola ini dapat menciptakan tekanan "
        "ketika situasi menuntut gaya yang kurang dikembangkan—terutama jika ada penekanan berlebihan pada refleksi/asimilasi "
        "tanpa penyeimbang aksi/akomodasi yang memadai. Pengembangan strategis di kuadran yang kurang digunakan dapat meningkatkan "
        "kemampuan adaptasi dan mengurangi stres dalam peran kepemimpinan atau tugas berorientasi aksi."
    )


class RegressionMessages:
    """Regression analytics service messages."""

    CONTEXT_COUNT_ERROR: str = "Diharapkan {expected} konteks, tetapi menerima {received}"
    UNCLASSIFIED_STYLE: str = "Tidak terkategori"
    MISSING_REGRESSION_SECTION: str = "Konfigurasi KLSI tidak memuat bagian 'regression'."
    MISSING_LFI_SECTION: str = "Konfigurasi KLSI tidak memuat 'regression.lfi'."
    MISSING_INTEGRATIVE_SECTION: str = "Konfigurasi KLSI tidak memuat 'regression.integrative_development'."
    MISSING_LFI_PREDICTORS: str = "Konfigurasi 'regression.lfi' tidak memiliki daftar predictor."
    LFI_PREDICTOR_KEY_MISSING: str = "Prediktor '{name}' tidak memiliki kunci wajib '{missing}'."
    LFI_PARAM_MISSING: str = "Parameter regresi LFI '{missing}' tidak ditemukan."
    INTEGRATIVE_PARAM_MISSING: str = "Parameter integrative development '{missing}' tidak ditemukan."


class RegressionFlexPatterns:
    """Categorical labels for regression analytics outputs."""

    HIGH: str = "high"
    MODERATE: str = "moderate"
    LOW: str = "low"
    MEDIUM: str = "medium"


class ReportBandLabels:
    """Generic percentile band labels used in reports."""

    LOW: str = "Low"
    MID: str = "Mid"
    HIGH: str = "High"
    MODERATE: str = "Moderate"


class LogicMessages:
    """Assessment logic error messages for core validation routines."""

    LFI_CONTEXT_KEYS: str = (
        "Konteks {index} harus memuat peringkat untuk {modes}. Kunci ditemukan: {found}"
    )
    LFI_CONTEXT_NON_INTEGER: str = (
        "Konteks {index} memiliki peringkat non-integer: {ranks}"
    )
    LFI_CONTEXT_RANGE: str = (
        "Konteks {index} harus memiliki peringkat dalam rentang 1..4. Ditemukan: {ranks}"
    )
    LFI_CONTEXT_PERMUTATION: str = (
        "Konteks {index} harus berupa permutasi [1,2,3,4]. Ditemukan: {ranks}"
    )
    LFI_CONTEXT_COUNT_MISMATCH: str = "Diperlukan {expected} konteks LFI, ditemukan {found}"
    LFI_CONTEXT_NAME_UNKNOWN: str = (
        "Terdapat nama konteks LFI yang tidak dikenal dalam konfigurasi: {contexts}"
    )
    LFI_CONTEXT_DUPLICATE: str = "Terdapat nama konteks LFI duplikat dalam sesi"
    LEARNING_STYLE_WINDOWS_MISSING: str = (
        "Window gaya belajar belum tersedia; jalankan seeding learning_style_types"
    )


class DefinitionMessages:
    """Assessment definition validation messages."""

    LFI_CONTEXT_COUNT: str = "Butuh {expected} konteks LFI, baru {found}"


class StrategyMessages:
    """Strategy registry error messages."""

    STRATEGY_NOT_REGISTERED: str = "Strategi scoring tidak terdaftar: {code}"
