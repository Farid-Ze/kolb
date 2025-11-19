import { Variants } from 'framer-motion';
import { springs } from './springs';

export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    filter: 'blur(5px)'
  },
  visible: { 
    opacity: 1, 
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      ...springs.medium
    }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: 'spring',
      ...springs.medium
    }
  }
};
