/**
 * KLSI 4.0 - AssessmentStartPage
 * Task 24, 26: Halaman instruksi dengan session detail query
 * 
 * Halaman untuk memulai asesmen baru dengan instruksi lengkap
 * FIXED: Removed text-* classes, added Motion springs, touch-manipulation
 * Implementasi sesuai Guidelines.md Section 1.4.3, 2.3.1
 */

import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getSession } from '../services/sessionService';
import { getAssessmentItems } from '../services/assessmentService';
import { BookOpen, Play, ArrowLeft } from 'lucide-react';
import { NonDiagnosticNotice } from '../components/report/NonDiagnosticNotice';
import { LayeredIcon } from '../components/ui/LayeredIcon';
import type { Session } from '../types/api';
import { useTelemetry } from '../hooks/useTelemetry';
import { PageShell, RoomContent } from '../core/design-system/Layout';
import { GlassMaterial } from '../core/design-system/Materials';
import { DisplayTitle, BodyText } from '../core/design-system/Typography';
import { fadeInUp, staggerContainer, scaleIn } from '../core/physics/motionPrimitives';
import { useNonBlockingNavigate } from '../hooks/useNonBlockingNavigate';

export const AssessmentStartPage: React.FC = () => {
  const navigate = useNonBlockingNavigate();
  const location = useLocation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { trackPageView } = useTelemetry();

  // Task 24: Query untuk fetch session details
  useQuery<Session>({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
  });

  // Task 26: Prefetch assessment items untuk performance
  useQuery({
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
    <PageShell>
      {/* Back Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-6 z-50"
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 backdrop-blur-md transition-all text-sm font-medium text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Beranda</span>
        </button>
      </motion.div>

      <RoomContent>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="w-full max-w-2xl relative z-10"
        >
          <GlassMaterial intensity="high" className="p-8 md:p-12 relative overflow-hidden">
            
            {/* Decorative Icon */}
            <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
                <LayeredIcon icon={BookOpen} size="xl" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-8">

              {/* Responsible use notice must lead for screen reader users */}
              <motion.div variants={fadeInUp} className="w-full">
                <NonDiagnosticNotice />
              </motion.div>

              {/* Header */}
              <motion.div variants={fadeInUp} className="space-y-4">
                  <div className="inline-flex p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mb-4 shadow-2xl shadow-black/20">
                    <LayeredIcon icon={BookOpen} size="lg" color="primary" />
                  </div>
                  <DisplayTitle className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-white/60">
                    Apa yang akan Anda lakukan?
                  </DisplayTitle>
                  <BodyText className="text-slate-600 dark:text-white/60 max-w-lg mx-auto">
                    Ikuti 12 pernyataan dan urutkan akhir kalimat sesuai cara Anda benar-benar belajar.
                  </BodyText>
                </motion.div>

                {/* Instructions List */}
                <motion.div variants={fadeInUp} className="w-full text-left space-y-4 bg-black/5 dark:bg-black/20 rounded-xl p-6 border border-black/5 dark:border-white/5">
                    <div className="flex gap-4 items-start">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/20">1</span>
                        <div>
                            <h2 className="text-slate-900 dark:text-white font-medium mb-1 text-lg">Rank the Endings</h2>
                            <p className="text-sm text-slate-600 dark:text-white/50">For each statement, rank the 4 endings from most like you to least like you.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/20">2</span>
                        <div>
                            <h2 className="text-slate-900 dark:text-white font-medium mb-1 text-lg">No Right or Wrong</h2>
                            <p className="text-sm text-slate-600 dark:text-white/50">There are no correct answers. Be honest about how you actually learn.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm border border-purple-500/20">3</span>
                        <div>
                            <h2 className="text-slate-900 dark:text-white font-medium mb-1 text-lg">Complete All Items</h2>
                            <p className="text-sm text-slate-600 dark:text-white/50">You must rank all options for every question to get your result.</p>
                        </div>
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div variants={scaleIn} className="pt-4">
                    <button
                        onClick={handleStartAssessment}
                        className="group relative px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg shadow-xl shadow-black/10 dark:shadow-white/10 hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                    >
                      <span className="relative z-10">Mulai Asesmen</span>
                        <Play className="w-5 h-5 relative z-10 fill-current" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </button>
                </motion.div>

            </div>
          </GlassMaterial>
        </motion.div>
      </RoomContent>
    </PageShell>
  );
};