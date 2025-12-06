import { useRef, useEffect, useState, memo } from 'react'
import { m, useSpring, useTransform } from 'framer-motion'

/**
 * HERO VIDEO COMPONENT
 * 
 * Scroll-synced video scrubbing like Citrix Red Bull Racing.
 * Video position is controlled by scroll position.
 * 
 * Usage:
 * - Replace `src` with actual video URL
 * - Video should be 5-15 seconds, seamless loop
 * - Recommended: WebM for Chrome, MP4 fallback
 */

interface HeroVideoProps {
  /** Video source URL */
  src?: string
  /** Fallback poster image */
  poster?: string
  /** Whether to sync with scroll (scrubbing mode) */
  scrubOnScroll?: boolean
  /** Scroll range for scrubbing (0-1 means full page) */
  scrollRange?: [number, number]
  /** Opacity of video */
  opacity?: number
  /** Custom className */
  className?: string
  /** Scroll progress from parent (0-1) - for placeholder animation */
  scrollProgress?: number
}

export const HeroVideo = memo(function HeroVideo({
  src,
  poster,
  scrubOnScroll = true,
  scrollRange = [0, 0.5],
  opacity = 0.6,
  className = '',
  scrollProgress = 0,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasVideo, setHasVideo] = useState(!!src)

  // Video scrubbing based on scroll
  useEffect(() => {
    if (!scrubOnScroll || !videoRef.current || !hasVideo) return

    const video = videoRef.current

    const handleScroll = () => {
      if (!video.duration || !isFinite(video.duration)) return

      const scrollY = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0

      // Map scroll to video time within range
      const [start, end] = scrollRange
      const rangeProgress = Math.max(0, Math.min(1, (scrollProgress - start) / (end - start)))
      const targetTime = rangeProgress * video.duration

      // Set video time (scrub)
      if (isFinite(targetTime)) {
        video.currentTime = targetTime
      }
    }

    // Initial sync
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrubOnScroll, scrollRange, isLoaded, hasVideo])

  // Auto-play fallback for non-scrub mode
  useEffect(() => {
    if (scrubOnScroll || !videoRef.current || !hasVideo) return

    const video = videoRef.current
    video.play().catch(() => {
      // Autoplay blocked, that's fine
    })
  }, [scrubOnScroll, hasVideo])

  const handleLoadedMetadata = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasVideo(false)
  }

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Video element */}
      {hasVideo && src ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isLoaded ? opacity : 0 }}
        />
      ) : (
        /* Animated placeholder when no video */
        <VideoPlaceholder opacity={opacity} scrollProgress={scrollProgress} />
      )}

      {/* Gradient overlay for text readability */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 60%),
            linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 100%)
          `
        }}
      />
    </div>
  )
})

/**
 * Animated placeholder for hero section when no video is available.
 * Uses CSS + Framer Motion for scroll-responsive animations.
 * Creates a dynamic, immersive visual without heavy dependencies.
 */
const VideoPlaceholder = memo(function VideoPlaceholder({ 
  opacity = 0.6,
  scrollProgress = 0,
}: { 
  opacity?: number
  scrollProgress?: number 
}) {
  // Smooth spring for scroll-based transformations
  const smoothProgress = useSpring(scrollProgress, { stiffness: 80, damping: 25 })
  
  // Transform scroll to visual effects - more dramatic
  const mainOrbScale = useTransform(smoothProgress, [0, 0.3, 0.6], [1, 1.8, 2.5])
  const mainOrbX = useTransform(smoothProgress, [0, 0.5], [0, -150])
  const mainOrbY = useTransform(smoothProgress, [0, 0.5], [0, -80])
  const mainOrbOpacity = useTransform(smoothProgress, [0, 0.2, 0.5], [0.8, 0.6, 0.2])
  
  const secondaryOrbScale = useTransform(smoothProgress, [0, 0.5], [1, 0.5])
  const secondaryOrbY = useTransform(smoothProgress, [0, 0.5], [0, 100])
  const secondaryOrbRotate = useTransform(smoothProgress, [0, 0.5], [0, 45])
  
  const accentOrbScale = useTransform(smoothProgress, [0, 0.5], [1, 1.8])
  const accentOrbX = useTransform(smoothProgress, [0, 0.5], [0, 80])

  const accentParticlesOpacity = useTransform(smoothProgress, [0, 0.3], [0.6, 0.2])
  const accentParticlesScale = useTransform(smoothProgress, [0, 0.5], [1, 1.6])
  
  // Focal point transforms
  const focalScale = useTransform(smoothProgress, [0, 0.2, 0.5], [1, 1.3, 0.6])
  const focalOpacity = useTransform(smoothProgress, [0, 0.3, 0.5], [1, 0.8, 0])
  const focalRotate = useTransform(smoothProgress, [0, 0.5], [0, 180])
  
  // Grid and atmosphere
  const gridSkew = useTransform(smoothProgress, [0, 0.5], [0, 8])
  const gridOpacity = useTransform(smoothProgress, [0, 0.2, 0.4], [0.02, 0.06, 0.02])
  const atmosphereOpacity = useTransform(smoothProgress, [0, 0.3], [0.3, 0.6])

  return (
    <div className="absolute inset-0" style={{ opacity }}>
      {/* Deep space background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 150% 100% at 70% 50%, rgba(15, 23, 42, 0.8) 0%, transparent 50%),
            radial-gradient(ellipse 100% 80% at 30% 70%, rgba(30, 27, 75, 0.6) 0%, transparent 40%),
            linear-gradient(135deg, #050508 0%, #0a0a12 30%, #080810 60%, #050508 100%)
          `
        }}
      />

      {/* Atmospheric glow layer */}
      <m.div 
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: atmosphereOpacity,
          background: `
            radial-gradient(ellipse 120% 60% at 60% 40%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 80% 80% at 40% 60%, rgba(139, 92, 246, 0.05) 0%, transparent 40%)
          `,
        }}
      />

      {/* Floating orbs - scroll-responsive */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main orb - Golden Ratio position */}
        <m.div 
          className="absolute rounded-full"
          style={{
            width: '70vh',
            height: '70vh',
            right: '5%',
            top: '50%',
            y: mainOrbY,
            x: mainOrbX,
            scale: mainOrbScale,
            opacity: mainOrbOpacity,
            background: `
              radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.15) 30%, transparent 60%),
              radial-gradient(circle at 70% 70%, rgba(99, 102, 241, 0.2) 0%, transparent 50%)
            `,
            filter: 'blur(50px)',
            transform: 'translateY(-50%)',
          }}
        />
        
        {/* Secondary orb - purple accent */}
        <m.div 
          className="absolute rounded-full"
          style={{
            width: '50vh',
            height: '50vh',
            right: '20%',
            top: '20%',
            y: secondaryOrbY,
            scale: secondaryOrbScale,
            rotate: secondaryOrbRotate,
            background: `
              radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.35) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 60%)
            `,
            filter: 'blur(40px)',
          }}
        />

        {/* Accent orb - cyan highlight */}
        <m.div 
          className="absolute rounded-full"
          style={{
            width: '35vh',
            height: '35vh',
            right: '0%',
            bottom: '15%',
            x: accentOrbX,
            scale: accentOrbScale,
            background: `
              radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.25) 0%, transparent 50%)
            `,
            filter: 'blur(35px)',
          }}
        />

        {/* Small accent particles */}
        {[...Array(5)].map((_, i) => (
          <m.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${8 + i * 4}vh`,
              height: `${8 + i * 4}vh`,
              right: `${10 + i * 15}%`,
              top: `${20 + i * 12}%`,
              background: `radial-gradient(circle, rgba(255, 255, 255, ${0.05 - i * 0.008}) 0%, transparent 60%)`,
              filter: 'blur(20px)',
              opacity: accentParticlesOpacity,
              scale: accentParticlesScale,
            }}
          />
        ))}
        
        {/* Central focal point - abstract geometric */}
        <m.div
          className="absolute"
          style={{
            right: '18%',
            top: '45%',
            width: '28vh',
            height: '28vh',
            y: '-50%',
            scale: focalScale,
            opacity: focalOpacity,
            rotate: focalRotate,
          }}
        >
          {/* Outer ring */}
          <m.div 
            className="absolute inset-0 rounded-full"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              animation: 'rotateRing 30s linear infinite',
            }}
          />
          
          {/* Middle ring */}
          <m.div 
            className="absolute inset-[15%] rounded-full"
            style={{
              border: '1px solid rgba(59, 130, 246, 0.15)',
              animation: 'rotateRing 20s linear infinite reverse',
            }}
          />
          
          {/* Core glow */}
          <div 
            className="absolute inset-[25%]"
            style={{
              background: `
                conic-gradient(from 0deg at 50% 50%, 
                  rgba(59, 130, 246, 0.4) 0deg, 
                  rgba(139, 92, 246, 0.3) 90deg, 
                  rgba(34, 211, 238, 0.4) 180deg,
                  rgba(99, 102, 241, 0.3) 270deg,
                  rgba(59, 130, 246, 0.4) 360deg
                )
              `,
              borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
              filter: 'blur(25px)',
              animation: 'morphShape 12s ease-in-out infinite',
            }}
          />
          
          {/* Inner core */}
          <div 
            className="absolute inset-[35%] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
              animation: 'pulse 3s ease-in-out infinite',
            }}
          />
        </m.div>

        {/* Horizontal light streak */}
        <m.div
          className="absolute left-0 right-0 h-px"
          style={{
            top: '50%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.1) 30%, rgba(59, 130, 246, 0.2) 50%, rgba(59, 130, 246, 0.1) 70%, transparent 100%)',
            opacity: useTransform(smoothProgress, [0, 0.2, 0.5], [0, 0.5, 0]),
            scaleX: useTransform(smoothProgress, [0, 0.3], [0.5, 1.2]),
          }}
        />
      </div>

      {/* Grid overlay - perspective distortion on scroll */}
      <m.div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          opacity: gridOpacity,
          skewX: gridSkew,
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      />

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Scan lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Subtle noise */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <style>{`
        @keyframes morphShape {
          0%, 100% { 
            border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
          }
          25% {
            border-radius: 58% 42% 75% 25% / 76% 46% 54% 24%;
          }
          50% { 
            border-radius: 50% 50% 33% 67% / 55% 27% 73% 45%;
          }
          75% {
            border-radius: 33% 67% 58% 42% / 63% 68% 32% 37%;
          }
        }
        @keyframes rotateRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
})

export default HeroVideo
