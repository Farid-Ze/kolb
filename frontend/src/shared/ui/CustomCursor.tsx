import { memo, useEffect, useMemo, useRef, useState } from 'react'

/**
 * AWWWARDS-LEVEL CUSTOM CURSOR
 * 
 * Premium cursor inspired by Citrix, Studio Details Japan:
 * - Smooth lerp-based following
 * - Magnetic effect on interactive elements
 * - Expand/contract on hover
 * - Blend mode for visibility on any background
 * - Desktop only (hidden on touch devices)
 * - GPU-accelerated with will-change
 */

interface CursorState {
  x: number
  y: number
  isHovering: boolean
  isPressed: boolean
  isHidden: boolean
}

export const CustomCursor = memo(function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<number>(0)
  const mousePos = useRef({ x: 0, y: 0 })
  const cursorPos = useRef({ x: 0, y: 0 })
  const dotPos = useRef({ x: 0, y: 0 })

  const [state, setState] = useState<CursorState>({
    x: 0,
    y: 0,
    isHovering: false,
    isPressed: false,
    isHidden: true,
  })

  // Check if device has touch capability
  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return true
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    return hasTouch && !hasFinePointer
  }, [])

  useEffect(() => {
    if (isTouchDevice) return

    const tick = () => {
      const cursor = cursorRef.current
      const dot = cursorDotRef.current

      if (cursor && dot) {
        const lerpFactor = state.isHovering ? 0.15 : 0.12
        cursorPos.current.x += (mousePos.current.x - cursorPos.current.x) * lerpFactor
        cursorPos.current.y += (mousePos.current.y - cursorPos.current.y) * lerpFactor

        const dotLerpFactor = 0.25
        dotPos.current.x += (mousePos.current.x - dotPos.current.x) * dotLerpFactor
        dotPos.current.y += (mousePos.current.y - dotPos.current.y) * dotLerpFactor

        const scale = state.isPressed ? 0.75 : 1
        cursor.style.transform = `translate3d(${cursorPos.current.x}px, ${cursorPos.current.y}px, 0) scale(${scale})`
        dot.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0)`
      }

      requestRef.current = requestAnimationFrame(tick)
    }

    requestRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(requestRef.current)
  }, [isTouchDevice, state.isHovering, state.isPressed])

  // Mouse event handlers
  useEffect(() => {
    if (isTouchDevice) return

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
      
      if (state.isHidden) {
        setState(prev => ({ ...prev, isHidden: false }))
      }
    }

    const handleMouseDown = () => {
      setState(prev => ({ ...prev, isPressed: true }))
    }

    const handleMouseUp = () => {
      setState(prev => ({ ...prev, isPressed: false }))
    }

    const handleMouseLeave = () => {
      setState(prev => ({ ...prev, isHidden: true }))
    }

    const handleMouseEnter = () => {
      setState(prev => ({ ...prev, isHidden: false }))
    }

    // Hover detection for interactive elements
    const handleElementHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isInteractive = 
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('[role="button"]') ||
        target.closest('[data-cursor="hover"]') ||
        target.closest('input') ||
        target.closest('textarea')

      setState(prev => ({
        ...prev,
        isHovering: !!isInteractive,
      }))
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mousemove', handleElementHover)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mousemove', handleElementHover)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [isTouchDevice, state.isHidden])

  // Don't render on touch devices
  if (isTouchDevice) return null

  return (
    <>
      {/* Outer ring */}
      <div
        ref={cursorRef}
        className={`
          fixed top-0 left-0 pointer-events-none z-[9999]
          -translate-x-1/2 -translate-y-1/2
          rounded-full border
          mix-blend-difference
          transition-[width,height,border-color,opacity] duration-300 ease-out
          ${state.isHovering 
            ? 'w-16 h-16 border-white/80' 
            : 'w-10 h-10 border-white/40'
          }
          ${state.isHidden 
            ? 'opacity-0' 
            : 'opacity-100'
          }
        `}
        style={{
          willChange: 'transform',
        }}
        aria-hidden="true"
      />
      
      {/* Inner dot */}
      <div
        ref={cursorDotRef}
        className={`
          fixed top-0 left-0 pointer-events-none z-[9999]
          -translate-x-1/2 -translate-y-1/2
          rounded-full bg-white
          mix-blend-difference
          transition-[width,height,opacity] duration-200 ease-out
          ${state.isHovering 
            ? 'w-2 h-2' 
            : 'w-1 h-1'
          }
          ${state.isHidden 
            ? 'opacity-0' 
            : 'opacity-100'
          }
        `}
        style={{
          willChange: 'transform',
        }}
        aria-hidden="true"
      />

      {/* Hide default cursor globally */}
      <style>{`
        @media (pointer: fine) {
          * {
            cursor: none !important;
          }
        }
      `}</style>
    </>
  )
})

export default CustomCursor
