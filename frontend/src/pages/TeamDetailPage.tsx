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

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getTeamDetails,
  getTeamRollup,
  addMemberToTeam,
  removeMemberFromTeam,
  type TeamDetail,
  type TeamRollup,
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

export const TeamDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const queryClient = useQueryClient();

  // Add member modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const teamIdNum = teamId ? parseInt(teamId) : 0;

  // Task 57: Fetch team details with React Query
  const {
    data: teamDetail,
    isLoading: isLoadingTeam,
    error: teamError,
  } = useQuery<TeamDetail, Error>({
    queryKey: ['team', teamIdNum],
    queryFn: () => getTeamDetails(teamIdNum),
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Task 62: Fetch team rollup with React Query
  const {
    data: teamRollup,
    isLoading: isLoadingRollup,
  } = useQuery<TeamRollup, Error>({
    queryKey: ['teamRollup', teamIdNum],
    queryFn: () => getTeamRollup(teamIdNum),
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1, // Rollup is optional, don't retry too much
  });

  // Task 60: Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: (data: { user_email: string }) =>
      addMemberToTeam(teamIdNum, data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['team', teamIdNum] });
      queryClient.invalidateQueries({ queryKey: ['teamRollup', teamIdNum] });
      
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
    mutationFn: (userId: string) => removeMemberFromTeam(teamIdNum, userId),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['team', teamIdNum] });
      queryClient.invalidateQueries({ queryKey: ['teamRollup', teamIdNum] });
      
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

  // Remove member handler
  const handleRemoveMember = async (userId: string, userName: string) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus ${userName} dari tim ini?`
    );
    if (!confirmed) return;

    removeMemberMutation.mutate(userId);
  };

  // Loading state
  const isLoading = isLoadingTeam || isLoadingRollup;
  if (isLoading) {
    return <LoadingComponent message="Memuat detail tim..." />;
  }

  // Error state
  if (teamError || !teamDetail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-regular rounded-xl p-8 max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl text-foreground">Error</h2>
          <p className="text-muted-foreground">
            {teamError?.message || 'Tim tidak ditemukan'}
          </p>
          <button
            onClick={() => navigate('/teams')}
            className="rounded-lg bg-primary text-primary-foreground px-6 py-3 transition-spring hover:opacity-90"
          >
            Kembali ke Daftar Tim
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Header - Glass Material */}
      <header className="glass-regular sticky top-0 z-50 border-b border-border">
        <div className="mx-auto max-w-7xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/teams')}
                className="inline-flex items-center gap-2 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <ChevronLeft className="h-4 w-4" />
                Daftar Tim
              </button>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <div className="hidden sm:flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <ShortLabel as="h1" className="text-foreground">
                  {teamDetail.name}
                </ShortLabel>
              </div>
            </div>

            {/* Add Member Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 transition-spring hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Tambah Anggota</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-6 space-y-8">
        {/* Team Info */}
        <div className="material-regular rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl text-foreground mb-2">{teamDetail.name}</h1>
              {teamDetail.description && (
                <p className="text-muted-foreground">{teamDetail.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <span className="text-2xl text-foreground">
                {teamDetail.member_count}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-3 border-t border-border text-sm text-muted-foreground">
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
        </div>

        {/* Team Rollup Chart (Task 68-70) */}
        {teamRollup && teamRollup.data_points.length > 0 && (
          <TeamRollupChart
            dataPoints={teamRollup.data_points}
            avgAcCe={teamRollup.summary.avg_ac_ce}
            avgAeRo={teamRollup.summary.avg_ae_ro}
          />
        )}

        {/* Team Statistics */}
        {teamRollup && (
          <div className="material-regular rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg text-foreground">Statistik Tim</h3>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="material-thin rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Total Anggota
                </div>
                <div className="text-2xl text-foreground">
                  {teamRollup.summary.total_members}
                </div>
              </div>
              <div className="material-thin rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Dengan Data
                </div>
                <div className="text-2xl text-foreground">
                  {teamRollup.summary.members_with_data}
                </div>
              </div>
              <div className="material-thin rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Avg AC-CE
                </div>
                <div className="text-2xl text-foreground">
                  {teamRollup.summary.avg_ac_ce.toFixed(1)}
                </div>
              </div>
              <div className="material-thin rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Avg AE-RO
                </div>
                <div className="text-2xl text-foreground">
                  {teamRollup.summary.avg_ae_ro.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Style Distribution */}
            {Object.keys(teamRollup.summary.style_distribution).length > 0 && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm text-foreground mb-3">
                  Distribusi Gaya Belajar
                </h4>
                <div className="space-y-2">
                  {Object.entries(teamRollup.summary.style_distribution).map(
                    ([style, count]) => (
                      <div key={style} className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-32">
                            {style}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-spring"
                              style={{
                                width: `${
                                  (count / teamRollup.summary.members_with_data) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-foreground w-8 text-right">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Members List (Task 63) */}
        <div className="material-regular rounded-xl p-6 space-y-4">
          <h3 className="text-lg text-foreground">Anggota Tim</h3>

          {teamDetail.members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Belum ada anggota di tim ini
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 transition-spring hover:scale-105 active:scale-95"
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
                  className="material-thin rounded-lg p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-foreground mb-1">{member.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.learning_style && (
                        <div className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5">
                          <span className="text-xs text-primary">
                            {member.learning_style}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleRemoveMember(member.user_id, member.name)
                    }
                    className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2 transition-spring hover:bg-destructive/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm">Hapus</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-regular rounded-xl p-8 max-w-md w-full space-y-6">
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
          </div>
        </div>
      )}
    </div>
  );
};