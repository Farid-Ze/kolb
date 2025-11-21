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
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/useAuth';
import { getTeams, createTeam, type Team } from '../services/teamService';
import { TeamCard } from '../components/teams/TeamCard';
import { LoadingComponent } from '../components/common/LoadingComponent';
import { GuideModal } from '../components/common/GuideModal';
import { useNonBlockingNavigate } from '../hooks/useNonBlockingNavigate';
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
import { GlassPanel } from '../components/ui/GlassPanel';
import { DisplayTitle, BodyText } from '../core/design-system/Typography';
import { fadeInUp, staggerContainer } from '../core/physics/motionPrimitives';
import { PageShell, RoomContent } from '../core/design-system/Layout';

export const MediatorDashboardPage: React.FC = () => {
  const navigate = useNonBlockingNavigate();
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
      void queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Tim berhasil dibuat!');
      setNewTeamName('');
      setNewTeamDescription('');
      setShowCreateModal(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal membuat tim');
    },
  });

  const handleCreateTeam = (event: React.FormEvent<HTMLFormElement>) => {
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
    <PageShell className="items-start justify-center">
      <RoomContent className="w-full max-w-7xl gap-8 items-stretch py-10">
        <GlassPanel
          as="header"
          material="functional"
          density="compact"
          className="sticky top-4 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
                aria-label="Kembali ke beranda"
              >
                <ChevronLeft className="h-4 w-4" />
                Beranda
              </button>
              <div className="hidden sm:block h-6 w-px bg-white/10" />
              <div className="hidden sm:flex items-center gap-2">
                <Users className="h-5 w-5 text-white/60" />
                <span className="text-white font-medium">Kelola Tim</span>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900/20"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Buat Tim</span>
            </button>
          </div>
        </GlassPanel>

        <motion.main
          className="w-full space-y-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
        <motion.div className="space-y-2" variants={fadeInUp}>
          <DisplayTitle className="text-white">
            Dashboard Mediator
          </DisplayTitle>
          <BodyText tone="muted">
            Kelola tim dan lihat analisis agregat gaya belajar
          </BodyText>
        </motion.div>

        {user?.role === 'MEDIATOR' && (
          <motion.div variants={fadeInUp}>
            <GlassPanel material="content" density="regular" className="border-l-4 border-l-emerald-500">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-white/80 flex-1">
                  <strong className="text-white">Selamat datang, {user.name}!</strong>{' '}
                  Sebagai mediator, Anda dapat membuat tim, mengelola anggota, dan melihat analisis gaya belajar tim.
                </p>
                <button
                  onClick={() => setShowGuideModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 text-white px-3 py-2 transition-colors flex-shrink-0"
                  aria-label="Panduan Mediator"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Panduan</span>
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {error && (
          <motion.div variants={fadeInUp} className="rounded-xl p-6 bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-bold mb-1">Error</h3>
                <p className="text-sm text-white/70">{error.message}</p>
              </div>
            </div>
          </motion.div>
        )}

        {teams.length > 0 && (
          <motion.div variants={fadeInUp}>
            <GlassPanel material="functional" density="compact" className="p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Cari tim..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg bg-white/5 pl-10 pr-4 py-3 text-white placeholder:text-white/40 transition-all focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-transparent"
                />
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {filteredTeams.length > 0 ? (
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
          >
            {filteredTeams.map((team) => (
              <motion.div key={team.id} variants={fadeInUp}>
                <TeamCard
                  team={team}
                  onClick={() => navigate(`/teams/${team.id}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : teams.length > 0 ? (
          <motion.div variants={fadeInUp} className="rounded-xl p-12 text-center bg-white/5 border border-white/10 backdrop-blur-sm">
            <Search className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Tidak Ada Hasil</h3>
            <p className="text-white/60">
              Tidak ada tim yang cocok dengan pencarian "{searchQuery}"
            </p>
          </motion.div>
        ) : (
          <motion.div variants={fadeInUp} className="rounded-xl p-12 text-center bg-white/5 border border-white/10 backdrop-blur-sm">
            <Users className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Belum Ada Tim</h3>
            <p className="text-white/60 mb-6">
              Buat tim pertama Anda untuk mulai mengelola gaya belajar kelompok
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900/20"
            >
              <Plus className="h-4 w-4" />
              Buat Tim
            </button>
          </motion.div>
        )}
        </motion.main>
      </RoomContent>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassPanel
            as="section"
            material="functional"
            density="spacious"
            className="w-full max-w-md space-y-6 border-white/10 bg-slate-900/90"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Buat Tim Baru</h2>
              <p className="text-sm text-white/60">
                Masukkan informasi tim untuk membuat grup pembelajaran baru
              </p>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="teamName" className="block text-white/80 text-sm font-medium">
                  Nama Tim
                </label>
                <input
                  id="teamName"
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Kelas 10A, Tim Marketing"
                  className="w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder:text-white/30 transition-all focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-white/10"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="teamDescription" className="block text-white/80 text-sm font-medium">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  id="teamDescription"
                  rows={3}
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="Deskripsi singkat tentang tim ini..."
                  className="w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder:text-white/30 transition-all focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-white/10 resize-none"
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
                  className="flex-1 rounded-lg bg-white/10 hover:bg-white/20 text-white px-4 py-3 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createTeamMutation.isPending || !newTeamName.trim()}
                  className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-900/20"
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
    </PageShell>
  );
};
