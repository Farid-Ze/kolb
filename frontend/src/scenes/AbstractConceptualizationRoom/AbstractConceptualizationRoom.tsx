import React, { useEffect, useRef } from 'react';
import { useNonBlockingNavigate } from '../../hooks/useNonBlockingNavigate';
import { motion } from 'framer-motion';
import { GlassMaterial } from '../../core/design-system/Materials';
import { DisplayTitle, BodyText } from '../../core/design-system/Typography';
import { PageShell, RoomContent } from '../../core/design-system/Layout';
import { fadeInUp, staggerContainer, scaleIn } from '../../core/physics/motionPrimitives';
import { useRoomFocus } from '../../core/accessibility/useRoomFocus';
import { useAuth } from '../../contexts/useAuth';
import { useLatestAssessmentSession } from '../../core/api/hooks';
import { LayeredIcon } from '../../components/ui/LayeredIcon';
import { Brain } from 'lucide-react';
import { useTelemetry } from '../../hooks/useTelemetry';
import type { AssessmentResults } from '../../core/api/client';

// Helper to map scores to -1..1 coordinate space
// X-axis: AE (Left) vs RO (Right) -> Range: -1 (AE) to 1 (RO)
// Y-axis: AC (Top) vs CE (Bottom) -> Range: -1 (AC) to 1 (CE)
const mapScoresToQuadrantPosition = (results?: AssessmentResults): { x: number; y: number } => {
    const MAX_DIFF = 40;

    const normalized = (value: number | undefined) => {
        if (value === undefined || value === null) {
            return 0;
        }
        return Math.max(-1, Math.min(1, -(value / MAX_DIFF)));
    };

    if (!results) return { x: 0, y: 0 };

    return {
        x: normalized(results.aero_score),
        y: normalized(results.acce_score),
    };
};

const AbstractConceptualizationRoom: React.FC = () => {
    const navigate = useNonBlockingNavigate();
    const { isAuthenticated } = useAuth();
    const { trackPageView, trackAction } = useTelemetry();
    const titleRef = useRef<HTMLHeadingElement>(null);
    useRoomFocus(titleRef);

    // Check for latest completed session
    const { data: session } = useLatestAssessmentSession();

    useEffect(() => {
        trackPageView('/experience/abstract', 'Abstract Conceptualization Room');
    }, [trackPageView]);

    const hasResults = session?.status === 'completed' && !!session.results;
    const position = hasResults ? mapScoresToQuadrantPosition(session.results) : { x: 0, y: 0 };

    const resolveActionTarget = () => {
        if (!isAuthenticated) {
            return '/auth/login';
        }
        // If we have results, maybe go to full report?
        if (hasResults) {
            return `/report/${session.id}`;
        }
        return '/assessment/start';
    };

    const handleAction = () => {
        const target = resolveActionTarget();
        trackAction('room_cta_click', 'abstract-room', target, {
            hasCompleted: hasResults,
        });
        navigate(target);
    };

    return (
        <PageShell>
            <RoomContent>
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="w-full flex flex-col items-center gap-10"
                >
                    {/* Hero Section */}
                    <div className="flex flex-col items-center gap-6 text-center max-w-3xl">
                        <motion.div variants={fadeInUp}>
                            <LayeredIcon 
                                icon={Brain} 
                                size="xl" 
                                color="primary" // Blue
                                enableParallax 
                                enableLighting 
                            />
                        </motion.div>
                        
                        <div className="outline-none space-y-4" ref={titleRef} tabIndex={-1}>
                            <DisplayTitle variants={fadeInUp} className="text-4xl md:text-6xl font-bold tracking-tight">
                                Abstract Conceptualization
                            </DisplayTitle>
                            <BodyText tone="muted" variants={fadeInUp} className="text-lg md:text-xl leading-relaxed">
                                Distilling observations into sound theories. This stage focuses on logic, ideas, and systematic planning.
                            </BodyText>
                        </div>
                    </div>

                    {/* 2D Quadrant Diagram */}
                    <div className="flex flex-col items-center gap-6 relative">
                        <motion.div variants={scaleIn} className="relative w-full max-w-md aspect-square">
                            <GlassMaterial intensity="high" className="w-full h-full p-8 relative overflow-hidden border border-white/10">
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
                            </GlassMaterial>
                        </motion.div>
                    </div>

                    {hasResults && (
                        <GlassMaterial intensity="medium" className="w-full max-w-2xl p-6 text-center">
                            <BodyText tone="muted" className="text-base">
                                Latest insights: <span className="text-white font-semibold">{session?.results?.learning_style ?? 'Style processing'}</span>
                            </BodyText>
                        </GlassMaterial>
                    )}

                    <motion.div variants={fadeInUp} className="pt-8">
                        <button
                            onClick={handleAction}
                            className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg tracking-wide hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]"
                        >
                            {isAuthenticated 
                                ? (hasResults ? 'View Full Report' : 'Start Assessment')
                                : 'Sign In to Think'}
                        </button>
                    </motion.div>
                </motion.div>
            </RoomContent>
        </PageShell>
    );
};

export default AbstractConceptualizationRoom;
