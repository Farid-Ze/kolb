import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassMaterial } from '../../core/design-system/Materials';
import { DisplayTitle, BodyText } from '../../core/design-system/Typography';
import { PageShell, RoomContent } from '../../core/design-system/Layout';
import { fadeInUp, staggerContainer, scaleIn } from '../../core/physics/motionPrimitives';
import { useLatestAssessmentSession } from '../../core/api/hooks';
import { useRoomFocus } from '../../core/accessibility/useRoomFocus';
import { AssessmentResults } from '../../core/api/client';
import { AuthNotice } from '../../core/auth/AuthNotice';

// Helper to map scores to -1..1 coordinate space
// X-axis: AE (Left) vs RO (Right) -> Range: -1 (AE) to 1 (RO)
// Y-axis: AC (Top) vs CE (Bottom) -> Range: -1 (AC) to 1 (CE)
const mapScoresToQuadrantPosition = (results: AssessmentResults) => {
  const MAX_DIFF = 40; // Approximate max difference between opposing modes
  
  // RO - AE: Positive = Right (RO), Negative = Left (AE)
  const xRaw = results.ro_score - results.ae_score;
  const x = Math.max(-1, Math.min(1, xRaw / MAX_DIFF));

  // CE - AC: Positive = Bottom (CE), Negative = Top (AC)
  const yRaw = results.ce_score - results.ac_score;
  const y = Math.max(-1, Math.min(1, yRaw / MAX_DIFF));

  return { x, y };
};

const AbstractConceptualizationRoom: React.FC = () => {
  const navigate = useNavigate();
  const { data: session, isLoading, isError, isUnauthorized } = useLatestAssessmentSession();
  const titleRef = useRef<HTMLHeadingElement>(null);
  useRoomFocus(titleRef);

  const hasResults = session?.status === 'completed' && session?.results;
  const position = hasResults ? mapScoresToQuadrantPosition(session.results!) : { x: 0, y: 0 };

  return (
    <PageShell>
      <RoomContent>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center gap-10"
        >
          <div className="text-center max-w-2xl outline-none" ref={titleRef} tabIndex={-1}>
            <DisplayTitle variants={fadeInUp}>Abstract Conceptualization</DisplayTitle>
            <BodyText tone="muted" className="mt-4" variants={fadeInUp}>
              Distilling observations into sound theories. This stage focuses on logic, ideas, and systematic planning.
            </BodyText>
          </div>

          {/* 2D Quadrant Diagram */}
          <div className="flex flex-col items-center gap-6 relative">
            <motion.div variants={scaleIn} className="relative w-full max-w-md aspect-square">
              <GlassMaterial intensity="high" className="w-full h-full p-8 relative overflow-hidden">
                {/* Axes */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-px bg-white/20" /> {/* Horizontal AE-RO */}
                  <div className="h-full w-px bg-white/20 absolute" /> {/* Vertical AC-CE */}
                </div>

                {/* Labels */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-bold tracking-widest text-white/50">AC</div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold tracking-widest text-white/50">CE</div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold tracking-widest text-white/50">AE</div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold tracking-widest text-white/50">RO</div>

                {/* Quadrants (Interactive Areas) */}
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                  {['Thinking', 'Deciding', 'Acting', 'Feeling'].map((label, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors cursor-crosshair"
                      whileHover={{ scale: 0.98 }}
                    >
                      <span className="opacity-0 hover:opacity-100 transition-opacity text-sm text-white/70 font-medium">
                        {label}
                      </span>
                    </motion.div>
                  ))}
                </div>
                
                {/* Data Point */}
                {hasResults && (
                  <motion.div 
                    className="absolute w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)] border-2 border-white z-10"
                    initial={{ scale: 0, left: '50%', top: '50%', x: '-50%', y: '-50%' }}
                    animate={{ 
                      scale: 1, 
                      left: `${50 + position.x * 40}%`, // Scale by 40% to keep within padding
                      top: `${50 + position.y * 40}%`,
                      x: '-50%', 
                      y: '-50%' 
                    }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
                  />
                )}

                {/* Auth / No Data Overlay */}
                {(!hasResults && !isLoading) && (
                   <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-sm">
                     <div className="text-center p-6 w-full">
                       {isUnauthorized ? (
                          <AuthNotice 
                            message="Sign in to view your learning style"
                            onActionClick={() => navigate('/auth/login')}
                            className="bg-transparent shadow-none" // Override default styles to fit overlay
                          />
                       ) : (
                          <BodyText className="text-white/60">Complete an assessment to see your results</BodyText>
                       )}
                     </div>
                   </div>
                )}
              </GlassMaterial>
            </motion.div>

            {/* Style Label Badge */}
            {hasResults && session.results?.learning_style && (
              <motion.div 
                variants={fadeInUp}
                className="px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md"
              >
                <span className="text-sm text-white/60 uppercase tracking-wider mr-2">Style:</span>
                <span className="text-emerald-400 font-bold">{session.results.learning_style}</span>
              </motion.div>
            )}
          </div>

          {/* API Status Indicator */}
          <motion.div variants={fadeInUp} className="h-8">
            {isLoading ? (
              <span className="text-xs text-white/30 animate-pulse">Checking assessment status...</span>
            ) : isError && !isUnauthorized ? (
              <span className="text-xs text-red-400">Unable to load assessment data</span>
            ) : hasResults ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-200">Assessment Complete</span>
              </div>
            ) : null}
          </motion.div>

        </motion.div>
      </RoomContent>
    </PageShell>
  );
};

export default AbstractConceptualizationRoom;
