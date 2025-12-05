import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MagneticCTA } from '../shared/ui/MagneticButton';

/**
 * AWWWARDS-LEVEL DESIGN IMPLEMENTATION
 * Criteria: Design (40%) | Usability (30%) | Creativity (20%) | Content (10%)
 * 
 * DESIGN PRINCIPLES:
 * - Golden Ratio Typography (1.618)
 * - 8px Grid System
 * - Precise letter-spacing for editorial feel
 * - Spring physics for organic motion (Framer Motion)
 * - Staggered reveals for cinematic feel
 * 
 * LAYOUT (Citrix Pattern):
 * ┌─────────────────────────────────────────────────────────────┐
 * │  LOGO                              ||||  SOUND    • • •    │
 * │                                                             │
 * │  HOW DO YOU                                                 │
 * │  QUANTIFY                                                   │
 * │  HUMAN POTENTIAL?                                           │
 * │                                                             │
 * │  [LOGO] | [LOGO]   Description...     SCROLL TO EXPLORE ───→│
 * │  INNOVATION PARTNER                                         │
 * └─────────────────────────────────────────────────────────────┘
 */

// Spring physics for organic, premium feel (Studio Details / Patrick Heng style)
const springTransition = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 12,
};

// Staggered hero lines
const heroLineVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...springTransition,
      delay,
    },
  }),
};

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between contain-layout">
      {/* MAIN HERO - Editorial Typography with Spring Physics */}
      <main className="relative z-10 px-[8.33%] w-full max-w-full flex-1 flex items-center pt-24 md:pt-0 contain-content">
        <div className="relative w-full isolate-layer">
          {/* 
           * TYPOGRAPHY SYSTEM:
           * - Oswald for headlines (geometric, impactful)
           * - Line-height: 0.9 (tight, editorial)
           * - Letter-spacing: -0.02em (refined)
           * - Spring physics for organic motion
           */}
          <h2 
            className="font-headline uppercase tracking-[-0.02em]"
            style={{ 
              fontSize: 'clamp(2.5rem, 8vw, 7.5rem)',
              lineHeight: 0.9,
            }}
          >
            {/* Line 1 - White with spring animation */}
            <motion.span 
              className="block text-white gpu-layer" 
              variants={heroLineVariants}
              initial="hidden"
              animate="visible"
              custom={0.1}
            >
              HOW DO YOU
            </motion.span>
            
            {/* Line 2 - Gradient accent with spring animation */}
            <motion.span 
              className="block gpu-layer mt-1 sm:mt-2" 
              variants={heroLineVariants}
              initial="hidden"
              animate="visible"
              custom={0.25}
              style={{ 
                background: 'linear-gradient(90deg, #ffffff 0%, #93c5fd 50%, #6b7280 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              QUANTIFY
            </motion.span>
            
            {/* Line 3 - White with spring animation */}
            <motion.span 
              className="block text-white gpu-layer mt-1 sm:mt-2" 
              variants={heroLineVariants}
              initial="hidden"
              animate="visible"
              custom={0.4}
            >
              HUMAN POTENTIAL?
            </motion.span>
          </h2>
        </div>
      </main>

      {/* FOOTER - Citrix Pattern with Scroll-Triggered Animation */}
      <motion.footer 
        className="relative z-10 px-[8.33%] pb-[calc(100vh/12)] pt-8 w-full contain-paint" 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ ...springTransition, delay: 0.1 }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          {/* Left: Partnership Block */}
          <motion.div 
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...springTransition, delay: 0.2 }}
          >
            {/* Logo Lockup - Vertical divider pattern */}
            <div className="flex items-center gap-0">
              {/* Logo 1 */}
              <div className="pr-4 border-r border-gray-600">
                <span className="font-headline font-bold text-base sm:text-lg text-white tracking-tight">
                  ZENOTIKA
                </span>
              </div>
              {/* Logo 2 */}
              <div className="pl-4">
                <span className="font-headline font-bold text-base sm:text-lg text-blue-400 tracking-tight">
                  UNIKOM
                </span>
              </div>
            </div>
            
            {/* Partnership Label */}
            <span className="font-ui text-[9px] uppercase tracking-[0.25em] text-gray-500 -mt-1">
              Innovation Partner
            </span>
            
            {/* Description - max 2 lines for scannability */}
            <p className="font-ui text-[13px] sm:text-sm text-gray-400 leading-[1.6] max-w-md">
              Zenotika is helping global leaders reimagine how they assess talent 
              in the tunnel, the boardroom, and everywhere in between. 
              <span className="text-white">This is how the future works.</span>
            </p>
          </motion.div>

          {/* Right: SCROLL TO EXPLORE - Premium Magnetic CTA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ ...springTransition, delay: 0.3 }}
          >
            <MagneticCTA 
              label="Scroll to Explore" 
              showArrow
              onClick={() => navigate('/auth')}
              aria-label="Scroll to explore and begin assessment"
            />
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}
