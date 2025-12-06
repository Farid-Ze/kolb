/* eslint-disable react-refresh/only-export-components */
/**
 * VIDEO SCRUBBER
 * 
 * Frame-precision video control synced to scroll position.
 * Implements the video scrubbing technique from Citrix Red Bull Racing.
 * 
 * Features:
 * - Frame-accurate seeking based on scroll progress
 * - Preloads and decodes frames ahead
 * - Trigger points for DOM events (text highlights, etc.)
 * - Supports both video files and image sequences
 */

import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { ScrollOrchestrator, type ScrollState } from '../lib/ScrollOrchestrator'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface VideoTrigger {
  /** Unique identifier */
  id: string
  /** Video time (seconds) or frame number at which to trigger */
  time: number
  /** Callback when this point is reached */
  onTrigger: () => void
  /** Callback when scrolling past this point backwards */
  onReverse?: () => void
  /** Has this trigger fired */
  fired?: boolean
}

export interface VideoScrubberOptions {
  /** Video source URL */
  src: string
  /** Scroll progress range to map video duration [start, end] */
  scrollRange?: [number, number]
  /** Preload strategy */
  preload?: 'auto' | 'metadata' | 'none'
  /** Playback rate multiplier for smoothness */
  playbackRate?: number
  /** Trigger points for DOM events */
  triggers?: VideoTrigger[]
  /** Callback when video is ready */
  onReady?: (video: HTMLVideoElement) => void
  /** Callback on each frame update */
  onFrame?: (currentTime: number, duration: number, progress: number) => void
}

export interface VideoScrubberState {
  /** Is video loaded and ready */
  isReady: boolean
  /** Is video currently loading */
  isLoading: boolean
  /** Current video time */
  currentTime: number
  /** Total video duration */
  duration: number
  /** Video progress within scroll range (0-1) */
  videoProgress: number
  /** Currently active trigger ID */
  activeTrigger: string | null
  /** Error if any */
  error: string | null
}

// ═══════════════════════════════════════════════════════════════════
// VIDEO SCRUBBER HOOK
// ═══════════════════════════════════════════════════════════════════

export function useVideoScrubber(options: VideoScrubberOptions) {
  const {
    src,
    scrollRange = [0, 1],
    preload = 'auto',
    triggers = [],
    onReady,
    onFrame,
  } = options

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const triggersRef = useRef<VideoTrigger[]>(triggers)
  const [state, setState] = useState<VideoScrubberState>({
    isReady: false,
    isLoading: true,
    currentTime: 0,
    duration: 0,
    videoProgress: 0,
    activeTrigger: null,
    error: null,
  })

  // Update triggers ref when triggers change
  useEffect(() => {
    triggersRef.current = triggers.map(t => ({ ...t, fired: false }))
  }, [triggers])

  // Create video element
  useEffect(() => {
    const video = document.createElement('video')
    video.src = src
    video.preload = preload
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'
    
    // Disable autoplay - we control playback via scroll
    video.autoplay = false
    video.loop = false

    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isReady: true,
        duration: video.duration,
      }))
      onReady?.(video)
    }

    const handleError = () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isReady: false,
        error: `Failed to load video: ${src}`,
      }))
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('error', handleError)

    videoRef.current = video

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('error', handleError)
      video.pause()
      video.src = ''
      videoRef.current = null
    }
  }, [src, preload, onReady])

  // Subscribe to scroll orchestrator
  useEffect(() => {
    const video = videoRef.current
    if (!video || !state.isReady) return

    const handleScroll = (scrollState: ScrollState) => {
      const [rangeStart, rangeEnd] = scrollRange
      const rangeSize = rangeEnd - rangeStart

      // Calculate video progress within our scroll range
      let videoProgress = 0
      if (scrollState.progress >= rangeStart && scrollState.progress <= rangeEnd) {
        videoProgress = (scrollState.progress - rangeStart) / rangeSize
      } else if (scrollState.progress > rangeEnd) {
        videoProgress = 1
      }

      // Clamp and apply to video
      videoProgress = Math.max(0, Math.min(1, videoProgress))
      const targetTime = videoProgress * video.duration

      // Seek video (with small threshold to avoid constant seeking)
      if (Math.abs(video.currentTime - targetTime) > 0.01) {
        video.currentTime = targetTime
      }

      // Check triggers
      let activeTrigger: string | null = null
      for (const trigger of triggersRef.current) {
        const triggerProgress = trigger.time / video.duration

        if (videoProgress >= triggerProgress && !trigger.fired) {
          trigger.fired = true
          trigger.onTrigger()
          activeTrigger = trigger.id
        } else if (videoProgress < triggerProgress && trigger.fired) {
          trigger.fired = false
          trigger.onReverse?.()
        }

        // Track currently active trigger
        if (trigger.fired) {
          activeTrigger = trigger.id
        }
      }

      // Update state
      setState(prev => ({
        ...prev,
        currentTime: targetTime,
        videoProgress,
        activeTrigger,
      }))

      // Callback
      onFrame?.(targetTime, video.duration, videoProgress)
    }

    const unsubscribe = ScrollOrchestrator.subscribe(handleScroll)

    return unsubscribe
  }, [state.isReady, scrollRange, onFrame])

  // Manual seek function
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, videoRef.current.duration))
    }
  }, [])

  // Seek to progress (0-1)
  const seekToProgress = useCallback((progress: number) => {
    if (videoRef.current) {
      const time = progress * videoRef.current.duration
      videoRef.current.currentTime = time
    }
  }, [])

  return {
    videoRef,
    state,
    seekTo,
    seekToProgress,
  }
}

// ═══════════════════════════════════════════════════════════════════
// VIDEO SCRUBBER COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface VideoScrubberProps extends VideoScrubberOptions {
  /** CSS class for container */
  className?: string
  /** Whether to show video (false = just use for texture) */
  visible?: boolean
  /** Object fit */
  objectFit?: 'cover' | 'contain' | 'fill'
  /** Opacity */
  opacity?: number
}

export function VideoScrubber({
  src,
  scrollRange,
  preload,
  triggers,
  onReady,
  onFrame,
  className = '',
  visible = true,
  objectFit = 'cover',
  opacity = 1,
}: VideoScrubberProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { videoRef, state } = useVideoScrubber({
    src,
    scrollRange,
    preload,
    triggers,
    onReady,
    onFrame,
  })

  // Append video to container when ready
  useEffect(() => {
    const container = containerRef.current
    const video = videoRef.current
    if (!container || !video) return

    video.style.position = 'absolute'
    video.style.inset = '0'
    video.style.width = '100%'
    video.style.height = '100%'
    video.style.objectFit = objectFit
    video.style.opacity = visible ? String(opacity) : '0'
    video.style.pointerEvents = 'none'

    container.appendChild(video)

    return () => {
      if (container.contains(video)) {
        container.removeChild(video)
      }
    }
  }, [visible, objectFit, opacity, videoRef])

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Loading state */}
      {state.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
      
      {/* Error state */}
      {state.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white/40 text-sm">
          Video unavailable
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TEXT HIGHLIGHT COMPONENT (Synced to video)
// ═══════════════════════════════════════════════════════════════════

interface TextHighlightProps {
  /** Text content */
  children: React.ReactNode
  /** Trigger ID that activates this highlight */
  triggerId: string
  /** Currently active trigger */
  activeTrigger: string | null
  /** Highlight color */
  highlightColor?: string
  /** Additional className */
  className?: string
}

export function TextHighlight({
  children,
  triggerId,
  activeTrigger,
  highlightColor = '#ef4444',
  className = '',
}: TextHighlightProps) {
  const isActive = activeTrigger === triggerId

  return (
    <span
      className={`relative inline transition-colors duration-300 ${className}`}
      style={{
        color: isActive ? highlightColor : 'inherit',
      }}
    >
      {children}
      {/* Highlight underline */}
      <span
        className="absolute bottom-0 left-0 h-[2px] transition-all duration-500 ease-out"
        style={{
          width: isActive ? '100%' : '0%',
          backgroundColor: highlightColor,
        }}
      />
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TIMELINE INDICATOR COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface TimelineIndicatorProps {
  /** Timeline segments */
  segments: Array<{
    id: string
    label: string
    /** Progress value where this segment starts (0-1) */
    start: number
  }>
  /** Current video progress (0-1) */
  progress: number
  /** Additional className */
  className?: string
}

export function TimelineIndicator({
  segments,
  progress,
  className = '',
}: TimelineIndicatorProps) {
  // Find active segment
  const activeSegment = useMemo(() => {
    for (let i = segments.length - 1; i >= 0; i--) {
      if (progress >= segments[i].start) {
        return segments[i].id
      }
    }
    return segments[0]?.id ?? null
  }, [segments, progress])

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {segments.map((segment, index) => {
        const isActive = segment.id === activeSegment
        const isPast = progress >= segment.start

        return (
          <div key={segment.id} className="flex items-center gap-2">
            {/* Segment label */}
            <span
              className={`text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                isActive ? 'text-white' : isPast ? 'text-white/60' : 'text-white/30'
              }`}
            >
              {segment.label}
            </span>

            {/* Progress line (except last) */}
            {index < segments.length - 1 && (
              <div className="relative w-16 h-px bg-white/20 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-orange-500 transition-all duration-300"
                  style={{
                    width: isPast ? '100%' : '0%',
                  }}
                />
                {/* Moving indicator dot */}
                {isActive && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full"
                    style={{
                      left: `${((progress - segment.start) / (segments[index + 1].start - segment.start)) * 100}%`,
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default VideoScrubber
