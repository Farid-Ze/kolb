/**
 * KLSI 4.0 - MediatorDashboardPage
 * Task 52, 55: Dashboard untuk mediator mengelola teams
 *
 * Implementasi sesuai Guidelines.md:
 * - GlassPanel untuk navigation
 * - Material-regular untuk content cards
 * - Grid layout responsive
 * - React Query untuk data fetching
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { getTeams, createTeam, type Team } from '../services/teamService';
import { TeamCard } from '../components/teams/TeamCard';
import { LoadingComponent } from '../components/common/LoadingComponent';
import { GuideModal } from '../components/common/GuideModal';
import { GUIDE_IDS } from '../services/guideService';
import {
  Users,
  Plus,
  ChevronLeft,
  AlertCircle,
  Search,
  HelpCircle,
} from 'lucide-react';
import { useTelemetry } from '../hooks/useTelemetry';
import { AccessibleHeading } from '../components/ui/AccessibleHeading';
import { GlassPanel } from '../components/ui/GlassPanel';

export const MediatorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { trackPageView } = useTelemetry();

  const [searchQuery, setSearchQuery] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  const [showGuideModal, setShowGuideModal] = useState(false);

  const {
    data: teams = [],
    isLoading,
    error,
  } = useQuery<Team[], Error>({
    queryKey: ['teams'],
    queryFn: getTeams,
    staleTime: 2 * 60 * 1000,
  });

  const createTeamMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Tim berhasil dibuat!');
      setNewTeamName('');
      setNewTeamDescription('');
      setShowCreateModal(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal membuat tim');
    },
  });

  const handleCreateTeam = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTeamName.trim()) {
      return;
    }

    createTeamMutation.mutate({
      name: newTeamName.trim(),
      description: newTeamDescription.trim(),
    });
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    trackPageView(location.pathname, 'Mediator Dashboard');
  }, [location.pathname, trackPageView]);

  if (isLoading) {
    return <LoadingComponent message="Memuat tim..." />;
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
                aria-label="Kembali ke beranda"
              >
                <ChevronLeft className="h-4 w-4" />
                Beranda
              </button>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <div className="hidden sm:flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <AccessibleHeading variant="subsection" className="text-foreground">
                  Kelola Tim
                </AccessibleHeading>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 transition-spring hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Buat Tim</span>
            </button>
          </div>
        </div>
      </GlassPanel>

      <main className="mx-auto max-w-7xl p-6 space-y-6">
        <div className="space-y-2">
          <AccessibleHeading variant="page" className="text-foreground">
            Dashboard Mediator
          </AccessibleHeading>
          <p className="text-muted-foreground">
            Kelola tim dan lihat analisis agregat gaya belajar
          </p>
        </div>

        {user?.role === 'MEDIATOR' && (
          <div className="material-thin rounded-xl p-4 border-l-4 border-l-chart-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-muted-foreground flex-1">
                <strong className="text-foreground">Selamat datang, {user.name}!</strong>{' '}
                Sebagai mediator, Anda dapat membuat tim, mengelola anggota, dan melihat analisis gaya belajar tim.
              </p>
              <button
                onClick={() => setShowGuideModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-chart-4/10 text-chart-4 px-3 py-2 transition-spring hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex-shrink-0"
                aria-label="Panduan Mediator"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Panduan</span>
              </button>
            </div>
          </div>
        )}

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

        {teams.length > 0 && (
          <div className="material-regular rounded-xl p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari tim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-input-background pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border"
              />
            </div>
          </div>
        )}

        {filteredTeams.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onClick={() => navigate(`/teams/${team.id}`)}
              />
            ))}
          </div>
        ) : teams.length > 0 ? (
          <div className="material-regular rounded-xl p-12 text-center">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <AccessibleHeading variant="subsection" className="text-foreground mb-2">
              Tidak Ada Hasil
            </AccessibleHeading>
            <p className="text-muted-foreground">
              Tidak ada tim yang cocok dengan pencarian "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="material-regular rounded-xl p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <AccessibleHeading variant="subsection" className="text-foreground mb-2">
              Belum Ada Tim
            </AccessibleHeading>
            <p className="text-muted-foreground mb-6">
              Buat tim pertama Anda untuk mulai mengelola gaya belajar kelompok
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 transition-spring hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Buat Tim
            </button>
          </div>
        )}
      </main>

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
                Buat Tim Baru
              </AccessibleHeading>
              <p className="text-sm text-muted-foreground">
                Masukkan informasi tim untuk membuat grup pembelajaran baru
              </p>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="teamName" className="block text-foreground">
                  Nama Tim
                </label>
                <input
                  id="teamName"
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Kelas 10A, Tim Marketing"
                  className="w-full rounded-lg bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="teamDescription" className="block text-foreground">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  id="teamDescription"
                  rows={3}
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="Deskripsi singkat tentang tim ini..."
                  className="w-full rounded-lg bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTeamName('');
                    setNewTeamDescription('');
                  }}
                  disabled={createTeamMutation.isPending}
                  className="flex-1 rounded-lg bg-secondary text-secondary-foreground px-4 py-3 transition-spring hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createTeamMutation.isPending || !newTeamName.trim()}
                  className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-3 transition-spring hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createTeamMutation.isPending ? 'Membuat...' : 'Buat Tim'}
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}

      <GuideModal
        guideId={GUIDE_IDS.MEDIATOR_ONBOARDING}
        title="Panduan Mediator"
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        context="mediator_dashboard_onboarding"
      />
    </div>
  );
};
