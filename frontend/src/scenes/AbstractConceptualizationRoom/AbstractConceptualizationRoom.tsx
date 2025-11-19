import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { GlassMaterial } from '../../core/design-system/Materials';
import { DisplayTitle, BodyText } from '../../core/design-system/Typography';
import { PageShell, RoomContent } from '../../core/design-system/Layout';
import { fadeInUp, staggerContainer, scaleIn } from '../../core/physics/motionPrimitives';
import { useLatestAssessmentSession } from '../../core/api/hooks';
import { useRoomFocus } from '../../core/accessibility/useRoomFocus';

const AbstractConceptualizationRoom: React.FC = () => {
  const { data: session, isLoading, isError } = useLatestAssessmentSession();
  const titleRef = useRef<HTMLHeadingElement>(null);
  useRoomFocus(titleRef);

  return (
    <PageShell>
      <RoomContent>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center gap-10"
        >
          <div className="text-center max-w-2xl" ref={titleRef} tabIndex={-1} className="outline-none">
            <DisplayTitle variants={fadeInUp}>Abstract Conceptualization</DisplayTitle>
            <BodyText tone="muted" className="mt-4" variants={fadeInUp}>
              Distilling observations into sound theories. This stage focuses on logic, ideas, and systematic planning.
            </BodyText>
          </div>

          {/* 2D Quadrant Diagram */}
          <motion.div variants={scaleIn} className="relative w-full max-w-md aspect-square">
            <GlassMaterial intensity="high" className="w-full h-full p-8 relative">
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
              
              {/* Mock Data Point */}
              <motion.div 
                className="absolute top-1/2 left-1/2 w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)] border-2 border-white"
                initial={{ scale: 0, x: '-50%', y: '-50%' }}
                animate={{ scale: 1, x: '-50%', y: '-50%' }}
                transition={{ delay: 0.8, type: 'spring' }}
              />
            </GlassMaterial>
          </motion.div>

          {/* API Status Indicator */}
          <motion.div variants={fadeInUp} className="h-8">
            {isLoading ? (
              <span className="text-xs text-white/30 animate-pulse">Checking assessment status...</span>
            ) : isError ? (
              <span className="text-xs text-red-400">Unable to load assessment data</span>
            ) : session ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-200">Latest assessment loaded</span>
              </div>
            ) : (
              <span className="text-xs text-white/30">No assessment data found</span>
            )}
          </motion.div>

        </motion.div>
      </RoomContent>
    </PageShell>
  );
};

export default AbstractConceptualizationRoom;
