import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNonBlockingNavigate } from '../../hooks/useNonBlockingNavigate';
import { GlassMaterial } from '../../core/design-system/Materials';
import { DisplayTitle, BodyText } from '../../core/design-system/Typography';
import { PageShell, RoomContent } from '../../core/design-system/Layout';
import { fadeInUp, staggerContainer, scaleIn } from '../../core/physics/motionPrimitives';
import { useRoomFocus } from '../../core/accessibility/useRoomFocus';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../core/api/client';
import { useLatestAssessmentSession } from '../../core/api/hooks';
import { LayeredIcon } from '../../components/ui/LayeredIcon';
import { Rocket } from 'lucide-react';
import { useTelemetry } from '../../hooks/useTelemetry';
import { toast } from 'sonner';

const ActiveExperimentationRoom: React.FC = () => {
    const titleRef = useRef<HTMLHeadingElement>(null);
    useRoomFocus(titleRef);
    const navigate = useNonBlockingNavigate();
    const { isAuthenticated } = useAuth();
    const { trackPageView, trackAction } = useTelemetry();

    // Check for active session using new hook
    const { data: latestSession } = useLatestAssessmentSession();
    const activeSession = latestSession?.status !== 'completed' ? latestSession : null;

    useEffect(() => {
        trackPageView('/experience/active', 'Active Experimentation Room');
    }, [trackPageView]);

    const handleAction = async () => {
        if (!isAuthenticated) {
            navigate('/auth/login');
            return;
        }
        
        if (activeSession) {
            navigate(`/assessment/${activeSession.id}`);
            return;
        }

        try {
            const { session_id } = await api.startSession();
            trackAction('session_start', 'active-room', `/assessment/${session_id}`);
            navigate(`/assessment/${session_id}`);
        } catch (error) {
            console.error('Failed to start session:', error);
            toast.error('Failed to start session. Please try again.');
        }
    };

    return (
        <PageShell>
            <RoomContent>
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col items-center gap-8 max-w-4xl mx-auto"
                >
                    {/* Hero Icon */}
                    <motion.div variants={scaleIn} className="mb-4 transform-style-3d translate-z-12">
                        <LayeredIcon 
                            icon={Rocket} 
                            size="xl" 
                            color="chart-4" // Indigo/Red (Active)
                            enableParallax 
                            enableLighting 
                        />
                    </motion.div>

                    <GlassMaterial intensity="high" className="p-12 w-full text-center relative overflow-hidden group transform-style-3d">
                        {/* Decorative background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <div className="relative z-10 flex flex-col gap-6 items-center transform-style-3d translate-z-8">
                            <div ref={titleRef} tabIndex={-1} className="outline-none">
                                <DisplayTitle variants={fadeInUp} className="text-4xl md:text-6xl font-bold tracking-tight">
                                    Active Experimentation
                                </DisplayTitle>
                            </div>

                            <BodyText tone="muted" variants={fadeInUp} className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                                Learning requires action. Testing theories in the real world, taking risks, and influencing people and events.
                                This is the "Doing" dimension—where ideas meet reality.
                            </BodyText>

                            <motion.ul variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left text-sm text-white/70 w-full">
                                {[
                                    'Rank 12 items by intuition and evidence.',
                                    'Complete 8 context prompts for the LFI model.',
                                    'Review everything before finalizing your profile.',
                                ].map((step) => (
                                    <li key={step} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        {step}
                                    </li>
                                ))}
                            </motion.ul>

                            <motion.div variants={fadeInUp} className="pt-8">
                                <button
                                    onClick={handleAction}
                                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg tracking-wide hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                                >
                                        <span>
                                            {isAuthenticated 
                                                ? (activeSession ? 'Continue Action' : 'Start Experimenting')
                                                : 'Sign In to Start'}
                                        </span>
                                </button>
                            </motion.div>
                        </div>
                    </GlassMaterial>
                </motion.div>
            </RoomContent>
        </PageShell>
    );
};

export default ActiveExperimentationRoom;