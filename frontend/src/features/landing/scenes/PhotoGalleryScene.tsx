/**
 * PHOTO GALLERY SCENE (JOURNEY / PHOTOS)
 * 
 * Reference: Design Paradigm Document Section C.1
 * 
 * MANDATORY ELEMENTS:
 * - Photo gallery with immersive experience
 * - Real photos dari kegiatan Zenotika
 * - 3D frames, hover effects, fullscreen view
 * 
 * This scene showcases actual journey moments with
 * premium 3D photo frames and interactive hover effects.
 */

import { memo, useState, useRef } from 'react'
import { m, useTransform, type MotionValue, AnimatePresence } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface PhotoGallerySceneProps {
  progress: MotionValue<number>
  reduced?: boolean | null
}

interface Photo {
  id: string
  src: string
  alt: string
  caption: string
  aspectRatio: 'portrait' | 'landscape' | 'square'
}

// ═══════════════════════════════════════════════════════════════════
// PHOTO DATA - Real Zenotika journey photos
// Using placeholder images - replace with actual photos
// ═══════════════════════════════════════════════════════════════════

const PHOTOS: Photo[] = [
  {
    id: 'workshop-1',
    src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
    alt: 'Team workshop session',
    caption: 'Discovery Workshop',
    aspectRatio: 'landscape',
  },
  {
    id: 'collaboration',
    src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=600&fit=crop',
    alt: 'Team collaboration',
    caption: 'Collaborative Insight',
    aspectRatio: 'portrait',
  },
  {
    id: 'reflection',
    src: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=500&h=500&fit=crop',
    alt: 'Individual reflection',
    caption: 'Deep Reflection',
    aspectRatio: 'square',
  },
  {
    id: 'celebration',
    src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop',
    alt: 'Team celebration',
    caption: 'Milestone Celebration',
    aspectRatio: 'landscape',
  },
  {
    id: 'learning',
    src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=600&fit=crop',
    alt: 'Learning session',
    caption: 'Learning Journey',
    aspectRatio: 'portrait',
  },
]

// ═══════════════════════════════════════════════════════════════════
// 3D PHOTO FRAME COMPONENT
// ═══════════════════════════════════════════════════════════════════

const Photo3DFrame = memo(function Photo3DFrame({
  photo,
  index,
  progress,
  onSelect,
}: {
  photo: Photo
  index: number
  progress: MotionValue<number>
  onSelect: (photo: Photo) => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)
  
  // Staggered entrance based on index
  const staggerDelay = index * 0.02
  const opacity = useTransform(
    progress,
    [0.66 + staggerDelay, 0.70 + staggerDelay, 0.78, 0.82],
    [0, 1, 1, 0]
  )
  const y = useTransform(
    progress,
    [0.66 + staggerDelay, 0.70 + staggerDelay],
    [60, 0]
  )
  const scale = useTransform(
    progress,
    [0.66 + staggerDelay, 0.70 + staggerDelay],
    [0.9, 1]
  )
  
  // Size based on aspect ratio
  const sizeClasses = {
    portrait: 'w-40 h-56 md:w-48 md:h-72',
    landscape: 'w-56 h-40 md:w-72 md:h-48',
    square: 'w-44 h-44 md:w-56 md:h-56',
  }
  
  return (
    <m.div
      ref={frameRef}
      className={`relative ${sizeClasses[photo.aspectRatio]} cursor-pointer group`}
      style={{ opacity, y, scale }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(photo)}
      whileHover={{ 
        z: 50,
        rotateY: index % 2 === 0 ? 5 : -5,
        rotateX: -3,
        transition: { duration: 0.4, ease: 'easeOut' }
      }}
    >
      {/* 3D Frame - Gold/Brass Border */}
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          background: `linear-gradient(135deg, 
            rgba(212, 168, 83, 0.8) 0%, 
            rgba(185, 142, 58, 0.6) 25%,
            rgba(212, 168, 83, 0.8) 50%,
            rgba(185, 142, 58, 0.6) 75%,
            rgba(212, 168, 83, 0.8) 100%
          )`,
          padding: '3px',
          boxShadow: isHovered
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 168, 83, 0.3)'
            : '0 10px 30px -5px rgba(0, 0, 0, 0.4)',
          transform: isHovered ? 'translateZ(20px)' : 'translateZ(0)',
          transition: 'box-shadow 0.4s, transform 0.4s',
        }}
      >
        <div className="w-full h-full rounded-md overflow-hidden bg-black/90">
          {/* Photo Image */}
          <m.img
            src={photo.src}
            alt={photo.alt}
            className="w-full h-full object-cover"
            initial={{ scale: 1 }}
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
          
          {/* Hover Overlay */}
          <AnimatePresence>
            {isHovered && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4"
              >
                <div>
                  <p className="text-white font-headline text-lg tracking-wide">
                    {photo.caption}
                  </p>
                  <p className="text-white/60 font-mono text-xs mt-1">
                    Click to expand
                  </p>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Reflection effect */}
      <div 
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full opacity-20 blur-lg"
        style={{
          background: 'radial-gradient(ellipse, rgba(212, 168, 83, 0.4) 0%, transparent 70%)'
        }}
      />
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// FULLSCREEN PHOTO VIEWER
// ═══════════════════════════════════════════════════════════════════

const FullscreenViewer = memo(function FullscreenViewer({
  photo,
  onClose,
}: {
  photo: Photo | null
  onClose: () => void
}) {
  if (!photo) return null
  
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-10"
        onClick={onClose}
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      {/* Photo container */}
      <m.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative max-w-[90vw] max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Gold frame */}
        <div 
          className="rounded-lg p-1"
          style={{
            background: 'linear-gradient(135deg, #D4A853 0%, #B98E3A 50%, #D4A853 100%)',
            boxShadow: '0 0 60px rgba(212, 168, 83, 0.3)',
          }}
        >
          <img
            src={photo.src}
            alt={photo.alt}
            className="rounded-md max-h-[80vh] w-auto object-contain"
          />
        </div>
        
        {/* Caption */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute -bottom-16 left-0 right-0 text-center"
        >
          <p className="text-white font-headline text-xl tracking-wide">
            {photo.caption}
          </p>
        </m.div>
      </m.div>
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const PhotoGalleryScene = memo(function PhotoGalleryScene({
  progress,
  reduced,
}: PhotoGallerySceneProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  
  // Scene-level animations
  const sceneOpacity = useTransform(progress, [0.65, 0.68, 0.80, 0.82], [0, 1, 1, 0])
  const titleOpacity = useTransform(progress, [0.65, 0.68, 0.78, 0.80], [0, 1, 1, 0])
  const titleY = useTransform(progress, [0.65, 0.68], [40, 0])
  
  // Reduced motion fallback
  if (reduced) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-[#0A0A0F]">
        <div className="text-center">
          <h2 className="font-headline text-3xl text-white">Journey</h2>
          <p className="text-white/60 mt-2">Photo gallery</p>
        </div>
      </div>
    )
  }
  
  return (
    <m.div 
      className="relative flex h-full w-full flex-col items-center justify-center bg-[#0A0A0F] overflow-hidden"
      style={{ opacity: sceneOpacity }}
    >
      {/* Ambient background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 50% 50%, rgba(212, 168, 83, 0.05) 0%, transparent 60%),
              radial-gradient(ellipse 80% 80% at 20% 80%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
              radial-gradient(ellipse 80% 80% at 80% 20%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)
            `
          }}
        />
      </div>
      
      {/* Header */}
      <m.div 
        className="relative z-10 text-center mb-12"
        style={{ opacity: titleOpacity, y: titleY }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#D4A853] mb-3">
          Journey
        </p>
        <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl text-white tracking-tight">
          Moments That<br />
          <span className="text-[#D4A853]">Shape You</span>
        </h2>
      </m.div>
      
      {/* Photo Gallery - Masonry-like layout */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-6 px-8 max-w-7xl perspective-1000">
        {PHOTOS.map((photo, index) => (
          <Photo3DFrame
            key={photo.id}
            photo={photo}
            index={index}
            progress={progress}
            onSelect={setSelectedPhoto}
          />
        ))}
      </div>
      
      {/* Hint text */}
      <m.p
        className="relative z-10 mt-12 text-white/40 font-mono text-xs tracking-wider"
        style={{ 
          opacity: useTransform(progress, [0.72, 0.75, 0.78, 0.80], [0, 0.6, 0.6, 0]) 
        }}
      >
        Hover to explore • Click to expand
      </m.p>
      
      {/* Fullscreen viewer */}
      <AnimatePresence>
        {selectedPhoto && (
          <FullscreenViewer
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
          />
        )}
      </AnimatePresence>
    </m.div>
  )
})

export default PhotoGalleryScene
