/**
 * KLSI 4.0 - Accessibility Tester (DEV ONLY)
 * Task TODO2.md Phase 4.7: XXXL+ Font Clipping Audit
 * 
 * Implementasi sesuai Guidelines.md §1.4.3:
 * - Test pada ukuran aksesibilitas terbesar (XXXL+)
 * - Ensure no clipping/overlap
 * - Elemen UI harus grow vertikal
 * 
 * Usage: Hanya untuk development/testing
 * Provides UI controls untuk simulate WCAG scenarios
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Palette, Type, Zap, Monitor } from 'lucide-react';
import { PrimaryButton } from '../ui/PrimaryButton';
import { FormInput } from '../ui/FormInput';
import { LongFormText, useFontScale } from '../ui/DynamicType';
import { useWindowFocus } from '../../hooks/useWindowFocus';
import { cn } from '../../lib/utils';
import {
  getContrastRatio,
  getContrastRating,
  isWCAGCompliant,
  WCAGLevel,
} from '../../lib/accessibility';

interface AccessibilityTesterProps {
  /** Show/hide tester panel */
  initialOpen?: boolean;
}

/**
 * Inline Window Focus State component
 * Guidelines.md §8.5.4
 */
const WindowFocusState: React.FC = () => {
  const { isFocused } = useWindowFocus();
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Monitor className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-foreground">Window Focus</span>
      </div>
      <div className="flex items-center gap-2">
        <motion.div
          className={cn(
            'h-2 w-2 rounded-full',
            isFocused ? 'bg-chart-2' : 'bg-muted-foreground'
          )}
          animate={{
            scale: isFocused ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: isFocused ? Infinity : 0,
            ease: "easeInOut",
          }}
        />
        <span className={cn(
          "text-xs",
          isFocused ? "text-foreground" : "text-muted-foreground"
        )}>
          {isFocused ? 'Focused' : 'Unfocused'}
        </span>
      </div>
    </div>
  );
};

/**
 * AccessibilityTester - Dev tool untuk test WCAG compliance
 * 
 * Features:
 * - Font scale simulation (100% → 200%+)
 * - Reduce Motion toggle
 * - Reduce Transparency toggle
 * - Contrast ratio checker
 * - Element boundary visualization
 * 
 * @example
 * // Add to App.tsx in development mode
 * {process.env.NODE_ENV === 'development' && <AccessibilityTester />}
 */
export const AccessibilityTester: React.FC<AccessibilityTesterProps> = ({
  initialOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [fontScale, setFontScale] = useState(100);
  const [showBoundaries, setShowBoundaries] = useState(false);
  const [forceReduceMotion, setForceReduceMotion] = useState(false);
  const [forceReduceTransparency, setForceReduceTransparency] = useState(false);
  
  const { scale: detectedScale, isXXXL } = useFontScale();

  // Apply font scale to root
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${fontScale}%`;
    
    return () => {
      root.style.fontSize = '100%';
    };
  }, [fontScale]);

  // Apply reduce motion
  React.useEffect(() => {
    if (forceReduceMotion) {
      document.documentElement.setAttribute('data-reduce-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduce-motion');
    }
  }, [forceReduceMotion]);

  // Apply reduce transparency
  React.useEffect(() => {
    if (forceReduceTransparency) {
      document.documentElement.setAttribute('data-reduce-transparency', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduce-transparency');
    }
  }, [forceReduceTransparency]);

  // Show element boundaries
  React.useEffect(() => {
    if (!showBoundaries) {
      const existingStyle = document.getElementById('accessibility-boundaries');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
      return;
    }

    const style = document.createElement('style');
    style.id = 'accessibility-boundaries';
    style.textContent = `
      * {
        outline: 1px solid rgba(255, 0, 0, 0.2) !important;
      }
      *:hover {
        outline: 2px solid rgba(255, 0, 0, 0.5) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('accessibility-boundaries');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, [showBoundaries]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
        title="Open Accessibility Tester (Dev Only)"
      >
        <Eye className="h-5 w-5" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-[9999] w-80 glass-regular rounded-xl p-6 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="text-foreground font-medium">A11y Tester</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded hover:bg-secondary"
          title="Close"
        >
          <EyeOff className="h-4 w-4" />
        </button>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Font Scale */}
        <div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Type className="h-4 w-4" />
            Font Scale: {fontScale}% {isXXXL && '(XXXL+)'}
          </label>
          <input
            type="range"
            min="50"
            max="250"
            step="10"
            value={fontScale}
            onChange={(e) => setFontScale(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>50%</span>
            <span className={fontScale >= 125 ? 'text-warning' : ''}>125% (Large)</span>
            <span className={fontScale >= 200 ? 'text-error' : ''}>200% (WCAG AAA)</span>
            <span>250%</span>
          </div>
        </div>

        {/* Reduce Motion */}
        <label className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 cursor-pointer">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Reduce Motion</span>
          </div>
          <input
            type="checkbox"
            checked={forceReduceMotion}
            onChange={(e) => setForceReduceMotion(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        {/* Reduce Transparency */}
        <label className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 cursor-pointer">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Reduce Transparency</span>
          </div>
          <input
            type="checkbox"
            checked={forceReduceTransparency}
            onChange={(e) => setForceReduceTransparency(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        {/* Show Boundaries */}
        <label className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 cursor-pointer">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Show Boundaries</span>
          </div>
          <input
            type="checkbox"
            checked={showBoundaries}
            onChange={(e) => setShowBoundaries(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        {/* Window Focus State (Phase 5.11) */}
        <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
          <WindowFocusState />
        </div>

        {/* Detected Scale */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Detected Scale: {(detectedScale * 100).toFixed(0)}%
          </p>
          {isXXXL && (
            <p className="text-xs text-warning mt-1">
              ⚠️ XXXL+ Mode Active - Check for clipping
            </p>
          )}
        </div>

        {/* Test Components */}
        <div className="pt-3 border-t border-border space-y-3">
          <p className="text-xs text-muted-foreground mb-2">Test Components:</p>
          
          {/* Test Button */}
          <PrimaryButton size="sm" className="w-full">
            Test Button with Long Text That Might Wrap
          </PrimaryButton>

          {/* Test Input */}
          <FormInput
            label="Test Input"
            placeholder="Type something..."
            helpText="Helper text untuk testing"
          />

          {/* Test Long Text */}
          <div className="material-thin rounded-lg p-3">
            <LongFormText maxCharacters={50}>
              This is a test paragraph with long-form text to verify that line length 
              constraints work properly at different font scales. It should wrap naturally 
              without clipping.
            </LongFormText>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => {
            setFontScale(100);
            setForceReduceMotion(false);
            setForceReduceTransparency(false);
            setShowBoundaries(false);
          }}
          className="w-full py-2 text-sm text-primary hover:bg-secondary rounded-lg transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* Guidelines Reference */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          📖 Guidelines.md §1.4.3, §2.5, §8.5.3
        </p>
      </div>
    </motion.div>
  );
};

/**
 * ContrastChecker - Standalone tool untuk check contrast ratios
 * 
 * @example
 * <ContrastChecker foreground="#3b82f6" background="#ffffff" />
 */
export const ContrastChecker: React.FC<{
  foreground: string;
  background: string;
}> = ({ foreground, background }) => {
  const ratio = getContrastRatio(foreground, background);
  const rating = getContrastRating(ratio);
  const isAA = isWCAGCompliant(ratio, WCAGLevel.AA);
  const isAAA = isWCAGCompliant(ratio, WCAGLevel.AAA);

  return (
    <div className="material-thin rounded-lg p-4 space-y-3">
      <div className="flex gap-4">
        <div
          className="h-12 w-12 rounded-lg border border-border"
          style={{ backgroundColor: foreground }}
          title={`Foreground: ${foreground}`}
        />
        <div
          className="h-12 w-12 rounded-lg border border-border"
          style={{ backgroundColor: background }}
          title={`Background: ${background}`}
        />
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-foreground">
          Ratio: <strong>{ratio.toFixed(2)}:1</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          Rating: <span className={rating === 'FAIL' ? 'text-error' : 'text-success'}>{rating}</span>
        </p>
        <div className="flex gap-2 text-xs">
          <span className={isAA ? 'text-success' : 'text-error'}>
            {isAA ? '✓' : '✗'} AA (4.5:1)
          </span>
          <span className={isAAA ? 'text-success' : 'text-error'}>
            {isAAA ? '✓' : '���'} AAA (7:1)
          </span>
        </div>
      </div>
    </div>
  );
};