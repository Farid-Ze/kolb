/**
 * KLSI 4.0 - GPUProfiler Component
 * Task TODO2.md Phase 2.13: GPU profiling untuk glass-heavy pages
 * 
 * Implementasi sesuai Guidelines.md §4.5.2:
 * - Mendeteksi frame drops dari overuse glass materials
 * - Monitor GPU shader load
 * - Real-time FPS counter
 * - Glass element counter
 * - Performance warnings
 * 
 * Justifikasi Teknis (§4.5.2):
 * - Blur + lensing + highlights = expensive shader operations
 * - Puluhan glass views simultaneously = frame drops
 * - Perlu profiling aggressive untuk detect bottlenecks
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PerformanceMetrics {
  fps: number;
  avgFps: number;
  minFps: number;
  glassElementCount: number;
  isDropping: boolean;
  timestamp: number;
}

interface GPUProfilerProps {
  /** Show by default */
  defaultOpen?: boolean;
  /** FPS threshold for warnings */
  fpsThreshold?: number;
  /** Glass element count threshold */
  glassThreshold?: number;
}

/**
 * GPUProfiler - Real-time GPU performance monitoring
 * 
 * Features:
 * - FPS counter (60fps target)
 * - Frame drop detection
 * - Glass element counter
 * - Performance warnings
 * - Minimal overhead
 * 
 * Guidelines.md §4.5.2:
 * - Detect glass overuse
 * - Monitor shader load
 * - Alert on performance issues
 * 
 * @example
 * // Development only
 * {process.env.NODE_ENV === 'development' && (
 *   <GPUProfiler />
 * )}
 * 
 * @example
 * // With custom thresholds
 * <GPUProfiler fpsThreshold={45} glassThreshold={20} />
 */
export const GPUProfiler: React.FC<GPUProfilerProps> = ({
  defaultOpen = false,
  fpsThreshold = 50,
  glassThreshold = 15,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    avgFps: 60,
    minFps: 60,
    glassElementCount: 0,
    isDropping: false,
    timestamp: Date.now(),
  });

  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const rafIdRef = useRef<number>();

  // FPS Calculation using requestAnimationFrame
  useEffect(() => {
    if (!isOpen) return;

    const calculateFPS = (currentTime: number) => {
      const delta = currentTime - lastTimeRef.current;
      
      if (delta > 0) {
        const currentFps = 1000 / delta;
        
        // Keep rolling history (last 60 frames = ~1 second at 60fps)
        fpsHistoryRef.current.push(currentFps);
        if (fpsHistoryRef.current.length > 60) {
          fpsHistoryRef.current.shift();
        }

        // Calculate metrics
        const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
        const minFps = Math.min(...fpsHistoryRef.current);
        const isDropping = avgFps < fpsThreshold;

        // Count glass elements in DOM
        const glassElements = document.querySelectorAll('[class*="glass-"]');
        const glassCount = glassElements.length;

        setMetrics({
          fps: Math.round(currentFps),
          avgFps: Math.round(avgFps),
          minFps: Math.round(minFps),
          glassElementCount: glassCount,
          isDropping,
          timestamp: Date.now(),
        });
      }

      lastTimeRef.current = currentTime;
      rafIdRef.current = requestAnimationFrame(calculateFPS);
    };

    rafIdRef.current = requestAnimationFrame(calculateFPS);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isOpen, fpsThreshold]);

  // Performance warnings
  const warnings: string[] = [];
  if (metrics.isDropping) {
    warnings.push(`Frame drops detected (${metrics.avgFps} FPS)`);
  }
  if (metrics.glassElementCount > glassThreshold) {
    warnings.push(`High glass count (${metrics.glassElementCount} elements)`);
  }

  const hasWarnings = warnings.length > 0;

  // FPS color coding
  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-green-500';
    if (fps >= 45) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getGlassColor = (count: number) => {
    if (count <= glassThreshold) return 'text-green-500';
    if (count <= glassThreshold * 1.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-4 left-4 z-[9999]',
          'glass-regular rounded-full p-3 shadow-lg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          hasWarnings && 'ring-2 ring-destructive animate-pulse'
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Activity className={cn('h-5 w-5', hasWarnings ? 'text-destructive' : 'text-primary')} />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'fixed bottom-4 left-4 z-[9999] w-80',
        'glass-regular rounded-xl shadow-2xl',
        'border',
        hasWarnings ? 'border-destructive/50' : 'border-border'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className={cn('h-5 w-5', hasWarnings ? 'text-destructive' : 'text-primary')} />
          <h3 className="text-sm font-medium text-foreground">GPU Profiler</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isMinimized ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* FPS Metrics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current FPS</span>
                  <span className={cn('text-2xl font-bold', getFpsColor(metrics.fps))}>
                    {metrics.fps}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Average (1s)</span>
                  <span className={cn('text-sm font-medium', getFpsColor(metrics.avgFps))}>
                    {metrics.avgFps} FPS
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Minimum</span>
                  <span className={cn('text-sm font-medium', getFpsColor(metrics.minFps))}>
                    {metrics.minFps} FPS
                  </span>
                </div>
              </div>

              {/* Glass Element Count */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Glass Elements</span>
                  <span className={cn('text-xl font-bold', getGlassColor(metrics.glassElementCount))}>
                    {metrics.glassElementCount}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Threshold: {glassThreshold} elements
                </div>
              </div>

              {/* Warnings */}
              {hasWarnings && (
                <div className="space-y-2 pt-2 border-t border-destructive/50">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium">Performance Issues</span>
                  </div>
                  {warnings.map((warning, index) => (
                    <div key={index} className="text-xs text-destructive pl-6">
                      • {warning}
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground pl-6 pt-1">
                    Recommendations:
                  </div>
                  <div className="text-xs text-muted-foreground pl-6">
                    • Reduce glass element count
                    <br />
                    • Use material-regular for content
                    <br />
                    • Check for glass-on-glass
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                <p className="mb-1">
                  <strong>Target:</strong> 60 FPS, <{glassThreshold} glass elements
                </p>
                <p>
                  <strong>Guidelines §4.5.2:</strong> Glass materials are GPU-expensive
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Hook untuk access GPU metrics programmatically
 * 
 * @example
 * const { fps, glassCount, isDropping } = useGPUMetrics();
 * 
 * if (isDropping) {
 *   console.warn('Performance issue detected');
 * }
 */
export const useGPUMetrics = () => {
  const [metrics, setMetrics] = useState({
    fps: 60,
    glassCount: 0,
    isDropping: false,
  });

  useEffect(() => {
    let lastTime = performance.now();
    let fpsHistory: number[] = [];
    let rafId: number;

    const measure = (currentTime: number) => {
      const delta = currentTime - lastTime;
      const currentFps = 1000 / delta;

      fpsHistory.push(currentFps);
      if (fpsHistory.length > 60) fpsHistory.shift();

      const avgFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
      const glassElements = document.querySelectorAll('[class*="glass-"]');

      setMetrics({
        fps: Math.round(currentFps),
        glassCount: glassElements.length,
        isDropping: avgFps < 50,
      });

      lastTime = currentTime;
      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);

    return () => cancelAnimationFrame(rafId);
  }, []);

  return metrics;
};
