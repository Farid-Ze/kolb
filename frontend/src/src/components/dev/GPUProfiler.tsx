/**
 * GPUProfiler.tsx
 * 
 * Guidelines.md §4.5.2 & §8.5: GPU Performance Monitoring
 * 
 * Purpose:
 * Dev-only component to monitor shader load and frame drops when testing
 * Glass Material (blur/lensing/vibrancy) effects.
 * 
 * Technical Justification:
 * - Glass Fluidic Material uses real-time GPU shaders (blur, lensing, highlights)
 * - Multiple GlassPanels during animations/scrolling can cause frame drops
 * - This profiler helps identify performance bottlenecks in dev mode
 * 
 * Usage:
 * <GPUProfiler 
 *   enabled={process.env.NODE_ENV === 'development'} 
 *   warningFps={30}
 *   criticalFps={20}
 * />
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, AlertTriangle, ZapOff } from 'lucide-react';
import { springTransition } from '@/lib/motion';

interface GPUProfilerProps {
  /** Enable/disable profiler (use process.env.NODE_ENV === 'development') */
  enabled?: boolean;
  /** FPS threshold for warning (default: 30) */
  warningFps?: number;
  /** FPS threshold for critical (default: 20) */
  criticalFps?: number;
  /** Position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Show detailed stats */
  showDetails?: boolean;
}

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  droppedFrames: number;
  gpuUtilization: number;
  memoryUsage: number;
}

export const GPUProfiler: React.FC<GPUProfilerProps> = ({
  enabled = false,
  warningFps = 30,
  criticalFps = 20,
  position = 'top-right',
  showDetails = false,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    droppedFrames: 0,
    gpuUtilization: 0,
    memoryUsage: 0,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const droppedFramesRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Performance monitoring loop
    const measurePerformance = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      
      frameCountRef.current++;
      
      // Update metrics every second
      if (delta >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / delta);
        const frameTime = delta / frameCountRef.current;
        
        // Detect dropped frames (Guidelines.md §4.5.2)
        // Assuming 60fps target, if frameTime > 16.67ms, frames are dropped
        const expectedFrames = Math.floor(delta / 16.67);
        const droppedInPeriod = Math.max(0, expectedFrames - frameCountRef.current);
        droppedFramesRef.current += droppedInPeriod;

        // Estimate GPU utilization (simplified heuristic)
        // Real GPU monitoring requires browser APIs not widely available
        const gpuUtilization = Math.max(0, Math.min(100, (frameTime / 16.67) * 100));

        // Memory usage (if available)
        let memoryUsage = 0;
        if ((performance as any).memory) {
          const memory = (performance as any).memory;
          memoryUsage = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
        }

        setMetrics({
          fps,
          frameTime: Math.round(frameTime * 100) / 100,
          droppedFrames: droppedFramesRef.current,
          gpuUtilization: Math.round(gpuUtilization),
          memoryUsage,
        });

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(measurePerformance);
    };

    rafIdRef.current = requestAnimationFrame(measurePerformance);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  // Determine status based on FPS
  const getStatus = () => {
    if (metrics.fps >= warningFps) return 'good';
    if (metrics.fps >= criticalFps) return 'warning';
    return 'critical';
  };

  const status = getStatus();

  const statusConfig = {
    good: {
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      icon: Activity,
    },
    warning: {
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20',
      icon: AlertTriangle,
    },
    critical: {
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/20',
      icon: ZapOff,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-[9999] pointer-events-auto`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springTransition}
    >
      <motion.div
        className={`
          rounded-xl border backdrop-blur-xl
          ${config.bgColor} ${config.borderColor}
          shadow-lg overflow-hidden
        `}
        layout
        transition={springTransition}
      >
        {/* Compact View */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            flex items-center gap-2 px-3 py-2
            text-xs font-mono
            ${config.color}
            hover:opacity-80 transition-opacity
            w-full text-left
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={springTransition}
        >
          <Icon className="h-3 w-3" />
          <span>{metrics.fps} FPS</span>
          {metrics.droppedFrames > 0 && (
            <span className="text-destructive">({metrics.droppedFrames} dropped)</span>
          )}
        </motion.button>

        {/* Detailed View */}
        <AnimatePresence>
          {(isExpanded || showDetails) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={springTransition}
              className="border-t border-border/20"
            >
              <div className="px-3 py-2 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Frame Time:</span>
                  <span className={config.color}>{metrics.frameTime}ms</span>
                </div>
                
                <div className="flex justify-between text-muted-foreground">
                  <span>Dropped Frames:</span>
                  <span className={metrics.droppedFrames > 10 ? 'text-destructive' : config.color}>
                    {metrics.droppedFrames}
                  </span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>GPU Load (est.):</span>
                  <span className={config.color}>{metrics.gpuUtilization}%</span>
                </div>

                {metrics.memoryUsage > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Memory:</span>
                    <span className={config.color}>{metrics.memoryUsage}%</span>
                  </div>
                )}

                {/* Guidelines Reference */}
                <div className="pt-1.5 mt-1.5 border-t border-border/20 text-muted-foreground/70">
                  <div className="text-[10px]">
                    Guidelines.md §4.5.2
                  </div>
                  <div className="text-[10px]">
                    Target: 60 FPS (16.67ms)
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

/**
 * Performance warning component for production
 * Shows if too many glass panels are rendered simultaneously
 */
interface GlassPerformanceWarningProps {
  glassPanelCount: number;
  threshold?: number;
}

export const GlassPerformanceWarning: React.FC<GlassPerformanceWarningProps> = ({
  glassPanelCount,
  threshold = 5,
}) => {
  if (glassPanelCount <= threshold) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="
        fixed top-4 left-1/2 -translate-x-1/2 z-[9999]
        px-4 py-2 rounded-lg
        bg-warning/10 border border-warning/20
        text-warning text-xs font-medium
        flex items-center gap-2
        backdrop-blur-sm
      "
    >
      <AlertTriangle className="h-3 w-3" />
      <span>
        Performance Warning: {glassPanelCount} Glass Panels active (Guidelines.md §4.5.2)
      </span>
    </motion.div>
  );
};

export default GPUProfiler;
