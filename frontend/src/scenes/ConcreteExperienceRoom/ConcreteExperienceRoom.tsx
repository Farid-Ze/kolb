import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNonBlockingNavigate } from '../../hooks/useNonBlockingNavigate';
import { useQuery } from '@tanstack/react-query';
import { GlassMaterial } from '../../core/design-system/Materials';
import { DisplayTitle, BodyText } from '../../core/design-system/Typography';
import { PageShell, RoomContent } from '../../core/design-system/Layout';
import { springs } from '../../core/physics/springs';
import { fadeInUp, staggerContainer, scaleIn } from '../../core/physics/motionPrimitives';
import { useRoomFocus } from '../../core/accessibility/useRoomFocus';
import { useAuth } from '../../contexts/useAuth';
import { getSessions } from '../../services/sessionService';
import { LayeredIcon } from '../../components/ui/LayeredIcon';
import { Heart } from 'lucide-react';
import { useTelemetry } from '../../hooks/useTelemetry';

const ConcreteExperienceRoom: React.FC = () => {
    const cardRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const navigate = useNonBlockingNavigate();
    const { isAuthenticated } = useAuth();
    const { trackPageView, trackAction } = useTelemetry();

    useRoomFocus(titleRef);

    // Check for active session
    const { data: sessions } = useQuery({
        queryKey: ['sessions', 'active'],
        queryFn: () => getSessions({ status: 'ACTIVE', limit: 1 }),
        enabled: isAuthenticated,
    });
    const activeSession = sessions?.[0];

    useEffect(() => {
        trackPageView('/experience/concrete', 'Concrete Experience Room');
    }, [trackPageView]);

    // Mouse interaction for "mass" / parallax
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, springs.slow);
    const mouseY = useSpring(y, springs.slow);

    const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const mouseXRel = e.clientX - rect.left;
        const mouseYRel = e.clientY - rect.top;

        const xPct = (mouseXRel / width) - 0.5;
        const yPct = (mouseYRel / height) - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

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
        trackAction('room_cta_click', 'concrete-room', target, {
            hasActiveSession: Boolean(activeSession),
        });
        navigate(target);
    };

    return (
        <PageShell className="perspective-1000">
            <RoomContent>
                <motion.div
                    ref={cardRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        rotateX,
                        rotateY,
                        transformStyle: 'preserve-3d',
                    }}
                    className="w-full max-w-4xl mx-auto"
                >
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col items-center gap-8"
                    >
                        {/* Hero Icon */}
                        <motion.div variants={scaleIn} className="mb-4 transform-style-3d translate-z-12">
                            <LayeredIcon 
                                icon={Heart} 
                                size="xl" 
                                color="chart-2" // Emerald/Green (Feeling)
                                enableParallax 
                                enableLighting 
                            />
                        </motion.div>

                        <GlassMaterial intensity="high" className="p-12 w-full text-center relative overflow-hidden group transform-style-3d">
                            {/* Decorative background gradient */}
                            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            
                            <div className="relative z-10 flex flex-col gap-6 items-center transform-style-3d translate-z-8">
                                <div ref={titleRef} tabIndex={-1} className="outline-none">
                                    <DisplayTitle variants={fadeInUp} className="text-4xl md:text-6xl font-bold tracking-tight">
                                        Concrete Experience
                                    </DisplayTitle>
                                </div>

                                <BodyText tone="muted" variants={fadeInUp} className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                                    Learning begins with feeling. Being involved in new experiences, relying on intuition, and being open to people.
                                    This is the "Feeling" dimension—where raw experience happens and context matters.
                                </BodyText>

                                <motion.ul variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left text-sm text-white/70 w-full">
                                    {['Notice the sensory details.', 'Stay open to emotion and empathy.', 'Capture quick reflections before they fade.'].map((tip) => (
                                        <li key={tip} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                            {tip}
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
                                                ? (activeSession ? 'Continue Feeling' : 'Start Experience')
                                                : 'Sign In to Start'}
                                        </span>
                                    </button>
                                </motion.div>
                            </div>
                        </GlassMaterial>
                    </motion.div>
                </motion.div>
            </RoomContent>
        </PageShell>
    );
};

export default ConcreteExperienceRoom;
