import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassMaterial } from '../core/design-system/Materials';
import { DisplayTitle, BodyText, Heading } from '../core/design-system/Typography';
import { PageShell, RoomContent } from '../core/design-system/Layout';
import { fadeInUp, staggerContainer, scaleIn } from '../core/physics/motionPrimitives';
import { api, ReportData } from '../core/api/client';

export const ReportPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!sessionId) return;
      try {
        setLoading(true);
        const data = await api.getReport(Number(sessionId));
        setReport(data);
      } catch (err) {
        console.error("Failed to fetch report:", err);
        setError("Failed to load report. Please try again.");
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
          <div className="flex items-center justify-center h-full">
            <BodyText>Loading results...</BodyText>
          </div>
        </RoomContent>
      </PageShell>
    );
  }

  if (error || !report) {
    return (
      <PageShell>
        <RoomContent>
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <BodyText className="text-red-400">{error || "Report not found"}</BodyText>
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              Return Home
            </button>
          </div>
        </RoomContent>
      </PageShell>
    );
  }

  // Map scores to -1..1 coordinate space for the grid
  // X-axis: AE (Left) vs RO (Right) -> Range: -1 (AE) to 1 (RO)
  // Y-axis: AC (Top) vs CE (Bottom) -> Range: -1 (AC) to 1 (CE)
  const MAX_DIFF = 40; 
  
  // AERO = AE - RO. 
  // If AE is high (Left), AERO is positive.
  // If RO is high (Right), AERO is negative.
  // So X = -AERO / MAX_DIFF (to map positive AERO to negative X/Left)
  
  // ACCE = AC - CE.
  // If AC is high (Top), ACCE is positive.
  // If CE is high (Bottom), ACCE is negative.
  // So Y = -ACCE / MAX_DIFF (to map positive ACCE to negative Y/Top)

  const x = Math.max(-1, Math.min(1, -(report.raw.AERO) / MAX_DIFF));
  const y = Math.max(-1, Math.min(1, -(report.raw.ACCE) / MAX_DIFF));

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
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-bold tracking-widest text-white/50">AC (Thinking)</div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold tracking-widest text-white/50">CE (Feeling)</div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold tracking-widest text-white/50">AE (Doing)</div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold tracking-widest text-white/50">RO (Watching)</div>

                  {/* Quadrants */}
                  <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                    {/* Top Left: AC + AE = Deciding/Converging? No, let's stick to generic labels or style names if possible */}
                    <div className="flex items-center justify-center p-4 border-r border-b border-white/5"><span className="text-white/10 font-bold">Thinking & Doing</span></div>
                    <div className="flex items-center justify-center p-4 border-b border-white/5"><span className="text-white/10 font-bold">Thinking & Watching</span></div>
                    <div className="flex items-center justify-center p-4 border-r border-white/5"><span className="text-white/10 font-bold">Feeling & Doing</span></div>
                    <div className="flex items-center justify-center p-4"><span className="text-white/10 font-bold">Feeling & Watching</span></div>
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
                <Heading level={3} className="mb-4">Scale Scores</Heading>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Concrete Experience (CE)</span>
                    <span className="font-mono font-bold">{report.raw.CE}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Reflective Observation (RO)</span>
                    <span className="font-mono font-bold">{report.raw.RO}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Abstract Conceptualization (AC)</span>
                    <span className="font-mono font-bold">{report.raw.AC}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Active Experimentation (AE)</span>
                    <span className="font-mono font-bold">{report.raw.AE}</span>
                  </div>
                </div>
              </GlassMaterial>
            </div>

            {/* Details Column */}
            <div className="flex flex-col gap-6">
              <motion.div variants={fadeInUp}>
                <GlassMaterial intensity="high" className="p-8 border-l-4 border-amber-500">
                  <div className="uppercase tracking-widest text-xs font-bold text-amber-500 mb-2">Primary Learning Style</div>
                  <DisplayTitle className="text-3xl mb-4">{report.style.primary_name}</DisplayTitle>
                  <BodyText className="text-lg leading-relaxed text-white/90">
                    {report.style.primary_brief}
                  </BodyText>
                </GlassMaterial>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <GlassMaterial className="p-8">
                  <Heading level={3} className="mb-4">Detailed Analysis</Heading>
                  <BodyText className="text-white/70 leading-relaxed whitespace-pre-line">
                    {report.style.primary_detail}
                  </BodyText>
                </GlassMaterial>
              </motion.div>

              {report.lfi && (
                <motion.div variants={fadeInUp}>
                  <GlassMaterial className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <Heading level={3}>Learning Flexibility</Heading>
                      <div className="px-3 py-1 rounded-full bg-white/10 text-sm font-bold">
                        LFI: {report.lfi.value.toFixed(2)}
                      </div>
                    </div>
                    <BodyText className="text-white/70">
                      Your flexibility level is <strong>{report.lfi.level_label}</strong>. 
                      This indicates your ability to adapt your learning approach to different situations.
                    </BodyText>
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

