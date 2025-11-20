import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { GlassMaterial } from '../../core/design-system/Materials';
import { DisplayTitle, BodyText } from '../../core/design-system/Typography';
import { PageShell, RoomContent } from '../../core/design-system/Layout';
import { springs } from '../../core/physics/springs';
import { fadeInUp, staggerContainer, scaleIn } from '../../core/physics/motionPrimitives';
import { useRoomFocus } from '../../core/accessibility/useRoomFocus';

const ConcreteExperienceRoom: React.FC = () => {
    const cardRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useRoomFocus(titleRef);

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
                    className="w-full"
                >
                    <GlassMaterial intensity="high" className="p-12 flex flex-col gap-8 items-center text-center">
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="flex flex-col items-center gap-6"
                        >
                            <motion.div
                                variants={scaleIn}
                                className="text-7xl mb-2"
                            >
                                ❤️
                            </motion.div>

                            <div ref={titleRef} tabIndex={-1} className="outline-none">
                                <DisplayTitle variants={fadeInUp}>
                                    Concrete Experience
                                </DisplayTitle>
                            </div>

                            <BodyText tone="muted" variants={fadeInUp}>
                                Learning begins with being fully present in the moment.
                                Feel the weight of your experiences without judgment.
                                This room represents the "Feeling" dimension of the Kolb cycle.
                            </BodyText>

                            <motion.button
                                variants={fadeInUp}
                                className="mt-4 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-semibold shadow-lg shadow-emerald-500/20 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Explore Feelings
                            </motion.button>
                        </motion.div>
                    </GlassMaterial>
                </motion.div>
            </RoomContent>
        </PageShell>
    );
};

export default ConcreteExperienceRoom;
