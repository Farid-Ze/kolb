import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { GlassMaterial } from '../../core/design-system/Materials';
import { DisplayTitle, BodyText } from '../../core/design-system/Typography';
import { PageShell, RoomContent } from '../../core/design-system/Layout';
import { fadeInUp, staggerContainer } from '../../core/physics/motionPrimitives';
import { useRoomFocus } from '../../core/accessibility/useRoomFocus';

const IntroRoom: React.FC = () => {
    const titleRef = useRef<HTMLHeadingElement>(null);
    useRoomFocus(titleRef);

    return (
        <PageShell>
            <RoomContent>
                <GlassMaterial intensity="medium" className="p-12 w-full max-w-2xl text-center">
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col gap-6"
                    >
                        <div ref={titleRef} tabIndex={-1} className="outline-none">
                            <DisplayTitle variants={fadeInUp}>
                                Kolb Learning Style Inventory 4.0
                            </DisplayTitle>
                        </div>

                        <BodyText tone="muted" variants={fadeInUp}>
                            Discover how you learn. Navigate through the four stages of the learning cycle to understand your unique approach to problem-solving and growth.
                        </BodyText>
                    </motion.div>
                </GlassMaterial>
            </RoomContent>
        </PageShell>
    );
};

export default IntroRoom;
