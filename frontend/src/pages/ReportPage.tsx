import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassMaterial } from '../core/design-system/Materials';
import { DisplayTitle, BodyText, SectionTitle } from '../core/design-system/Typography';
import { RoomContent, PageShell } from '../core/design-system/Layout';
import { fadeInUp, staggerContainer, scaleIn } from '../core/physics/motionPrimitives';
import { AuthNotice } from '../core/auth/AuthNotice';
import { getReport } from '../services/reportService';
import type { Report } from '../types/api';
import { useNonBlockingNavigate } from '../hooks/useNonBlockingNavigate';


export const ReportPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNonBlockingNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (!sessionId) {
        setError("No session ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        setIsUnauthorized(false);
        const data = await getReport(sessionId);
        setReport(data);
      } catch (err) {
        console.error("Failed to fetch report:", err);
        
        // Handle unauthorized errors specifically
        if (err instanceof Error && err.message.includes('401')) {
          setIsUnauthorized(true);
          setError(null);
        } else if (err instanceof Error) {
          // Handle other API errors
          if (err.message.includes('404')) {
            setError("Report not found. Please ensure the session has been completed.");
          } else if (err.message.includes('403')) {
            setError("You don't have permission to view this report.");
          } else {
            setError(`Failed to load report: ${err.message}`);
          }
        } else {
          setError("Failed to load report. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [sessionId]);

  if (loading) {
    return (
      <PageShell>
        <RoomContent>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
          >
            <div className="w-12 h-12 border-4 border-white/20 border-t-amber-500 rounded-full animate-spin" />
            <BodyText className="animate-pulse">Loading your learning profile...</BodyText>
          </motion.div>
        </RoomContent>
      </PageShell>
    );
  }

  // Handle unauthorized state with AuthNotice
  if (isUnauthorized) {
    return (
      <PageShell>
        <RoomContent>
          <div className="flex items-center justify-center min-h-[60vh]">
            <AuthNotice 
              title="Sign in required"
              message="Please sign in to view your learning profile"
              onActionClick={() => navigate('/auth/login')}
            />
          </div>
        </RoomContent>
      </PageShell>
    );
  }

  // Handle other errors
  if (error || !report) {
    return (
      <PageShell>
        <RoomContent>
          <motion.div 
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-md mx-auto"
          >
            <GlassMaterial intensity="high" className="p-8 flex flex-col items-center text-center gap-4 w-full">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                <span className="text-3xl">⚠️</span>
              </div>
              <SectionTitle className="text-red-400">Unable to Load Report</SectionTitle>
              <BodyText tone="muted">{error || "Report not found"}</BodyText>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="mt-4 px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors border border-white/20"
              >
                Return Home
              </motion.button>
            </GlassMaterial>
          </motion.div>
        </RoomContent>
      </PageShell>
    );
  }

  // Map scores to -1..1 coordinate space for the grid
  // X-axis: AE (Left) vs RO (Right) -> Range: -1 (AE) to 1 (RO)
  // Y-axis: AC (Top) vs CE (Bottom) -> Range: -1 (AC) to 1 (CE)
  const MAX_DIFF = 40; 
  
  // Check if raw data exists
  if (!report.raw) {
    return (
      <PageShell>
        <RoomContent>
          <motion.div 
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
          >
            <BodyText>Report data is incomplete. Please contact support.</BodyText>
          </motion.div>
        </RoomContent>
      </PageShell>
    );
  }
  
  // AERO = AE - RO. 
  // If AE is high (Left), AERO is positive.
  // If RO is high (Right), AERO is negative.
  // So X = -AERO / MAX_DIFF (to map positive AERO to negative X/Left)
  
  // ACCE = AC - CE.
  // If AC is high (Top), ACCE is positive.
  // If CE is high (Bottom), ACCE is negative.
  // So Y = -ACCE / MAX_DIFF (to map positive ACCE to negative Y/Top)

  const x = report.raw.AERO !== null ? Math.max(-1, Math.min(1, -(report.raw.AERO) / MAX_DIFF)) : 0;
  const y = report.raw.ACCE !== null ? Math.max(-1, Math.min(1, -(report.raw.ACCE) / MAX_DIFF)) : 0;

  return (
    <PageShell>
      <RoomContent>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full max-w-6xl mx-auto flex flex-col gap-12 pb-20"
        >
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto">
            <DisplayTitle variants={fadeInUp}>Your Learning Profile</DisplayTitle>
            <BodyText tone="muted" className="mt-4" variants={fadeInUp}>
              Based on your responses, here is your personalized learning style analysis.
            </BodyText>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Visualization Column */}
            <div className="flex flex-col gap-8">
              <motion.div variants={scaleIn} className="relative w-full aspect-square max-w-md mx-auto">
                <GlassMaterial intensity="high" className="w-full h-full p-8 relative">
                  {/* Axes */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-px bg-white/20" /> {/* Horizontal */}
                    <div className="h-full w-px bg-white/20 absolute" /> {/* Vertical */}
                  </div>

                  {/* Labels */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-bold tracking-widest text-white/50">
                    AC (Thinking)
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold tracking-widest text-white/50">
                    CE (Feeling)
                  </div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold tracking-widest text-white/50">
                    AE (Doing)
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold tracking-widest text-white/50">
                    RO (Watching)
                  </div>

                  {/* Quadrants - Learning Styles */}
                  <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                    {/* Top Left: AC + AE = Converging */}
                    <div className="flex items-center justify-center p-4 border-r border-b border-white/5">
                      <span className="text-white/10 font-bold text-xs text-center">Converging<br/>(AC + AE)</span>
                    </div>
                    {/* Top Right: AC + RO = Assimilating */}
                    <div className="flex items-center justify-center p-4 border-b border-white/5">
                      <span className="text-white/10 font-bold text-xs text-center">Assimilating<br/>(AC + RO)</span>
                    </div>
                    {/* Bottom Left: CE + AE = Accommodating */}
                    <div className="flex items-center justify-center p-4 border-r border-white/5">
                      <span className="text-white/10 font-bold text-xs text-center">Accommodating<br/>(CE + AE)</span>
                    </div>
                    {/* Bottom Right: CE + RO = Diverging */}
                    <div className="flex items-center justify-center p-4">
                      <span className="text-white/10 font-bold text-xs text-center">Diverging<br/>(CE + RO)</span>
                    </div>
                  </div>
                  
                  {/* Data Point */}
                  <motion.div 
                    className="absolute w-6 h-6 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.6)] border-2 border-white z-10"
                    initial={{ scale: 0, left: '50%', top: '50%', x: '-50%', y: '-50%' }}
                    animate={{ 
                      scale: 1, 
                      left: `${50 + x * 45}%`, // Scale by 45% to keep within padding
                      top: `${50 + y * 45}%`,
                      x: '-50%', 
                      y: '-50%' 
                    }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
                  />
                </GlassMaterial>
              </motion.div>

              {/* Raw Scores */}
              <GlassMaterial className="p-6">
                <SectionTitle className="text-xl mb-4">Scale Scores</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  {report.raw.CE !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Concrete Experience (CE)</span>
                      <span className="font-mono font-bold text-lg">{report.raw.CE}</span>
                    </div>
                  )}
                  {report.raw.RO !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Reflective Observation (RO)</span>
                      <span className="font-mono font-bold text-lg">{report.raw.RO}</span>
                    </div>
                  )}
                  {report.raw.AC !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Abstract Conceptualization (AC)</span>
                      <span className="font-mono font-bold text-lg">{report.raw.AC}</span>
                    </div>
                  )}
                  {report.raw.AE !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Active Experimentation (AE)</span>
                      <span className="font-mono font-bold text-lg">{report.raw.AE}</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-white/10 mt-4 pt-4">
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-3">Combined Dimensions</div>
                  <div className="grid grid-cols-2 gap-4">
                    {report.raw.ACCE !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">AC-CE (Thinking-Feeling)</span>
                        <span className="font-mono font-bold text-lg">{report.raw.ACCE}</span>
                      </div>
                    )}
                    {report.raw.AERO !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">AE-RO (Doing-Watching)</span>
                        <span className="font-mono font-bold text-lg">{report.raw.AERO}</span>
                      </div>
                    )}
                  </div>
                </div>
              </GlassMaterial>
            </div>

            {/* Details Column */}
            <div className="flex flex-col gap-6">
              {report.style && (
                <>
                  <motion.div variants={fadeInUp}>
                    <GlassMaterial intensity="high" className="p-8 border-l-4 border-amber-500">
                      <div className="uppercase tracking-widest text-xs font-bold text-amber-500 mb-2">Primary Learning Style</div>
                      <DisplayTitle className="text-3xl mb-4">{report.style.primary_name || 'Not Available'}</DisplayTitle>
                      <BodyText className="text-lg leading-relaxed text-white/90">
                        {report.style.primary_brief || 'Learning style analysis is being processed.'}
                      </BodyText>
                    </GlassMaterial>
                  </motion.div>

                  {report.style.primary_detail && (
                    <motion.div variants={fadeInUp}>
                      <GlassMaterial className="p-8">
                        <SectionTitle className="text-xl mb-4">Detailed Analysis</SectionTitle>
                        <BodyText className="text-white/70 leading-relaxed whitespace-pre-line">
                          {report.style.primary_detail}
                        </BodyText>
                      </GlassMaterial>
                    </motion.div>
                  )}
                </>
              )}

              {/* Percentile Scores (if available) */}
              {report.percentiles && (
                <motion.div variants={fadeInUp}>
                  <GlassMaterial className="p-8">
                    <SectionTitle className="text-xl mb-4">Percentile Rankings</SectionTitle>
                    <BodyText className="text-white/50 text-sm mb-4">
                      Your scores compared to the norm group{report.percentiles.norm_group_used ? `: ${report.percentiles.norm_group_used}` : ''}
                    </BodyText>
                    <div className="grid grid-cols-2 gap-3">
                      {report.percentiles.CE !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/60 text-sm">CE Percentile</span>
                          <span className="font-mono font-bold">{report.percentiles.CE}%</span>
                        </div>
                      )}
                      {report.percentiles.RO !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/60 text-sm">RO Percentile</span>
                          <span className="font-mono font-bold">{report.percentiles.RO}%</span>
                        </div>
                      )}
                      {report.percentiles.AC !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/60 text-sm">AC Percentile</span>
                          <span className="font-mono font-bold">{report.percentiles.AC}%</span>
                        </div>
                      )}
                      {report.percentiles.AE !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/60 text-sm">AE Percentile</span>
                          <span className="font-mono font-bold">{report.percentiles.AE}%</span>
                        </div>
                      )}
                    </div>
                  </GlassMaterial>
                </motion.div>
              )}

              {/* LFI (Learning Flexibility Index) */}
              {report.lfi && report.lfi.value !== null && (
                <motion.div variants={fadeInUp}>
                  <GlassMaterial className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <SectionTitle className="text-xl">Learning Flexibility</SectionTitle>
                      <div className="px-3 py-1 rounded-full bg-white/10 text-sm font-bold">
                        LFI: {report.lfi.value.toFixed(2)}
                      </div>
                    </div>
                    <BodyText className="text-white/70">
                      Your flexibility level is <strong className="text-white">{report.lfi.level_label || 'Unknown'}</strong>. 
                      This indicates your ability to adapt your learning approach to different situations.
                    </BodyText>
                    {report.lfi.percentile !== null && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center">
                          <span className="text-white/60 text-sm">LFI Percentile</span>
                          <span className="font-mono font-bold">{report.lfi.percentile}%</span>
                        </div>
                      </div>
                    )}
                  </GlassMaterial>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
        </RoomContent>
      </PageShell>
    );
  };

