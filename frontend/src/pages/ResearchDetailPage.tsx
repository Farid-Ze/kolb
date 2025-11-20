/**
 * KLSI 4.0 - ResearchDetailPage
 * Task 72, 73, 74, 75: Detail studi dengan data export dan filtering
 * 
 * Implementasi sesuai Guidelines.md:
 * - Glass-regular untuk navigation
 * - Material-regular untuk content cards
 * - CSV export functionality (Task 74)
 * - Table display dengan shadcn/ui (Task 73)
 * - Responsible Use notice (Task 75)
 * - React Query untuk data fetching
 */

import React, { useState, useId } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getStudyDetails,
  getStudyData,
  exportStudyDataToCSV,
  type StudyDetail,
  type StudyData,
  type ExportFilters,
} from '../services/researchService';
import { LoadingComponent } from '../components/common/LoadingComponent';
import {
  ChevronLeft,
  FileText,
  Download,
  AlertCircle,
  Calendar,
  Users,
  BarChart3,
  Filter,
  X,
  ShieldAlert,
} from 'lucide-react';
import { GlassPanel } from '../components/ui/GlassPanel';
import { NonDiagnosticNotice } from '../components/report/NonDiagnosticNotice';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../core/physics/motionPrimitives';
import { PageShell, RoomContent } from '../core/design-system/Layout';
import { useNonBlockingNavigate } from '../hooks/useNonBlockingNavigate';

export const ResearchDetailPage: React.FC = () => {
  const navigate = useNonBlockingNavigate();
  const { studyId } = useParams<{ studyId: string }>();

  const [isExporting, setIsExporting] = useState(false);
  const noticeId = useId();

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>({});

  const studyIdNum = studyId ? parseInt(studyId) : 0;

  // Task 72: Fetch study details with React Query
  const {
    data: studyDetail,
    isLoading: isLoadingDetail,
    error: detailError,
  } = useQuery<StudyDetail, Error>({
    queryKey: ['study', studyIdNum],
    queryFn: () => getStudyDetails(studyIdNum),
    enabled: !!studyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Task 72: Fetch study data with React Query
  const {
    data: studyData,
    isLoading: isLoadingData,
    refetch: refetchData,
  } = useQuery<StudyData, Error>({
    queryKey: ['studyData', studyIdNum, filters],
    queryFn: () => getStudyData(studyIdNum, filters),
    enabled: !!studyId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Apply filters and reload data
  const applyFilters = () => {
    setShowFilters(false);
    refetchData();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setShowFilters(false);
  };

  // Task 74: Export to CSV
  const handleExport = () => {
    if (!studyData) return;

    try {
      setIsExporting(true);
      exportStudyDataToCSV(studyData);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengekspor data');
    } finally {
      setIsExporting(false);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some((v) => v);

  // Loading state
  const isLoading = isLoadingDetail || isLoadingData;
  if (isLoading && !studyData) {
    return <LoadingComponent message="Memuat data studi..." />;
  }

  // Error state
  if (detailError && !studyDetail) {
    return (
      <PageShell>
        <RoomContent>
          <GlassPanel
            as="section"
            material="content"
            density="spacious"
            className="max-w-md w-full text-center space-y-4"
          >
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-2xl text-foreground">Error</h2>
            <p className="text-muted-foreground">
              {detailError.message || 'Studi tidak ditemukan'}
            </p>
            <button
              onClick={() => navigate('/research')}
              className="rounded-lg bg-primary text-primary-foreground px-6 py-3 transition-spring hover:opacity-90"
            >
              Kembali ke Daftar Studi
            </button>
          </GlassPanel>
        </RoomContent>
      </PageShell>
    );
  }

  if (!studyDetail || !studyData) return null;

  const formatDate = (
    value?: string | null,
    options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  ) => {
    if (!value) return 'Tidak tersedia';
    return new Date(value).toLocaleDateString('id-ID', options);
  };

  const effectiveStartDate =
    studyDetail.start_date ?? studyData.summary.date_range?.earliest ?? null;
  const effectiveEndDate =
    studyDetail.end_date ?? studyData.summary.date_range?.latest ?? null;

  return (
    <PageShell className="items-start justify-center">
      <RoomContent className="w-full max-w-7xl gap-8 items-stretch py-10">
        <GlassPanel
          as="header"
          material="functional"
          density="compact"
          className="sticky top-4 z-50 w-full border-b border-white/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/research')}
                className="inline-flex items-center gap-2 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <ChevronLeft className="h-4 w-4" />
                Daftar Studi
              </button>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <div className="hidden sm:flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-lg text-foreground truncate max-w-xs">
                  {studyDetail.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 transition-spring hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  hasActiveFilters
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || studyData.data_points.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 transition-spring hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isExporting ? 'Mengekspor...' : 'Ekspor CSV'}
                </span>
              </button>
            </div>
          </div>
        </GlassPanel>

        {/* Main Content */}
        <motion.main
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full space-y-8"
        >
        {/* Study Info */}
        <motion.div variants={fadeInUp}>
          <GlassPanel material="content" className="rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl text-foreground">
                    {studyDetail.title}
                  </h1>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded text-sm ${
                      studyDetail.status === 'ACTIVE'
                        ? 'bg-chart-4/10 text-chart-4'
                        : studyDetail.status === 'COMPLETED'
                        ? 'bg-chart-2/10 text-chart-2'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {studyDetail.status === 'ACTIVE'
                      ? 'Aktif'
                      : studyDetail.status === 'COMPLETED'
                      ? 'Selesai'
                      : 'Draft'}
                  </span>
                </div>

                <NonDiagnosticNotice
                  id={noticeId}
                  variant="compact"
                  className="material-regular rounded-xl p-4"
                />
                {studyDetail.description && (
                  <p className="text-muted-foreground">
                    {studyDetail.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(effectiveStartDate)}
                  {effectiveEndDate && (
                    <>
                      {' - '}
                      {formatDate(effectiveEndDate)}
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  {studyData.summary.unique_participants} partisipan
                </span>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div variants={fadeInUp}>
            <GlassPanel material="content" className="rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg text-foreground">Filter Data</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-muted-foreground hover:text-foreground transition-spring"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <label className="block text-sm text-foreground">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={filters.start_date || ''}
                    onChange={(e) =>
                      setFilters({ ...filters, start_date: e.target.value })
                    }
                    className="w-full rounded-lg bg-input-background px-4 py-2 text-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm text-foreground">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={filters.end_date || ''}
                    onChange={(e) =>
                      setFilters({ ...filters, end_date: e.target.value })
                    }
                    className="w-full rounded-lg bg-input-background px-4 py-2 text-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border"
                  />
                </div>

                {/* Learning Style */}
                <div className="space-y-2">
                  <label className="block text-sm text-foreground">
                    Gaya Belajar
                  </label>
                  <select
                    value={filters.learning_style || ''}
                    onChange={(e) =>
                      setFilters({ ...filters, learning_style: e.target.value })
                    }
                    className="w-full rounded-lg bg-input-background px-4 py-2 text-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border"
                  >
                    <option value="">Semua</option>
                    <option value="Diverging">Diverging</option>
                    <option value="Assimilating">Assimilating</option>
                    <option value="Converging">Converging</option>
                    <option value="Accommodating">Accommodating</option>
                    <option value="Balancing">Balancing</option>
                  </select>
                </div>

                {/* Email Search */}
                <div className="space-y-2">
                  <label className="block text-sm text-foreground">
                    Email Partisipan
                  </label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={filters.user_email || ''}
                    onChange={(e) =>
                      setFilters({ ...filters, user_email: e.target.value })
                    }
                    className="w-full rounded-lg bg-input-background px-4 py-2 text-foreground placeholder:text-muted-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border"
                  />
                </div>

                {/* Norm Group */}
                <div className="space-y-2">
                  <label className="block text-sm text-foreground">
                    Kelompok Norma
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., undergraduate"
                    value={filters.norm_group || ''}
                    onChange={(e) =>
                      setFilters({ ...filters, norm_group: e.target.value })
                    }
                    className="w-full rounded-lg bg-input-background px-4 py-2 text-foreground placeholder:text-muted-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="rounded-lg bg-secondary text-secondary-foreground px-4 py-2 transition-spring hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="rounded-lg bg-primary text-primary-foreground px-4 py-2 transition-spring hover:scale-105 active:scale-95"
                >
                  Terapkan Filter
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* Statistics */}
        <motion.div
          variants={fadeInUp}
          role="region"
          aria-describedby={noticeId}
          data-testid="study-stats-block"
        >
          <GlassPanel material="content" className="rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg text-foreground">Statistik Data</h3>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="material-thin rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Total Sesi
                </div>
                <div className="text-2xl text-foreground">
                  {studyData.summary.total_sessions}
                </div>
              </div>
              <div className="material-thin rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Partisipan Unik
                </div>
                <div className="text-2xl text-foreground">
                  {studyData.summary.unique_participants}
                </div>
              </div>
              <div className="material-thin rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Tanggal Pertama
                </div>
                <div className="text-sm text-foreground">
                  {studyData.summary.date_range?.earliest
                    ? new Date(
                        studyData.summary.date_range.earliest
                      ).toLocaleDateString('id-ID')
                    : 'Tidak tersedia'}
                </div>
              </div>
              <div className="material-thin rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Tanggal Terakhir
                </div>
                <div className="text-sm text-foreground">
                  {studyData.summary.date_range?.latest
                    ? new Date(
                        studyData.summary.date_range.latest
                      ).toLocaleDateString('id-ID')
                    : 'Tidak tersedia'}
                </div>
              </div>
            </div>

            {/* Style Distribution */}
            {Object.keys(studyData.summary.style_distribution).length > 0 && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm text-foreground mb-3">
                  Distribusi Gaya Belajar
                </h4>
                <div className="space-y-2">
                  {Object.entries(studyData.summary.style_distribution).map(
                    ([style, count]) => (
                      <div key={style} className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-40">
                            {style}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-spring"
                              style={{
                                width: `${
                                  (count / studyData.summary.total_sessions) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-foreground w-12 text-right">
                          {count}
                        </span>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          ({((count / studyData.summary.total_sessions) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </GlassPanel>
        </motion.div>

        {/* Data Preview - Task 73 */}
        <motion.div
          variants={fadeInUp}
          role="region"
          aria-describedby={noticeId}
          data-testid="study-data-preview"
        >
          <GlassPanel material="content" className="rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-foreground">Data Preview</h3>
              <span className="text-sm text-muted-foreground">
                {studyData.data_points.length} baris data
              </span>
            </div>

            {studyData.data_points.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground">
                        Nama
                      </th>
                      <th className="text-left p-3 text-muted-foreground">
                        Email
                      </th>
                      <th className="text-left p-3 text-muted-foreground">
                        Tanggal
                      </th>
                      <th className="text-left p-3 text-muted-foreground">
                        Gaya Belajar
                      </th>
                      <th className="text-right p-3 text-muted-foreground">
                        AC-CE
                      </th>
                      <th className="text-right p-3 text-muted-foreground">
                        AE-RO
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studyData.data_points.slice(0, 10).map((point, idx) => (
                      <tr
                        key={point.session_id}
                        className={
                          idx % 2 === 0 ? 'bg-secondary/20' : 'bg-transparent'
                        }
                      >
                        <td className="p-3 text-foreground">{point.user_name}</td>
                        <td className="p-3 text-muted-foreground">
                          {point.user_email}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(point.generated_at).toLocaleDateString(
                            'id-ID'
                          )}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
                            {point.learning_style}
                          </span>
                        </td>
                        <td className="p-3 text-right text-foreground">
                          {point.ac_ce.toFixed(1)}
                        </td>
                        <td className="p-3 text-right text-foreground">
                          {point.ae_ro.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {studyData.data_points.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Menampilkan 10 dari {studyData.data_points.length} baris.
                    Ekspor CSV untuk melihat semua data.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Belum ada data tersedia untuk studi ini
                </p>
              </div>
            )}
          </GlassPanel>
        </motion.div>

        {/* Task 75: Responsible Use Notice */}
        <motion.div variants={fadeInUp}>
          <GlassPanel material="content" className="rounded-xl p-6 border-l-4 border-l-destructive">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="text-foreground">
                  Panduan Penggunaan Bertanggung Jawab Data Penelitian
                </h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Data penelitian yang diekspor dari sistem ini mengandung
                    informasi pribadi dan psikometrik partisipan. Harap patuhi
                    pedoman berikut:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      <strong>Kerahasiaan:</strong> Jaga kerahasiaan data
                      partisipan. Jangan bagikan data mentah tanpa persetujuan
                      etik yang sesuai.
                    </li>
                    <li>
                      <strong>Anonimisasi:</strong> Hapus atau enkripsi informasi
                      identitas pribadi (nama, email) sebelum publikasi atau
                      berbagi.
                    </li>
                    <li>
                      <strong>Persetujuan:</strong> Pastikan semua partisipan
                      telah memberikan informed consent untuk penggunaan data
                      mereka dalam penelitian.
                    </li>
                    <li>
                      <strong>Penyimpanan Aman:</strong> Simpan data di lokasi
                      yang aman dan enkripsi. Jangan tinggalkan file CSV di
                      perangkat publik atau tidak aman.
                    </li>
                    <li>
                      <strong>Tujuan Penelitian:</strong> Gunakan data hanya
                      untuk tujuan penelitian yang telah disetujui dan dijelaskan
                      kepada partisipan.
                    </li>
                    <li>
                      <strong>Keterbatasan Interpretasi:</strong> Hasil KLSI
                      adalah indikator preferensi belajar, bukan ukuran
                      kemampuan. Hindari interpretasi yang terlalu pasti atau
                      stigmatisasi.
                    </li>
                  </ul>
                  <p className="pt-2">
                    Untuk pertanyaan etika penelitian atau penggunaan data, silakan konsultasikan dengan komite etik institusi Anda atau hubungi administrator sistem.
                  </p>
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
        </motion.main>
      </RoomContent>
    </PageShell>
  );
};
