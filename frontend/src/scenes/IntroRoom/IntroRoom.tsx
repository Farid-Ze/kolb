import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNonBlockingNavigate } from '../../hooks/useNonBlockingNavigate';
import { useQuery } from '@tanstack/react-query';
import { GlassMaterial } from '../../core/design-system/Materials';
import { DisplayTitle, BodyText } from '../../core/design-system/Typography';
import { PageShell, RoomContent } from '../../core/design-system/Layout';
import { fadeInUp, staggerContainer, scaleIn } from '../../core/physics/motionPrimitives';
import { useRoomFocus } from '../../core/accessibility/useRoomFocus';
import { useAuth } from '../../contexts/useAuth';
import { getSessions } from '../../services/sessionService';
import { LayeredIcon } from '../../components/ui/LayeredIcon';
import { Compass, ArrowRight } from 'lucide-react';
import { useTelemetry } from '../../hooks/useTelemetry';

const IntroRoom: React.FC = () => {
    const titleRef = useRef<HTMLHeadingElement>(null);
    useRoomFocus(titleRef);
    const navigate = useNonBlockingNavigate();
    const { isAuthenticated } = useAuth();
    const { trackPageView, trackAction } = useTelemetry();

    // Check for active session
    const { data: sessions } = useQuery({
        queryKey: ['sessions', 'active'],
        queryFn: () => getSessions({ status: 'ACTIVE', limit: 1 }),
        enabled: isAuthenticated,
    });

    const activeSession = sessions?.[0];

    useEffect(() => {
        trackPageView('/experience/intro', 'Intro Room');
    }, [trackPageView]);

    const resolveActionTarget = () => {
        if (!isAuthenticated) {
            return '/auth/login';
        }
        if (activeSession) {
            return `/assessment/${activeSession.id}`;
        }
        return '/assessment/start';
    };

    const handleAction = () => {
        const target = resolveActionTarget();
        trackAction('room_cta_click', 'intro-room', target, {
            hasActiveSession: Boolean(activeSession),
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
                    className="flex flex-col items-center gap-8 max-w-4xl mx-auto"
                >
                    {/* Hero Icon */}
                    <motion.div variants={scaleIn} className="mb-4">
                        <LayeredIcon 
                            icon={Compass} 
                            size="xl" 
                            color="primary" 
                            enableParallax 
                            enableLighting 
                        />
                    </motion.div>

                    <GlassMaterial intensity="high" className="p-12 w-full text-center relative overflow-hidden group">
                        {/* Decorative background gradient inside the card */}
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <div className="relative z-10 flex flex-col gap-6 items-center">
                            <div ref={titleRef} tabIndex={-1} className="outline-none">
                                <DisplayTitle variants={fadeInUp} className="text-4xl md:text-6xl font-bold tracking-tight">
                                    The Learning Cycle
                                </DisplayTitle>
                            </div>

                            <BodyText tone="muted" variants={fadeInUp} className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                                Learning is not a destination, but a continuous journey of transformation.
                                These rooms trace Kolb’s Experiential Learning Theory so you understand the
                                “why” before the instrument captures your real responses.
                            </BodyText>

                            <motion.div variants={fadeInUp} className="pt-8">
                                <button
                                    onClick={handleAction}
                                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg tracking-wide hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                                >
                                    <span>
                                        {isAuthenticated 
                                            ? (activeSession ? 'Continue Journey' : 'Begin Assessment')
                                            : 'Sign In to Start'}
                                    </span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        </div>
                    </GlassMaterial>

                    {/* Footer / Context */}
                    <motion.div
                        variants={fadeInUp}
                        className="flex flex-col md:flex-row items-center gap-6 text-white/40 text-sm tracking-widest uppercase"
                    >
                        <span className="font-semibold">Experiential Learning Theory</span>
                        <span className="hidden md:block">•</span>
                        <div className="flex gap-4 text-xs md:text-sm">
                            <span>Concrete → Reflective</span>
                            <span>Abstract → Active</span>
                        </div>
                    </motion.div>
                </motion.div>
            </RoomContent>
        </PageShell>
    );
};

export default IntroRoom;
