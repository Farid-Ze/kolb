/**
 * KLSI 4.0 - TeamDetailPage
 * Task 57, 60, 62: Detail tim dengan member management dan rollup visualization
 * 
 * Implementasi sesuai Guidelines.md:
 * - Glass-regular untuk navigation
 * - Material-regular untuk content cards
 * - TeamRollupChart untuk visualisasi
 * - React Query untuk data fetching dan mutations
 */

import React, { useMemo, useState, useCallback, useId } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getTeamDetails,
  getTeamRollup,
  addMemberToTeam,
  removeMemberFromTeam,
  type TeamDetail,
  type TeamRollup,
  type TeamRollupDataPoint,
  type TeamRollupLegacyMember,
  type TeamRollupLegacyMemberStatus,
  type TeamRollupSummary,
} from '../services/teamService';
import { TeamRollupChart } from '../components/teams/TeamRollupChart';
import { LoadingComponent } from '../components/common/LoadingComponent';
import {
  ChevronLeft,
  Users,
  UserPlus,
  Trash2,
  AlertCircle,
  Mail,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { ShortLabel } from '../components/ui/DynamicType';
import { useNonBlockingNavigate } from '../hooks/useNonBlockingNavigate';
import { GlassPanel } from '../components/ui/GlassPanel';
import { NonDiagnosticNotice } from '../components/report/NonDiagnosticNotice';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../core/physics/motionPrimitives';
import { PageShell, RoomContent } from '../core/design-system/Layout';

const LEGACY_STATUS_LABELS: Record<TeamRollupLegacyMemberStatus, string> = {
  missing_data: 'Belum Ada Data',
  partial: 'Data Parsial',
  stale: 'Perlu Pembaruan',
};

export const TeamDetailPage: React.FC = () => {
  const navigate = useNonBlockingNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const queryClient = useQueryClient();
  const noticeId = useId();

  // Add member modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<TeamDetail['members'][number] | null>(null);

  const teamIdNum = teamId ? parseInt(teamId) : 0;
  const teamQueryKey = useMemo(() => ['team', teamId ?? ''], [teamId]);
  const rollupQueryKey = useMemo(() => ['teamRollup', teamId ?? ''], [teamId]);

  // Task 57: Fetch team details with React Query
  const {
    data: teamDetail,
    isLoading: isLoadingTeam,
    error: teamError,
  } = useQuery<TeamDetail, Error>({
    queryKey: teamQueryKey,
    queryFn: () => getTeamDetails(teamIdNum),
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Task 62: Fetch team rollup with React Query
  const {
    data: teamRollup,
    isLoading: isLoadingRollup,
  } = useQuery<TeamRollup, Error>({
    queryKey: rollupQueryKey,
    queryFn: () => getTeamRollup(teamIdNum),
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1, // Rollup is optional, don't retry too much
  });

  const refreshTeamData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: teamQueryKey, refetchType: 'active' });
    queryClient.invalidateQueries({ queryKey: rollupQueryKey, refetchType: 'active' });
    queryClient.refetchQueries({ queryKey: teamQueryKey, type: 'active' });
    queryClient.refetchQueries({ queryKey: rollupQueryKey, type: 'active' });
  }, [queryClient, teamQueryKey, rollupQueryKey]);

  // Normalize legacy rollup payloads used in tests/mocks that still expose `members` fields
  const legacyMembers = useMemo(() => {
    if (Array.isArray(teamRollup?.legacy_members)) {
      return teamRollup.legacy_members;
    }
    if (Array.isArray(teamRollup?.members) && teamRollup.members.length) {
      return teamRollup.members as unknown as TeamRollupLegacyMember[];
    }
    return [];
  }, [teamRollup]);

  const normalizedDataPoints = useMemo<TeamRollupDataPoint[]>(() => {
    if (Array.isArray(teamRollup?.data_points) && teamRollup.data_points.length) {
      return teamRollup.data_points;
    }
    if (!legacyMembers.length) {
      return [];
    }
    const parseNumber = (value: unknown): number | undefined => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? undefined : parsed;
      }
      return undefined;
    };
    return legacyMembers.map((member, index) => ({
      user_id: typeof member.user_id === 'number' ? member.user_id : index,
      name: member.name ?? 'Anggota',
      email: member.email ?? undefined,
      ac_ce: parseNumber(member.ac_ce ?? member.AC_CE),
      ae_ro: parseNumber(member.ae_ro ?? member.AE_RO),
      learning_style: member.learning_style ?? undefined,
      style_code: member.style_code ?? undefined,
      session_id: parseNumber(member.session_id),
      generated_at: member.generated_at ?? undefined,
    }));
  }, [teamRollup, legacyMembers]);

  const normalizedSummary = useMemo<TeamRollupSummary>(() => {
    if (teamRollup?.summary) {
      return teamRollup.summary;
    }
    const totalMembers = teamDetail?.member_count ?? legacyMembers.length ?? 0;
    const fallbackMembersWithData = normalizedDataPoints.length || teamDetail?.members?.length || 0;
    const avg = (values: Array<number | undefined>) => {
      const filtered = values.filter((value): value is number => typeof value === 'number');
      if (!filtered.length) return 0;
      return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
    };
    const styleDistribution = normalizedDataPoints.reduce<Record<string, number>>((acc, point) => {
      const key = point.learning_style || point.style_code || 'UNKNOWN';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return {
      total_members: totalMembers,
      members_with_data: fallbackMembersWithData,
      avg_ac_ce: avg(normalizedDataPoints.map((point) => point.ac_ce)),
      avg_ae_ro: avg(normalizedDataPoints.map((point) => point.ae_ro)),
      style_distribution: styleDistribution,
    };
  }, [teamRollup, teamDetail, legacyMembers, normalizedDataPoints]);

  const hasRollupData = normalizedDataPoints.length > 0;
  const hasLegacyMembers = legacyMembers.length > 0;
  const safeMembersWithData =
    normalizedSummary.members_with_data || normalizedSummary.total_members || 1;
  const styleDistribution = normalizedSummary.style_distribution || {};
  const diversityScore =
    typeof teamRollup?.diversity_score === 'number' ? teamRollup.diversity_score : null;
  const balanceMetrics = teamRollup?.balance_metrics;
  const balanceEntries = balanceMetrics
    ? [
        { label: 'CE', value: balanceMetrics.CE_percentage },
        { label: 'RO', value: balanceMetrics.RO_percentage },
        { label: 'AC', value: balanceMetrics.AC_percentage },
        { label: 'AE', value: balanceMetrics.AE_percentage },
      ]
    : [];

  const errorMessage = useMemo(() => {
    if (!teamError?.message) {
      return 'Tim tidak ditemukan';
    }
    return teamError.message.toLowerCase().includes('not found')
      ? 'Tim tidak ditemukan'
      : teamError.message;
  }, [teamError]);

  const handleOpenAddModal = () => {
    refreshTeamData();
    if (teamId) {
      void queryClient.prefetchQuery({
        queryKey: teamQueryKey,
        queryFn: () => getTeamDetails(teamIdNum),
      });
    }
    setShowAddModal(true);
  };

  // Task 60: Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: (data: { user_email: string }) =>
      addMemberToTeam(teamIdNum, data),
    onSuccess: () => {
      // Invalidate and refetch
      refreshTeamData();
      
      toast.success('Anggota berhasil ditambahkan!');
      
      // Reset form
      setNewMemberEmail('');
      setShowAddModal(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menambahkan anggota');
    },
  });

  // Task 60: Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: number | string) => removeMemberFromTeam(teamIdNum, userId),
    onSuccess: () => {
      // Invalidate and refetch
      refreshTeamData();
      
      toast.success('Anggota berhasil dihapus!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus anggota');
    },
  });

  // Add member handler
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    addMemberMutation.mutate({
      user_email: newMemberEmail.trim(),
    });
  };

  const handleOpenRemoveModal = (member: TeamDetail['members'][number]) => {
    setMemberToRemove(member);
  };

  const handleCloseRemoveModal = () => {
    setMemberToRemove(null);
  };

  const handleConfirmRemove = () => {
    if (!memberToRemove) return;
    removeMemberMutation.mutate(memberToRemove.user_id, {
      onSettled: () => setMemberToRemove(null),
    });
  };

  // Loading state
  const isLoading = isLoadingTeam || isLoadingRollup;
  if (isLoading) {
    return <LoadingComponent message="Memuat detail tim..." />;
  }

  // Error state
  if (teamError || !teamDetail) {
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
            <p className="text-muted-foreground">{errorMessage}</p>
            <button
              onClick={() => navigate('/teams')}
              className="rounded-lg bg-primary text-primary-foreground px-6 py-3 transition-spring hover:opacity-90"
            >
              Kembali ke Daftar Tim
            </button>
          </GlassPanel>
        </RoomContent>
      </PageShell>
    );
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
                onClick={() => navigate('/teams')}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
                aria-label="Kembali ke daftar tim"
              >
                <ChevronLeft className="h-4 w-4" />
                Kembali ke Daftar Tim
              </button>
              <div className="hidden sm:block h-6 w-px bg-white/10" />
              <div className="hidden sm:flex items-center gap-2">
                <Users className="h-5 w-5 text-white/60" />
                <ShortLabel as="p" className="text-white font-medium">
                  Detail Tim
                </ShortLabel>
              </div>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900/20"
              aria-label="Tambah anggota baru"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Tambah Anggota</span>
            </button>
          </div>
        </GlassPanel>

        {/* Main Content */}
        <motion.main
          className="w-full space-y-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
        {/* Team Info */}
        <motion.div variants={fadeInUp}>
          <GlassPanel material="content" density="regular" className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{teamDetail.name}</h1>
                {teamDetail.description && (
                  <p className="text-white/70">{teamDetail.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Users className="h-5 w-5" />
                <span className="text-2xl font-bold text-white">
                  {teamRollup?.member_count ?? teamDetail.member_count}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-white/10 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Dibuat{' '}
                  {new Date(teamDetail.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <NonDiagnosticNotice
            id={noticeId}
            variant="compact"
            className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/80"
          />
        </motion.div>

        {/* Team Rollup Chart (Task 68-70) */}
        {hasRollupData && (
          <motion.div variants={fadeInUp}>
            <TeamRollupChart
              dataPoints={normalizedDataPoints}
              avgAcCe={normalizedSummary.avg_ac_ce}
              avgAeRo={normalizedSummary.avg_ae_ro}
              ariaDescribedById={noticeId}
            />
          </motion.div>
        )}

        {/* Team Statistics */}
        {teamRollup && (
          <motion.div
            variants={fadeInUp}
            role="region"
            aria-describedby={noticeId}
            data-testid="team-stats-block"
          >
            <GlassPanel material="content" density="regular" className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-white/60" />
                <h3 className="text-lg font-bold text-white">Statistik Tim</h3>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <div className="text-sm text-white/50 mb-1">
                    Jumlah Anggota
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {normalizedSummary.total_members}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <div className="text-sm text-white/50 mb-1">
                    Dengan Data
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {normalizedSummary.members_with_data} anggota
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <div className="text-sm text-white/50 mb-1">
                    Avg AC-CE
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {normalizedSummary.avg_ac_ce.toFixed(1)}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <div className="text-sm text-white/50 mb-1">
                    Avg AE-RO
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {normalizedSummary.avg_ae_ro.toFixed(1)}
                  </div>
                </div>
                {diversityScore !== null && (
                  <div className="bg-white/5 rounded-lg p-4 sm:col-span-2 lg:col-span-1 border border-white/5">
                    <div className="text-sm text-white/50 mb-1">
                      Skor Keragaman
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {diversityScore.toFixed(2)}
                    </div>
                    <p className="text-xs text-white/40 mt-1">
                      Nilai lebih tinggi menandakan variasi gaya belajar yang lebih luas. Metrik ini deskriptif, bukan label baik/buruk.
                    </p>
                  </div>
                )}
              </div>

              {balanceEntries.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <div className="text-sm text-white/50 mb-2">
                    Keseimbangan Dialektik
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    {balanceEntries.map((entry) => (
                      <div key={entry.label} className="space-y-1">
                        <p className="text-white/50 text-xs">{entry.label}</p>
                        <p className="text-white text-base font-medium">
                          {entry.value}%
                        </p>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${Math.min(Math.max(entry.value, 0), 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Style Distribution */}
              {Object.keys(styleDistribution).length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-sm text-white mb-3">
                    Distribusi Gaya Belajar
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(styleDistribution).map(
                      ([style, count]) => (
                        <div key={style} className="flex items-center gap-3">
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-sm text-white/60 w-32">
                              {style}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{
                                  width: `${
                                    (count / safeMembersWithData) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-white w-8 text-right">
                            {count}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </GlassPanel>
          </motion.div>
        )}

        {hasLegacyMembers && (
          <motion.div variants={fadeInUp}>
            <GlassPanel material="content" density="regular" className="p-6 space-y-4" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Anggota Perlu Pembaruan Data</h3>
                  <p className="text-sm text-white/60">
                    Daftar ini menampilkan anggota tanpa koordinat lengkap atau sesi asesmen terbaru. Informasi ini bersifat kontekstual untuk fasilitator.
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded bg-white/10 text-white/60">Bukan evaluasi performa individu</span>
              </div>

              <div className="space-y-3">
                {legacyMembers.map((member, index) => {
                  const statusLabel = member.status
                    ? LEGACY_STATUS_LABELS[member.status] ?? 'Data Terbatas'
                    : 'Data Terbatas';
                  const reason = member.status_reason ?? 'Informasi asesmen belum lengkap.';
                  return (
                    <div
                      key={`legacy-${member.user_id}-${index}`}
                      className="bg-white/5 rounded-lg p-4 flex items-center justify-between gap-4 border border-white/5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">
                          {member.name || 'Anggota Tim'}
                        </p>
                        {member.email && (
                          <p className="text-xs text-white/50 truncate">
                            {member.email}
                          </p>
                        )}
                        <p className="text-xs text-white/40 mt-1">{reason}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 border border-white/10">
                          {statusLabel}
                        </span>
                        {typeof member.ac_ce === 'number' && typeof member.ae_ro === 'number' && (
                          <p className="text-xs text-white/50">
                            AC-CE {member.ac_ce} · AE-RO {member.ae_ro}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* Members List (Task 63) */}
        <motion.div variants={fadeInUp}>
          <GlassPanel material="content" density="regular" className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Anggota Tim</h3>

            {teamDetail.members.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 mb-4">
                  Belum ada anggota di tim ini
                </p>
                <button
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900/20"
                >
                  <UserPlus className="h-4 w-4" />
                  Tambah Anggota Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {teamDetail.members.map((member) => (
                  <div
                    key={member.user_id}
                    className="bg-white/5 rounded-lg p-4 flex items-center justify-between gap-4 border border-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium mb-1">{member.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        {member.learning_style && (
                          <div className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20">
                            <span className="text-xs text-emerald-400">
                              {member.learning_style}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenRemoveModal(member)}
                      className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline text-sm">Hapus</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </motion.div>
        </motion.main>
      </RoomContent>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassPanel
            as="section"
            material="functional"
            density="spacious"
            className="w-full max-w-md space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl text-foreground">Tambah Anggota</h2>
              <p className="text-sm text-muted-foreground">
                Masukkan email anggota yang ingin ditambahkan ke tim
              </p>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="memberEmail" className="block text-foreground">
                  Email Anggota
                </label>
                <input
                  id="memberEmail"
                  type="email"
                  required
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full rounded-lg bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewMemberEmail('');
                  }}
                  disabled={addMemberMutation.isPending}
                  className="flex-1 rounded-lg bg-secondary text-secondary-foreground px-4 py-3 transition-spring hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addMemberMutation.isPending || !newMemberEmail.trim()}
                  className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-3 transition-spring hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addMemberMutation.isPending ? 'Menambahkan...' : 'Tambah'}
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}

      {/* Remove Member Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassPanel
            as="section"
            material="functional"
            density="spacious"
            className="w-full max-w-md space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl text-foreground">Hapus Anggota</h2>
              <p className="text-sm text-muted-foreground">
                Apakah Anda yakin ingin menghapus anggota ini dari tim? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="rounded-lg bg-secondary/20 px-4 py-3 text-sm text-foreground">
                {memberToRemove.name}
                <div className="text-xs text-muted-foreground">{memberToRemove.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseRemoveModal}
                disabled={removeMemberMutation.isPending}
                className="flex-1 rounded-lg bg-secondary text-secondary-foreground px-4 py-3 transition-spring hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={removeMemberMutation.isPending}
                className="flex-1 rounded-lg bg-destructive text-destructive-foreground px-4 py-3 transition-spring hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {removeMemberMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Sistem akan memberi tahu anggota terkait setelah Anda menghapusnya.
            </p>
          </GlassPanel>
        </div>
      )}
    </PageShell>
  );
};