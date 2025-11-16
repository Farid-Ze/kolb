/**
 * KLSI 4.0 - Mock Report Data
 * Mock data untuk testing dan development report pages
 */

import type { Report } from '../types/api';

export const mockReport: Report = {
  report_id: 'report-123',
  session_id: 'session-456',
  user_id: 'user-789',
  instrument_id: 'S-KLSI-4',
  generated_at: new Date().toISOString(),
  raw_scores: {
    CE: 28.5,
    RO: 32.0,
    AC: 35.5,
    AE: 30.0,
  },
  dialectic_scores: {
    'AC-CE': 7.0, // Positive = Abstract
    'AE-RO': -2.0, // Negative = Reflective
  },
  learning_style: {
    style_code: 'ASS',
    style_name: 'Assimilating',
    quadrant: 3,
    description:
      'Orang dengan gaya Assimilating unggul dalam memahami berbagai informasi dan mengorganisirnya dalam format yang logis dan ringkas. Mereka lebih fokus pada ide dan konsep abstrak daripada orang, dan lebih suka penjelasan teoritis yang logis.',
    strengths: [
      'Perencanaan sistematis',
      'Pemikiran konseptual',
      'Analisis mendalam',
    ],
    development_areas: [
      'Aplikasi praktis',
      'Pengambilan keputusan cepat',
      'Interaksi sosial',
    ],
  },
  nine_style: {
    style_code: 'N-WEST',
    style_name: 'Northern-Western',
    description:
      'Kombinasi thinking dan watching dengan kecenderungan ke arah northern (balancing). Menunjukkan fleksibilitas dalam pendekatan belajar dengan preferensi pada analisis reflektif.',
  },
  flexibility: {
    lfi_score: 68.5,
    category: 'Moderate',
    interpretation:
      'Anda memiliki fleksibilitas belajar yang moderat. Anda dapat beradaptasi dengan berbagai mode belajar, namun cenderung lebih nyaman dalam area tertentu. Untuk meningkatkan fleksibilitas, cobalah untuk keluar dari zona nyaman dan eksplorasi mode belajar yang kurang Anda dominasi.',
  },
  norm_group: {
    norm_id: 'norm-edu-university',
    norm_name: 'US University Students',
    description:
      'Norma berdasarkan sampel mahasiswa universitas di Amerika Serikat',
    sample_size: 1847,
  },
  percentile_scores: {
    CE: 45,
    RO: 62,
    AC: 78,
    AE: 52,
    'AC-CE': 72,
    'AE-RO': 48,
  },
  reliability_flags: [],
  responsible_use_notice:
    'KLSI 4.0 adalah alat formatif untuk refleksi belajar dan desain pedagogi, bukan alat diagnostik klinis atau seleksi. Hasil dapat berubah seiring pengalaman dan konteks belajar Anda. Gunakan hasil ini sebagai titik awal diskusi dengan fasilitator, bukan sebagai label permanen.',
};

export const mockReportList: Report[] = [
  mockReport,
  {
    ...mockReport,
    report_id: 'report-124',
    session_id: 'session-457',
    generated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    learning_style: {
      style_code: 'DIV',
      style_name: 'Diverging',
      quadrant: 2,
      description:
        'Orang dengan gaya Diverging mampu melihat situasi dari berbagai perspektif dan mengorganisir hubungan yang bermakna. Mereka lebih fokus pada orang daripada hal teknis, dan lebih suka mengamati daripada bertindak.',
    },
    nine_style: {
      style_code: 'WEST',
      style_name: 'Western',
      description: 'Fokus pada refleksi dan pengalaman konkret.',
    },
    raw_scores: {
      CE: 36.0,
      RO: 34.0,
      AC: 26.0,
      AE: 30.0,
    },
    dialectic_scores: {
      'AC-CE': -10.0,
      'AE-RO': -4.0,
    },
    flexibility: {
      lfi_score: 72.0,
      category: 'Moderate',
      interpretation: 'Fleksibilitas belajar yang baik.',
    },
  },
  {
    ...mockReport,
    report_id: 'report-125',
    session_id: 'session-458',
    generated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    learning_style: {
      style_code: 'CON',
      style_name: 'Converging',
      quadrant: 4,
      description:
        'Orang dengan gaya Converging unggul dalam menemukan aplikasi praktis untuk ide dan teori. Mereka lebih suka menangani tugas teknis dan masalah daripada isu sosial dan interpersonal.',
    },
    nine_style: {
      style_code: 'SOUTH',
      style_name: 'Southern',
      description: 'Fokus pada pemikiran abstrak dan eksperimen aktif.',
    },
    raw_scores: {
      CE: 24.0,
      RO: 28.0,
      AC: 38.0,
      AE: 36.0,
    },
    dialectic_scores: {
      'AC-CE': 14.0,
      'AE-RO': 8.0,
    },
    flexibility: {
      lfi_score: 58.0,
      category: 'Moderate',
      interpretation: 'Fleksibilitas belajar yang cukup.',
    },
  },
];
