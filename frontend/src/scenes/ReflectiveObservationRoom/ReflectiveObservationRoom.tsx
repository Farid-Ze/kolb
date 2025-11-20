import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNonBlockingNavigate } from '../../hooks/useNonBlockingNavigate';
import { useQuery } from '@tanstack/react-query';
import { GlassMaterial } from '../../core/design-system/Materials';
import { DisplayTitle, BodyText } from '../../core/design-system/Typography';
import { PageShell, RoomContent } from '../../core/design-system/Layout';
import { fadeInUp, staggerContainer } from '../../core/physics/motionPrimitives';
import { springs } from '../../core/physics/springs';
import { useRoomFocus } from '../../core/accessibility/useRoomFocus';
import { useAuth } from '../../contexts/AuthContext';
import { getSessions } from '../../services/sessionService';
import { LayeredIcon } from '../../components/ui/LayeredIcon';
import { Eye } from 'lucide-react';
import { useTelemetry } from '../../hooks/useTelemetry';

const ReflectiveObservationRoom: React.FC = () => {
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
        trackPageView('/experience/reflective', 'Reflective Observation Room');
    }, [trackPageView]);

    const cards = [
        { title: 'Perspective', content: 'View situations from multiple angles before deciding.' },
        { title: 'Reflection', content: 'Pause and name what stood out or surprised you.' },
        { title: 'Observation', content: 'Stay curious about patterns, not just outcomes.' },
    ];

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
        trackAction('room_cta_click', 'reflective-room', target, {
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
                    className="w-full flex flex-col items-center gap-12"
                >
                    {/* Hero Section */}
                    <div className="flex flex-col items-center gap-6 text-center max-w-3xl">
                        <motion.div variants={fadeInUp}>
                            <LayeredIcon 
                                icon={Eye} 
                                size="xl" 
                                color="chart-3" // Violet/Purple
                                enableParallax 
                                enableLighting 
                            />
                        </motion.div>
                        
                        <div className="outline-none space-y-4" ref={titleRef} tabIndex={-1}>
                            <DisplayTitle variants={fadeInUp} className="text-4xl md:text-6xl font-bold tracking-tight">
                                Reflective Observation
                            </DisplayTitle>
                            <BodyText tone="muted" variants={fadeInUp} className="text-lg md:text-xl leading-relaxed">
                                Step back and observe. This stage is about understanding the meaning of your experiences through careful reflection.
                            </BodyText>
                        </div>
                    </div>

                    {/* Cards Grid */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
                        variants={staggerContainer}
                    >
                        {cards.map((card, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                whileHover={{ y: -10, scale: 1.02 }}
                                transition={springs.interactive}
                            >
                                <GlassMaterial intensity="medium" className="h-64 p-8 flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-white/10 transition-all duration-500 border border-white/5 hover:border-white/20">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
                                        <Eye className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                                    <p className="text-white/60 text-sm leading-relaxed">{card.content}</p>
                                </GlassMaterial>
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.div variants={fadeInUp} className="pt-8">
                        <button
                            onClick={handleAction}
                            className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg tracking-wide hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]"
                        >
                            {isAuthenticated 
                                ? (activeSession ? 'Continue Reflection' : 'Start Observation')
                                : 'Sign In to Reflect'}
                        </button>
                    </motion.div>
                </motion.div>
            </RoomContent>
        </PageShell>
    );
};

export default ReflectiveObservationRoom;
