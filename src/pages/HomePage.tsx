import React, { useState } from 'react';
import { AnimatedGrid, AnimatedListItem } from '../components/ui/AnimatedListItem';
import { GlassPanel } from '../components/ui/GlassPanel';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { LayeredIcon } from '../components/ui/LayeredIcon';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getSessions, startSession } from '../services/sessionService';
import { queryClient } from '../config/api';
import { 
  BookOpen, 
  FileText, 
  HelpCircle, 
  LogOut, 
  PlayCircle, 
  BarChart3,
  Clock,
  Users,
  CheckCircle
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { toast } from 'sonner@2.0.3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import type { Session } from '../types/api';
import { cn } from '../lib/utils';

/**
 * KLSI 4.0 - HomePage / Dashboard
 * Task 21, 23: Implementasi React Query untuk sessions dan start session
 * Task TODO3.md Phase 3.12: Apply Gestalt Proximity principles (Guidelines.md §1.5)
 * 
 * Dashboard utama setelah login dengan session management
 * Implementasi dengan GlassPanelTile sesuai frontend_blueprint.md §3.2
 * FIXED: Removed text-* classes, Motion spring animations, proper material hierarchy
 * UPDATED: Spacing follows Gestalt Proximity - related elements closer, sections farther
 */

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isStarting, setIsStarting] = useState(false);

  // Task 21: Query untuk fetch active sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: () => getSessions({ status: 'ACTIVE' }),
    staleTime: 60 * 1000, // 1 minute
  });

  // Task 24: Query untuk fetch completed sessions (untuk tabel riwayat)
  const { data: completedSessions, isLoading: isLoadingCompleted } = useQuery<Session[]>({
    queryKey: ['sessions', 'completed'],
    queryFn: () => getSessions({ status: 'COMPLETED' }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Task 23: Mutation untuk start new session
  const startSessionMutation = useMutation({
    mutationFn: () => startSession('S-KLSI-4'),
    onSuccess: (data) => {
      toast.success('Sesi asesmen baru dimulai!');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      // Navigate to assessment start page
      navigate(`/assessment/${data.session_id}/start`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memulai sesi');
      setIsStarting(false);
    },
  });

  const handleStartAssessment = async () => {
    // Check if there's an active session
    if (sessions && sessions.length > 0) {
      const activeSession = sessions[0];
      navigate(`/assessment/${activeSession.id}/start`);
      return;
    }

    // Start new session
    setIsStarting(true);
    startSessionMutation.mutate();
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  // Spring configuration (Bagian 2.3.1)
  const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  };

  const activeSession = sessions?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Header dengan Glass Material (Bagian 4.2 - Navigation Layer) */}
      <header className="glass-regular sticky top-0 z-50 border-b border-border">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <div>
            <h1 className="text-primary">KLSI 4.0</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle (Task 82) */}
            <ThemeToggle />
            
            <motion.button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary text-secondary-foreground px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={springConfig}
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </motion.button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-6 space-y-8">
        {/* Welcome Section */}
        <div className="material-regular rounded-xl p-8 space-y-2">
          <h2>
            Selamat Datang, {user?.name || 'Pengguna'}
          </h2>
          <p className="text-muted-foreground">
            Pilih menu di bawah untuk memulai asesmen atau melihat hasil Anda.
          </p>
        </div>

        {/* Active Session Banner (if exists) */}
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springConfig}
            className="material-regular rounded-xl p-6 border-l-4 border-l-primary"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-foreground">
                    Anda memiliki sesi aktif
                  </h4>
                  <p className="text-muted-foreground">
                    Lanjutkan asesmen yang sudah dimulai
                  </p>
                  <p className="text-muted-foreground">
                    Dimulai: {new Date(activeSession.created_at).toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <motion.button
                type="button"
                onClick={() => navigate(`/assessment/${activeSession.id}/start`)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={springConfig}
              >
                <PlayCircle className="h-4 w-4" />
                Lanjutkan
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Menu Grid - Enhanced dengan staggered animation (Task TODO2.md §3.14) */}
        <AnimatedGrid columns={{ sm: 1, md: 2, lg: 3 }} gap={6} stagger={0.08}>
          {/* Start Assessment */}
          <AnimatedListItem
            hoverScale
            onClick={handleStartAssessment}
            className={cn(
              "glass-regular rounded-xl p-8 space-y-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation",
              (isStarting || startSessionMutation.isPending) && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            {isStarting || startSessionMutation.isPending ? (
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent" />
              </div>
            ) : (
              <LayeredIcon 
                icon={activeSession ? PlayCircle : BookOpen}
                size="md"
                color="primary"
                enableParallax
                enableLighting
              />
            )}
            <div className="space-y-2">
              <h3 className="text-foreground">
                {activeSession ? 'Lanjutkan Asesmen' : 'Mulai Asesmen'}
              </h3>
              <p className="text-muted-foreground">
                {activeSession 
                  ? 'Lanjutkan Learning Style Inventory yang sedang berjalan'
                  : 'Ikuti Learning Style Inventory untuk mengetahui preferensi belajar Anda'
                }
              </p>
            </div>
          </AnimatedListItem>

          {/* My Reports */}
          <AnimatedListItem
            hoverScale
            onClick={() => navigate('/reports/self')}
            className="glass-regular rounded-xl p-8 space-y-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
          >
            <LayeredIcon 
              icon={BarChart3}
              size="md"
              color="chart-2"
              enableParallax
              enableLighting
            />
            <div className="space-y-2">
              <h3 className="text-foreground">
                Laporan Saya
              </h3>
              <p className="text-muted-foreground">
                Lihat hasil asesmen dan analisis gaya belajar Anda
              </p>
            </div>
          </AnimatedListItem>

          {/* Mediator Tools (jika role MEDIATOR) */}
          {user?.role === 'MEDIATOR' && (
            <>
              <AnimatedListItem
                hoverScale
                onClick={() => navigate('/teams')}
                className="glass-regular rounded-xl p-8 space-y-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
              >
                <LayeredIcon 
                  icon={Users}
                  size="md"
                  color="chart-4"
                  enableParallax
                  enableLighting
                />
                <div className="space-y-2">
                  <h3 className="text-foreground">
                    Kelola Tim
                  </h3>
                  <p className="text-muted-foreground">
                    Kelola tim dan lihat analisis agregat untuk fasilitasi
                  </p>
                </div>
              </AnimatedListItem>

              {/* Research Dashboard (Mediator only) */}
              <AnimatedListItem
                hoverScale
                onClick={() => navigate('/research')}
                className="glass-regular rounded-xl p-8 space-y-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
              >
                <LayeredIcon 
                  icon={FileText}
                  size="md"
                  color="primary"
                  enableParallax
                  enableLighting
                />
                <div className="space-y-2">
                  <h3 className="text-foreground">
                    Kelola Penelitian
                  </h3>
                  <p className="text-muted-foreground">
                    Kelola studi penelitian dan ekspor data untuk analisis
                  </p>
                </div>
              </AnimatedListItem>
            </>
          )}
        </AnimatedGrid>

        {/* Task 24: Previous Sessions Table */}
        {completedSessions && completedSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Asesmen</CardTitle>
              <CardDescription>
                Sesi asesmen yang telah selesai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Instrumen</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        {new Date(session.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>KLSI 4.0</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Selesai
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/report/${session.id}`)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Lihat Laporan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Info Banner - NonDiagnosticNotice (frontend_blueprint.md §4.2) */}
        <div className="material-thin rounded-xl p-6 border-l-4 border-l-chart-2">
          <h4 className="text-foreground mb-2">
            Instrumen Formatif
          </h4>
          <p className="text-muted-foreground">
            KLSI 4.0 adalah alat formatif untuk refleksi belajar dan desain pedagogi,
            bukan alat diagnostik klinis atau seleksi. Hasil dapat berubah seiring
            pengalaman dan konteks belajar Anda.
          </p>
        </div>
      </main>
    </div>
  );
};