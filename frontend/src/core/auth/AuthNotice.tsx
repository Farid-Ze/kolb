import React from 'react';
import { motion } from 'framer-motion';
import { GlassMaterial } from '../design-system/Materials';
import { SectionTitle, BodyText } from '../design-system/Typography';
import { fadeInUp } from '../physics/motionPrimitives';

interface AuthNoticeProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onActionClick?: () => void;
  className?: string;
}

export const AuthNotice: React.FC<AuthNoticeProps> = ({
  title = "Sign in required",
  message,
  actionLabel = "Sign In",
  onActionClick,
  className = ""
}) => {
  return (
    <motion.div 
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={`max-w-md mx-auto ${className}`}
    >
      <GlassMaterial intensity="high" className="p-8 flex flex-col items-center text-center gap-4">
        <SectionTitle>{title}</SectionTitle>
        <BodyText tone="muted">{message}</BodyText>
        
        {onActionClick && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onActionClick}
            className="mt-2 px-6 py-2 bg-amber-500 text-black font-bold rounded-full hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
          >
            {actionLabel}
          </motion.button>
        )}
      </GlassMaterial>
    </motion.div>
  );
};
