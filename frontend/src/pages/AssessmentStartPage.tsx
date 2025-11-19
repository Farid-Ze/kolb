/**
 * KLSI 4.0 - AssessmentStartPage
 * Task 24, 26: Halaman instruksi dengan session detail query
 * 
 * Halaman untuk memulai asesmen baru dengan instruksi lengkap
 * FIXED: Removed text-* classes, added Motion springs, touch-manipulation
 * Implementasi sesuai Guidelines.md Section 1.4.3, 2.3.1
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSession } from '../services/sessionService';
import { getAssessmentItems } from '../services/assessmentService';
import { BookOpen, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/button';
import { NonDiagnosticNotice } from '../components/report/NonDiagnosticNotice';
import { LayeredIcon } from '../components/ui/LayeredIcon';
import type { Session } from '../types/api';
import { useTelemetry } from '../hooks/useTelemetry';
import { GlassPanel } from '../components/ui/GlassPanel';

export const AssessmentStartPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { trackPageView } = useTelemetry();

  // Task 24: Query untuk fetch session details
  const { data: session } = useQuery<Session>({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
  });

  // Task 26: Prefetch assessment items untuk performance
  const { data: assessmentData } = useQuery({
    queryKey: ['assessment-items', sessionId],
    queryFn: () => getAssessmentItems(sessionId!),
    enabled: !!sessionId,
  });

  const handleStartAssessment = () => {
    if (sessionId) {
      navigate(`/assessment/${sessionId}`);
    }
  };

  useEffect(() => {
    trackPageView(location.pathname, 'Assessment Start');
  }, [location.pathname, trackPageView]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Header */}
      <GlassPanel
        as="header"
        material="functional"
        density="compact"
        className="sticky top-0 z-50 border-b border-border"
      >
        <div className="mx-auto max-w-4xl w-full">
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            ← Kembali ke Beranda
          </button>
        </div>
      </GlassPanel>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl p-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <LayeredIcon 
            icon={BookOpen}
            size="xl"
            color="primary"
            enableParallax
            enableLighting
            className="mx-auto mb-4"
          />
          
          <h1 className="text-foreground">
            Kolb Learning Style Inventory 4.0
          </h1>
          
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Temukan preferensi belajar Anda melalui asesmen berbasis teori
            Experiential Learning. Hasil akan membantu Anda memahami cara
            belajar yang paling efektif untuk Anda.
          </p>
        </div>

        {/* Task 25: NonDiagnosticNotice dengan shadcn Alert */}
        <NonDiagnosticNotice />

        {/* Task 25: Info Cards dengan shadcn Card */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Apa yang Akan Anda Lakukan?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Menjawab {assessmentData?.total_items || 12} item dengan mengurutkan 4 pernyataan</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Setiap item berisi 4 mode belajar (CE, RO, AC, AE)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Waktu: sekitar 15-20 menit</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Apa yang Anda Dapatkan?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Profil gaya belajar Anda (9 tipe)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Learning Flexibility Index (LFI)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Rekomendasi strategi belajar</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Consent Card */}
        <Card>
          <CardHeader>
            <CardTitle>Persetujuan Penggunaan</CardTitle>
            <CardDescription>
              Dengan melanjutkan, Anda memahami bahwa:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>
                  Hasil digunakan untuk membantu refleksi belajar dan perancangan
                  aktivitas kelas
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>
                  Data dapat diakses oleh fasilitator yang ditunjuk
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>
                  Data tidak digunakan untuk penilaian nilai akademik atau seleksi
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Start Button (Zona Hijau - Guidelines §1.3.2) */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleStartAssessment}
            disabled={!session || !assessmentData}
            size="lg"
            className="gap-3 px-8 py-6"
          >
            <Play className="h-5 w-5" />
            <span>Mulai Asesmen</span>
          </Button>
        </div>
      </main>
    </div>
  );
};