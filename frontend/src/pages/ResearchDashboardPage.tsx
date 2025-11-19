/**
 * KLSI 4.0 - ResearchDashboardPage
 * Task 67, 70: Dashboard untuk mediator mengelola research studies
 * 
 * Implementasi sesuai Guidelines.md:
 * - Glass-regular untuk navigation
 * - Material-regular untuk content cards
 * - Grid layout responsive
 * - React Query untuk data fetching
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import {
  getStudies,
  createStudy,
  type Study,
} from '../services/researchService';
import { StudyCard } from '../components/research/StudyCard';
import { LoadingComponent } from '../components/common/LoadingComponent';
import {
  FileText,
  Plus,
  ChevronLeft,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import { AccessibleHeading } from '../components/ui/AccessibleHeading';
import { GlassPanel } from '../components/ui/GlassPanel';

export const ResearchDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'ALL' | 'ACTIVE' | 'COMPLETED' | 'DRAFT'
  >('ALL');

  // Create study modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStudyTitle, setNewStudyTitle] = useState('');
  const [newStudyDescription, setNewStudyDescription] = useState('');
  const [newStudyStartDate, setNewStudyStartDate] = useState('');
  const [newStudyEndDate, setNewStudyEndDate] = useState('');

  // Task 67: Fetch studies with React Query
  const {
    data: studies = [],
    isLoading,
    error,
  } = useQuery<Study[], Error>({
    queryKey: ['studies'],
    queryFn: getStudies,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Task 70: Create study mutation
  const createStudyMutation = useMutation({
    mutationFn: createStudy,
    onSuccess: () => {
      // Invalidate and refetch studies
      queryClient.invalidateQueries({ queryKey: ['studies'] });
      
      toast.success('Studi penelitian berhasil dibuat!');
      
      // Reset form
      setNewStudyTitle('');
      setNewStudyDescription('');
      setNewStudyStartDate('');
      setNewStudyEndDate('');
      setShowCreateModal(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat studi');
    },
  });

  // Create study handler
  const handleCreateStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudyTitle.trim() || !newStudyStartDate) return;

    createStudyMutation.mutate({
      title: newStudyTitle.trim(),
      description: newStudyDescription.trim(),
      start_date: newStudyStartDate,
      end_date: newStudyEndDate || undefined,
    });
  };

  // Filter studies
  const filteredStudies = studies.filter((study) => {
    const matchesSearch =
      study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === 'ALL' || study.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Loading state
  if (isLoading) {
    return <LoadingComponent message="Memuat studi penelitian..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      <GlassPanel
        as="header"
        material="functional"
        density="compact"
        className="sticky top-0 z-50 border-b border-border"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <ChevronLeft className="h-4 w-4" />
                Beranda
              </button>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <div className="hidden sm:flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <AccessibleHeading variant="subsection" className="text-foreground">
                  Kelola Penelitian
                </AccessibleHeading>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 transition-spring hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Buat Studi</span>
            </button>
          </div>
        </div>
      </GlassPanel>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <AccessibleHeading variant="page" className="text-foreground">
            Dashboard Penelitian
          </AccessibleHeading>
          <p className="text-muted-foreground">
            Kelola studi penelitian, kumpulkan data, dan ekspor hasil analisis
          </p>
        </div>

        {/* User Info Banner */}
        {user?.role === 'MEDIATOR' && (
          <div className="material-thin rounded-xl p-4 border-l-4 border-l-chart-2">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">
                Mode Penelitian Aktif
              </strong>
              {' '}Kelola studi penelitian, tambahkan partisipan, dan ekspor data
              dalam format CSV untuk analisis lanjutan.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="material-regular rounded-xl p-6 bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <AccessibleHeading variant="subsection" className="text-foreground mb-1">
                  Error
                </AccessibleHeading>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        {studies.length > 0 && (
          <div className="material-regular rounded-xl p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari studi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-input-background pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Status:</span>
              <div className="flex gap-2">
                {(['ALL', 'ACTIVE', 'COMPLETED', 'DRAFT'] as const).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1 rounded-lg text-sm transition-spring ${
                        filterStatus === status
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:opacity-80'
                      }`}
                    >
                      {status === 'ALL'
                        ? 'Semua'
                        : status === 'ACTIVE'
                        ? 'Aktif'
                        : status === 'COMPLETED'
                        ? 'Selesai'
                        : 'Draft'}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Studies Grid */}
        {filteredStudies.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudies.map((study) => (
              <StudyCard
                key={study.id}
                study={study}
                onClick={() => navigate(`/research/studies/${study.id}`)}
              />
            ))}
          </div>
        ) : studies.length > 0 ? (
          <div className="material-regular rounded-xl p-12 text-center">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <AccessibleHeading variant="subsection" className="text-foreground mb-2">
              Tidak Ada Hasil
            </AccessibleHeading>
            <p className="text-muted-foreground">
              Tidak ada studi yang cocok dengan filter "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="material-regular rounded-xl p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <AccessibleHeading variant="subsection" className="text-foreground mb-2">
              Belum Ada Studi Penelitian
            </AccessibleHeading>
            <p className="text-muted-foreground mb-6">
              Buat studi pertama Anda untuk mulai mengumpulkan data penelitian
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 transition-spring hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Buat Studi
            </button>
          </div>
        )}
      </main>

      {/* Create Study Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassPanel
            as="section"
            material="functional"
            density="spacious"
            className="w-full max-w-md space-y-6"
          >
            <div className="space-y-2">
              <AccessibleHeading variant="section" className="text-foreground">
                Buat Studi Baru
              </AccessibleHeading>
              <p className="text-sm text-muted-foreground">
                Masukkan informasi studi penelitian untuk mulai mengumpulkan data
              </p>
            </div>

            <form onSubmit={handleCreateStudy} className="space-y-4">
              {/* Study Title */}
              <div className="space-y-2">
                <label htmlFor="studyTitle" className="block text-foreground">
                  Judul Studi *
                </label>
                <input
                  id="studyTitle"
                  type="text"
                  required
                  value={newStudyTitle}
                  onChange={(e) => setNewStudyTitle(e.target.value)}
                  placeholder="e.g., Penelitian Gaya Belajar Mahasiswa 2025"
                  className="w-full rounded-lg bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border"
                />
              </div>

              {/* Study Description */}
              <div className="space-y-2">
                <label
                  htmlFor="studyDescription"
                  className="block text-foreground"
                >
                  Deskripsi (Opsional)
                </label>
                <textarea
                  id="studyDescription"
                  rows={3}
                  value={newStudyDescription}
                  onChange={(e) => setNewStudyDescription(e.target.value)}
                  placeholder="Deskripsi singkat tentang tujuan dan metodologi penelitian..."
                  className="w-full rounded-lg bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border resize-none"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="studyStartDate"
                    className="block text-foreground"
                  >
                    Tanggal Mulai *
                  </label>
                  <input
                    id="studyStartDate"
                    type="date"
                    required
                    value={newStudyStartDate}
                    onChange={(e) => setNewStudyStartDate(e.target.value)}
                    className="w-full rounded-lg bg-input-background px-4 py-3 text-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="studyEndDate"
                    className="block text-foreground"
                  >
                    Tanggal Selesai
                  </label>
                  <input
                    id="studyEndDate"
                    type="date"
                    value={newStudyEndDate}
                    onChange={(e) => setNewStudyEndDate(e.target.value)}
                    min={newStudyStartDate}
                    className="w-full rounded-lg bg-input-background px-4 py-3 text-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewStudyTitle('');
                    setNewStudyDescription('');
                    setNewStudyStartDate('');
                    setNewStudyEndDate('');
                  }}
                  disabled={createStudyMutation.isPending}
                  className="flex-1 rounded-lg bg-secondary text-secondary-foreground px-4 py-3 transition-spring hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    createStudyMutation.isPending || !newStudyTitle.trim() || !newStudyStartDate
                  }
                  className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-3 transition-spring hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createStudyMutation.isPending ? 'Membuat...' : 'Buat Studi'}
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </div>
  );
};