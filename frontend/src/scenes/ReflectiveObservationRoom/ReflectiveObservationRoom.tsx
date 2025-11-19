import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { GlassMaterial } from '../../core/design-system/Materials';
import { DisplayTitle, BodyText } from '../../core/design-system/Typography';
import { PageShell, RoomContent } from '../../core/design-system/Layout';
import { fadeInUp, staggerContainer } from '../../core/physics/motionPrimitives';
import { springs } from '../../core/physics/springs';
import { useRoomFocus } from '../../core/accessibility/useRoomFocus';

const ReflectiveObservationRoom: React.FC = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useRoomFocus(titleRef);

  const cards = [
    { title: 'Perspective', content: 'Viewing issues from multiple angles.' },
    { title: 'Reflection', content: 'Thinking about the meaning of experiences.' },
    { title: 'Observation', content: 'Watching carefully before making judgments.' },
  ];

  return (
    <PageShell>
      <RoomContent>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center gap-12"
        >
          <div className="text-center max-w-2xl" ref={titleRef} tabIndex={-1} className="outline-none">
            <DisplayTitle variants={fadeInUp}>Reflective Observation</DisplayTitle>
            <BodyText tone="muted" className="mt-4" variants={fadeInUp}>
              Step back and observe. This stage is about understanding the meaning of your experiences through careful reflection.
            </BodyText>
          </div>

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
                <GlassMaterial intensity="medium" className="h-64 p-8 flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-white/15 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                    <span className="text-xl">👁️</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-white/60 text-sm">{card.content}</p>
                </GlassMaterial>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </RoomContent>
    </PageShell>
  );
};

export default ReflectiveObservationRoom;
