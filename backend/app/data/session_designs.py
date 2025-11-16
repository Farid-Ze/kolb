"""
Experiential session designs (Appendix-10 inspired, paraphrased) with style activations.
Each design activates certain KLSI 4.0 styles to "teach around the cycle".
Copyright note: Titles and summaries are original paraphrases; no verbatim content.
"""
from typing import List, TypedDict

# Canonical style names as used in STYLE_LABELS_ID/STYLE_DETAIL_ID keys
STYLES = [
    "Experiencing", "Imagining", "Reflecting", "Analyzing",
    "Thinking", "Deciding", "Acting", "Initiating", "Balancing",
]

class Design(TypedDict):
    code: str
    title: str
    summary: str
    activates: List[str]
    duration_min: int
    # Optional fields below are declared in a separate partial TypedDict

class DesignExtra(TypedDict, total=False):
    objectives: List[str]
    materials: List[str]
    prerequisites: List[str]
    outline: List["Step"]
    notes: str


class Step(TypedDict):
    start_min: int
    end_min: int
    title: str
    description: str
    engages: List[str]

# We annotate as List[dict] to allow both Design and DesignExtra keys; runtime schema is validated by tests.
designs: List[dict] = [
    {
        "code": "GW-REF-ANL",
        "title": "Gallery Walk: Patterns and Models",
        "summary": (
            "Peserta berkeliling ke stasiun materi, mencatat pengamatan dan pola, lalu menyusun model ringkas bersama."),
        "activates": ["Imagining", "Reflecting", "Analyzing", "Thinking"],
        "duration_min": 45,
    },
    {
        "code": "SD1-KLSI-SELF-AWARE",
        "title": "KLSI 4.0 untuk Memahami Gaya Belajar & Fleksibilitas",
        "summary": (
            "Sesi terpandu untuk meninjau hasil KLSI, memetakan posisi pada ruang belajar pengalaman, berdiskusi dalam kelompok gaya, "
            "menafsirkan fleksibilitas belajar (LFI), dan menyusun rencana tujuan belajar pribadi."),
        "activates": [
            "Balancing", "Reflecting", "Thinking", "Deciding", "Acting", "Experiencing", "Imagining"
        ],
        "duration_min": 120,
        "objectives": [
            "Meningkatkan pemahaman cara belajar pribadi",
            "Meningkatkan kesadaran atas gaya belajar diri dan orang lain",
            "Menilai kekuatan/kelemahan belajar serta fleksibilitas (LFI)",
            "Menetapkan sasaran belajar untuk pengembangan diri"
        ],
        "materials": [
            "Laporan/interpretasi KLSI 4.0 peserta (cetak)",
            "Ruang terbuka + grid 9 gaya (lakban, kertas, penanda)",
            "Kertas flipchart 2–3 lembar per kelompok kecil",
            "Spidol flipchart"
        ],
        "prerequisites": [
            "Peserta telah menyelesaikan KLSI 4.0 dan membawa laporan interpretasi"
        ],
        "outline": [
            {
                "start_min": 0, "end_min": 20,
                "title": "Pembuka & Ikhtisar ELT + 9 Gaya",
                "description": "Tujuan, ringkas siklus belajar (CE–RO–AC–AE) dan sembilan gaya beserta kekuatan/tantangannya.",
                "engages": ["Imagining", "Reflecting", "Analyzing", "Thinking"]
            },
            {
                "start_min": 20, "end_min": 25,
                "title": "Tinjau Profil Pribadi",
                "description": "Individu menelaah bentuk ‘kite’ dan deskripsi tipe; opsional memilih tipe alternatif yang lebih sesuai.",
                "engages": ["Reflecting", "Creating", "Thinking"]
            },
            {
                "start_min": 25, "end_min": 30,
                "title": "Pemetaan di Ruang Belajar",
                "description": "Posisikan diri di grid 9 gaya; amati sebaran dan kecenderungan kelompok.",
                "engages": ["Experiencing", "Acting", "Balancing"]
            },
            {
                "start_min": 30, "end_min": 50,
                "title": "Diskusi Kelompok per Gaya",
                "description": "Kelompok 3–6 orang membahas validitas skor, kekuatan/kelemahan, tujuan dan preferensi lingkungan belajar.",
                "engages": ["Reflecting", "Creating", "Analyzing", "Thinking"]
            },
            {
                "start_min": 50, "end_min": 80,
                "title": "Laporan Kelompok ke Pleno",
                "description": "Setiap kelompok memaparkan sorotan; tanya jawab dan rangkuman fasilitator.",
                "engages": ["Acting", "Deciding", "Balancing"]
            },
            {
                "start_min": 80, "end_min": 95,
                "title": "Pengantar Learning Flexibility (LFI)",
                "description": "Jelaskan konsep fleksibilitas dan interpretasi skor/profil LFI pada laporan KLSI.",
                "engages": ["Thinking", "Analyzing", "Reflecting"]
            },
            {
                "start_min": 95, "end_min": 105,
                "title": "Rencana Tujuan Belajar Pribadi",
                "description": "Isian lembar rencana; sasaran konkrit untuk memperkuat mode kurang dominan.",
                "engages": ["Deciding", "Thinking", "Acting", "Imagining"]
            },
            {
                "start_min": 105, "end_min": 115,
                "title": "Berbagi dalam Trio",
                "description": "Saling memberi masukan atas rencana; identifikasi dukungan dan tindak lanjut.",
                "engages": ["Balancing", "Acting", "Reflecting"]
            },
            {
                "start_min": 115, "end_min": 125,
                "title": "Penutup & Ringkasan Trio",
                "description": "Laporan singkat hasil diskusi trio dan penegasan poin utama.",
                "engages": ["Acting", "Deciding", "Balancing"]
            }
        ],
        "notes": "Durasi dapat disesuaikan (90–120 menit) bergantung ukuran kelompok dan gaya fasilitasi."
    },
    {
        "code": "SD2-LEMON-EXPERIENCE-THINKING",
        "title": "Latihan Lemon: Mengalami vs Menalar",
        "summary": (
            "Eksperimen sederhana untuk membedakan ‘pengetahuan akrab’ dari pengalaman langsung dan ‘pengetahuan tentang’ melalui konsep; "
            "mengaitkan keduanya dalam siklus belajar."),
        "activates": ["Experiencing", "Thinking", "Analyzing", "Reflecting", "Acting"],
        "duration_min": 75,
        "objectives": [
            "Memahami dasar siklus belajar pengalaman (dua cara mengetahui)",
            "Meningkatkan kesadaran atas proses mengalami dan berpikir",
            "Menilai kekuatan/kelemahan pada kedua mode dan menetapkan tujuan pengembangan"
        ],
        "materials": [
            "Satu lemon per peserta",
            "Kotak kardus besar",
            "Flipchart 3 lembar + spidol"
        ],
        "outline": [
            {
                "start_min": 0, "end_min": 10,
                "title": "Pemantik & Daftar Umum tentang Lemon",
                "description": "Brainstorm karakteristik umum lemon dan catat sebagai daftar konsep.",
                "engages": ["Thinking", "Analyzing", "Imagining"]
            },
            {
                "start_min": 10, "end_min": 15,
                "title": "Kenali Lemon Pribadi",
                "description": "Setiap orang mengamati lemonnya, memberi nama, dan membuat cerita singkat tentang cirinya.",
                "engages": ["Experiencing", "Creating", "Reflecting"]
            },
            {
                "start_min": 15, "end_min": 25,
                "title": "Tukar & Temukan Kembali",
                "description": "Lemon dikumpulkan lalu dicari kembali dari campuran; pengalaman membedakan yang unik.",
                "engages": ["Experiencing", "Acting", "Initiating"]
            },
            {
                "start_min": 25, "end_min": 40,
                "title": "Berbagi Ciri Unik",
                "description": "Uraikan bagaimana mengenali lemon—kumpulkan daftar ciri khusus.",
                "engages": ["Reflecting", "Analyzing"]
            },
            {
                "start_min": 40, "end_min": 45,
                "title": "Bandingkan Dua Daftar",
                "description": "Kontraskan daftar konsep umum dengan daftar pengalaman unik; bedakan sumber pengetahuan.",
                "engages": ["Thinking", "Reflecting"]
            },
            {
                "start_min": 45, "end_min": 60,
                "title": "Dua Cara Mengetahui dalam ELT",
                "description": "Tautkan pengalaman konkret dan konseptualisasi abstrak, serta peran aksi–refleksi dalam pembelajaran.",
                "engages": ["Thinking", "Balancing"]
            },
            {
                "start_min": 60, "end_min": 75,
                "title": "Latihan Beralih Mode",
                "description": "Praktik masuk ke mode konseptual lalu mengalami; diskusikan kemudahan, teknik, dan langkah integrasi harian.",
                "engages": ["Experiencing", "Thinking", "Balancing", "Reflecting"]
            }
        ]
    },
    {
        "code": "RP-LAB-ACT",
        "title": "Rapid Prototyping Lab",
        "summary": (
            "Tim membuat prototipe cepat untuk menguji ide utama, mengumpulkan umpan balik, dan memutuskan iterasi berikutnya."),
        "activates": ["Initiating", "Acting", "Deciding"],
        "duration_min": 60,
    },
    {
        "code": "EI-CE-RO",
        "title": "Empathy Interviews",
        "summary": (
            "Wawancara berempati untuk menggali pengalaman nyata, diikuti refleksi terstruktur dan sintesis wawasan."),
        "activates": ["Experiencing", "Creating", "Reflecting"],
        "duration_min": 50,
    },
    {
        "code": "DM-CRITIC-AC",
        "title": "Debate & Model Critique",
        "summary": (
            "Debat terarah dan kritik model untuk menguji koherensi konsep dan implikasi aplikatifnya."),
        "activates": ["Thinking", "Deciding", "Analyzing"],
        "duration_min": 40,
    },
    {
        "code": "SIM-SPRINT-AE",
        "title": "Simulation Sprint",
        "summary": (
            "Simulasi singkat berulang dengan target kinerja, peran rotasi, dan review cepat setelah tiap putaran."),
        "activates": ["Acting", "Initiating", "Balancing"],
        "duration_min": 55,
    },
    {
        "code": "FC-PROJ-ALL",
        "title": "Full‑Cycle Project",
        "summary": (
            "Proyek ujung-ke-ujung yang melewati pengalaman, refleksi, konseptualisasi, dan eksperimen; hasil dipresentasikan."),
        "activates": [
            "Experiencing", "Imagining", "Reflecting", "Analyzing",
            "Thinking", "Deciding", "Acting", "Initiating", "Balancing"
        ],
        "duration_min": 120,
    },
]

# Stretch map: for each style, suggest opposite/less-dominant zones to practice
STRETCH_SUGGESTIONS = {
    "Experiencing": ["Thinking", "Deciding"],
    "Imagining": ["Acting", "Deciding"],
    "Reflecting": ["Initiating", "Acting"],
    "Analyzing": ["Experiencing", "Initiating"],
    "Thinking": ["Experiencing", "Initiating"],
    "Deciding": ["Imagining", "Reflecting"],
    "Acting": ["Reflecting", "Analyzing"],
    "Initiating": ["Reflecting", "Analyzing"],
    "Balancing": ["Balancing"],  # already flexible; reinforce process awareness
}


def filter_by_styles(include_any: List[str]) -> List[dict]:
    """Return designs that activate any of the provided styles.
    include_any: style names (e.g., ["Acting", "Deciding"]).
    """
    inc = set(include_any)
    return [d for d in designs if inc.intersection(set(d["activates"]))]


def recommend_for_primary(primary_style: str, backup_style: str | None = None, limit: int = 4) -> List[dict]:
    """Recommend a small set that hits the primary, the backup (if any), and a stretch target.
    - Always include at least one that activates the primary.
    - Try to include one that activates a stretch suggestion.
    - Fill to limit with diverse coverage.
    """
    out: List[dict] = []
    seen = set()

    def add(design: dict):
        key = design["code"]
        if key not in seen:
            out.append(design)
            seen.add(key)

    # 1) Hit primary
    for d in designs:
        if primary_style in d["activates"]:
            add(d)
            break

    # 2) Hit backup if provided
    if backup_style:
        for d in designs:
            if backup_style in d["activates"]:
                add(d)
                if len(out) >= limit:
                    return out[:limit]
                break

    # 3) Stretch
    for stretch in STRETCH_SUGGESTIONS.get(primary_style, []):
        for d in designs:
            if stretch in d["activates"]:
                add(d)
                if len(out) >= limit:
                    return out[:limit]
                break

    # 4) Fill
    for d in designs:
        add(d)
        if len(out) >= limit:
            break

    return out[:limit]
