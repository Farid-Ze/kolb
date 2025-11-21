import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

// Simple class joiner
const cx = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

interface TypographyProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  tone?: 'default' | 'muted' | 'accent';
}

export const DisplayTitle: React.FC<TypographyProps> = ({
  children,
  className,
  tone = 'default',
  ...props
}) => {
  const toneColors = {
    default: 'text-slate-900 dark:text-white',
    muted: 'text-slate-600 dark:text-white/80',
    accent: 'text-emerald-600 dark:text-emerald-400',
  };

  return (
    <motion.h1
      className={cx(
        'text-5xl md:text-6xl font-bold tracking-tight leading-tight',
        toneColors[tone],
        className
      )}
      {...props}
    >
      {children}
    </motion.h1>
  );
};

export const SectionTitle: React.FC<TypographyProps> = ({
  children,
  className,
  tone = 'default',
  ...props
}) => {
  const toneColors = {
    default: 'text-slate-900 dark:text-white',
    muted: 'text-slate-600 dark:text-white/70',
    accent: 'text-emerald-600 dark:text-emerald-400',
  };

  return (
    <motion.h2
      className={cx(
        'text-3xl md:text-4xl font-semibold tracking-tight',
        toneColors[tone],
        className
      )}
      {...props}
    >
      {children}
    </motion.h2>
  );
};

export const BodyText: React.FC<TypographyProps> = ({
  children,
  className,
  tone = 'default',
  ...props
}) => {
  const toneColors = {
    default: 'text-slate-700 dark:text-white/90',
    muted: 'text-slate-500 dark:text-white/60',
    accent: 'text-slate-900 dark:text-white',
  };

  return (
    <motion.p
      className={cx(
        'text-lg md:text-xl leading-relaxed',
        toneColors[tone],
        className
      )}
      {...props}
    >
      {children}
    </motion.p>
  );
};
