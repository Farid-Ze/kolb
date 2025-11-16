/**
 * KLSI 4.0 - Design System Showcase Page
 * Task TODO2.md Phase 7: Alur Kerja Iterasi & Storybook (Alternative Demo Pages)
 * 
 * Comprehensive showcase menggantikan Storybook stories untuk
 * mendemonstrasikan implementasi Guidelines.md secara interaktif.
 * 
 * Sections:
 * 1. GlassPanel Showcase (§4.2, §4.3)
 * 2. VibrantText Showcase (§3.5.2, §4.4)
 * 3. Motion Showcase (§2.3.2)
 * 4. Layout Showcase (§1.2.1, §1.3.1)
 * 5. Accessibility Showcase (§2.5, §8.5.3, §1.4.3)
 * 6. Scroll-Edge Interaction (§4.5.3)
 * 7. Anti-Patterns (§8.5.1, §8.5.2)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GlassPanel } from '../components/ui/GlassPanel';
import { TintedGlassPanel } from '../components/ui/TintedGlassPanel';
import { VibrantText } from '../components/ui/VibrantText';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { MorphingIcon } from '../components/ui/MorphingIcon';
import { FusingNotification } from '../components/ui/FusingNotification';
import { LayeredIcon } from '../components/ui/LayeredIcon';
import { LongFormText, ShortLabel, DescriptionText } from '../components/ui/DynamicType';
import { ScrollEdgeHandler } from '../components/ui/ScrollEdgeHandler';
import { WindowFocusDemo } from '../components/debug/WindowFocusIndicator';
import { Separator } from '../components/ui/Separator';
import { cn } from '../lib/utils';
import {
  Play,
  Pause,
  Heart,
  Star,
  Palette,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  Type,
  Zap,
} from 'lucide-react';

export default function DesignSystemShowcasePage() {
  const [activeSection, setActiveSection] = useState<string>('glass-panel');

  const sections = [
    { id: 'glass-panel', label: 'Glass Panel', icon: Layers },
    { id: 'vibrant-text', label: 'Vibrant Text', icon: Type },
    { id: 'motion', label: 'Motion', icon: Zap },
    { id: 'layout', label: 'Layout', icon: Monitor },
    { id: 'accessibility', label: 'Accessibility', icon: Eye },
    { id: 'scroll-edge', label: 'Scroll Edge', icon: Sparkles },
    { id: 'anti-patterns', label: 'Anti-Patterns', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-purple-950 dark:to-blue-950">
      {/* Header */}
      <ScrollEdgeHandler>
        {(isScrolled) => (
          <header
            className={cn(
              'sticky top-0 z-50 transition-all duration-300',
              isScrolled ? 'glass-regular shadow-lg' : 'bg-transparent'
            )}
          >
            <div className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Palette className="h-6 w-6 text-primary" />
                    Design System Showcase
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Interactive demonstration of Guidelines.md implementation
                  </p>
                </div>
                <div className="flex gap-2">
                  <PrimaryButton
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                    size="sm"
                  >
                    Back to Home
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </header>
        )}
      </ScrollEdgeHandler>

      {/* Navigation */}
      <div className="container mx-auto px-4 py-6">
        <div className="glass-regular rounded-2xl p-4">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <motion.button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background/50 hover:bg-background text-foreground'
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-12">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {activeSection === 'glass-panel' && <GlassPanelSection />}
          {activeSection === 'vibrant-text' && <VibrantTextSection />}
          {activeSection === 'motion' && <MotionSection />}
          {activeSection === 'layout' && <LayoutSection />}
          {activeSection === 'accessibility' && <AccessibilitySection />}
          {activeSection === 'scroll-edge' && <ScrollEdgeSection />}
          {activeSection === 'anti-patterns' && <AntiPatternsSection />}
        </motion.div>
      </div>
    </div>
  );
}

// Section 1: GlassPanel Showcase (Guidelines §4.2, §4.3)
function GlassPanelSection() {
  const [material, setMaterial] = useState<'functional' | 'content'>('functional');
  const [density, setDensity] = useState<'ultra-thin' | 'thin' | 'regular' | 'thick'>('regular');
  const [emphasis, setEmphasis] = useState<'low' | 'medium' | 'high'>('medium');

  return (
    <div className="space-y-8">
      <div className="material-regular rounded-2xl p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">GlassPanel Showcase</h2>
        <DescriptionText>
          Guidelines §4.2 (Functional) & §4.3 (Content). Material Kaca Fluidik untuk navigasi/kontrol,
          Material Standar untuk konten.
        </DescriptionText>
      </div>

      {/* Controls */}
      <div className="glass-regular rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Controls</h3>
        
        <div className="space-y-2">
          <ShortLabel>Material Type</ShortLabel>
          <div className="flex gap-2">
            {(['functional', 'content'] as const).map((type) => (
              <PrimaryButton
                key={type}
                onClick={() => setMaterial(type)}
                variant={material === type ? 'default' : 'outline'}
                size="sm"
              >
                {type}
              </PrimaryButton>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <ShortLabel>Density</ShortLabel>
          <div className="flex flex-wrap gap-2">
            {(['ultra-thin', 'thin', 'regular', 'thick'] as const).map((d) => (
              <PrimaryButton
                key={d}
                onClick={() => setDensity(d)}
                variant={density === d ? 'default' : 'outline'}
                size="sm"
              >
                {d}
              </PrimaryButton>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <ShortLabel>Emphasis</ShortLabel>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((e) => (
              <PrimaryButton
                key={e}
                onClick={() => setEmphasis(e)}
                variant={emphasis === e ? 'default' : 'outline'}
                size="sm"
              >
                {e}
              </PrimaryButton>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div 
        className="relative min-h-[400px] rounded-2xl overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=800&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <GlassPanel
            material={material}
            density={density}
            emphasis={emphasis}
            className="max-w-md w-full p-8 space-y-4"
          >
            <VibrantText preset="heading">Glass Panel Preview</VibrantText>
            <VibrantText preset="description">
              This panel adapts its blur, opacity, and vibrancy based on the selected material,
              density, and emphasis settings. Background content remains visible through the glass.
            </VibrantText>
            <div className="flex gap-2 pt-4">
              <PrimaryButton size="sm">Primary Action</PrimaryButton>
              <PrimaryButton variant="outline" size="sm">
                Secondary
              </PrimaryButton>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Tinted Glass */}
      <div className="grid md:grid-cols-3 gap-4">
        <TintedGlassPanel tintColor="primary" className="p-6">
          <VibrantText preset="label" className="mb-2">Primary Tint</VibrantText>
          <VibrantText preset="description">Volumetric tinting (Guidelines §3.5.3)</VibrantText>
        </TintedGlassPanel>
        <TintedGlassPanel tintColor="success" className="p-6">
          <VibrantText preset="label" className="mb-2">Success Tint</VibrantText>
          <VibrantText preset="description">Interacts with light and material</VibrantText>
        </TintedGlassPanel>
        <TintedGlassPanel tintColor="warning" className="p-6">
          <VibrantText preset="label" className="mb-2">Warning Tint</VibrantText>
          <VibrantText preset="description">For emphasis on CTA elements</VibrantText>
        </TintedGlassPanel>
      </div>
    </div>
  );
}

// Section 2: VibrantText Showcase (Guidelines §3.5.2, §4.4)
function VibrantTextSection() {
  return (
    <div className="space-y-8">
      <div className="material-regular rounded-2xl p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">VibrantText Showcase</h2>
        <DescriptionText>
          Guidelines §3.5.2 (Vibrancy) & §4.4 (Keterbacaan Material). Teks secara otomatis
          menjaga kontras 4.5:1 di atas material apapun.
        </DescriptionText>
      </div>

      {/* Busy Background Test */}
      <div 
        className="relative min-h-[500px] rounded-2xl overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=800&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 grid md:grid-cols-2 gap-6 p-6">
          {/* Functional Glass */}
          <GlassPanel material="functional" density="regular" className="p-6 space-y-4">
            <VibrantText preset="heading">Functional Glass</VibrantText>
            <VibrantText preset="description">
              VibrantText automatically adapts to functional glass material, ensuring
              readability over busy backgrounds through perceptual color blending.
            </VibrantText>
            <Separator />
            <VibrantText preset="label">Primary Label</VibrantText>
            <VibrantText preset="description">
              Unlike simple opacity, vibrancy operates in perceptually uniform color space
              (CIELAB/Oklab) to guarantee contrast while feeling like the original color.
            </VibrantText>
          </GlassPanel>

          {/* Content Material */}
          <GlassPanel material="content" density="thick" className="p-6 space-y-4">
            <VibrantText preset="heading">Content Material</VibrantText>
            <VibrantText preset="description">
              Content material provides more opacity for better separation from
              background layers, while still maintaining the liquid glass aesthetic.
            </VibrantText>
            <Separator />
            <VibrantText preset="caption">Caption text remains readable</VibrantText>
            <div className="flex gap-2 pt-2">
              <CheckCircle2 className="h-5 w-5 text-chart-2" />
              <VibrantText preset="label">WCAG AA compliant</VibrantText>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Presets */}
      <div className="glass-regular rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">VibrantText Presets</h3>
        <div className="space-y-2">
          <VibrantText preset="heading">Heading - Largest, bold weight</VibrantText>
          <VibrantText preset="label">Label - Medium size, standard weight</VibrantText>
          <VibrantText preset="description">
            Description - Comfortable reading size for longer text blocks
          </VibrantText>
          <VibrantText preset="caption">Caption - Smallest, for metadata</VibrantText>
        </div>
      </div>
    </div>
  );
}

// Section 3: Motion Showcase (Guidelines §2.3.2)
function MotionSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFusing, setShowFusing] = useState(false);

  return (
    <div className="space-y-8">
      <div className="material-regular rounded-2xl p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Motion Showcase</h2>
        <DescriptionText>
          Guidelines §2.3.2 (Fluiditas). Flexing, Morphing, dan Fusing menggunakan
          spring physics untuk interaksi yang terasa hidup dan responsif.
        </DescriptionText>
      </div>

      {/* Flexing - PrimaryButton */}
      <div className="glass-regular rounded-2xl p-8 space-y-4">
        <h3 className="font-semibold text-foreground">Flexing (Melentur)</h3>
        <DescriptionText>
          Tombol "melentur" dengan scale down dan glow saat ditekan. Spring animation
          dengan stiffness 300, damping 20. Touch feedback {'<'}100ms.
        </DescriptionText>
        <div className="flex flex-wrap gap-4 pt-4">
          <PrimaryButton>Default Button</PrimaryButton>
          <PrimaryButton variant="outline">Outline Button</PrimaryButton>
          <PrimaryButton variant="ghost">Ghost Button</PrimaryButton>
          <PrimaryButton size="lg" className="gap-2">
            <Heart className="h-5 w-5" />
            With Icon
          </PrimaryButton>
        </div>
      </div>

      {/* Morphing - MorphingIcon */}
      <div className="glass-regular rounded-2xl p-8 space-y-4">
        <h3 className="font-semibold text-foreground">Morphing (Berubah Bentuk)</h3>
        <DescriptionText>
          Icon berubah bentuk antar 2 SVG path menggunakan spring interpolation.
          Transisi mulus antara status fungsional (Play ↔ Pause).
        </DescriptionText>
        <div className="flex items-center gap-6 pt-4">
          <PrimaryButton
            onClick={() => setIsPlaying(!isPlaying)}
            className="gap-2"
          >
            <MorphingIcon
              iconA={Play}
              iconB={Pause}
              isActive={isPlaying}
              size={20}
            />
            {isPlaying ? 'Pause' : 'Play'}
          </PrimaryButton>
          <span className="text-sm text-muted-foreground">
            Click to toggle morphing animation
          </span>
        </div>
      </div>

      {/* Fusing - FusingNotification */}
      <div className="glass-regular rounded-2xl p-8 space-y-4">
        <h3 className="font-semibold text-foreground">Fusing (Menggabung)</h3>
        <DescriptionText>
          Elemen berdekatan bergabung secara visual seperti tetes air menggunakan
          blur + contrast filter. Hover untuk melihat efek fusing.
        </DescriptionText>
        <div className="pt-4">
          <PrimaryButton
            onClick={() => setShowFusing(!showFusing)}
            className="mb-6"
          >
            {showFusing ? 'Hide' : 'Show'} Fusing Demo
          </PrimaryButton>
          {showFusing && <FusingNotification />}
        </div>
      </div>

      {/* LayeredIcon - Dynamic Lighting */}
      <div className="glass-regular rounded-2xl p-8 space-y-4">
        <h3 className="font-semibold text-foreground">Layered Icons (Guidelines §8.3.1)</h3>
        <DescriptionText>
          Icons dengan 3 lapisan (background, middle, foreground) + dynamic lighting,
          shadows, dan parallax effect.
        </DescriptionText>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
          <div className="flex flex-col items-center gap-2">
            <LayeredIcon icon={Heart} variant="primary" />
            <span className="text-sm text-muted-foreground">Primary</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <LayeredIcon icon={Star} variant="success" />
            <span className="text-sm text-muted-foreground">Success</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <LayeredIcon icon={Sparkles} variant="warning" />
            <span className="text-sm text-muted-foreground">Warning</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <LayeredIcon icon={AlertTriangle} variant="error" />
            <span className="text-sm text-muted-foreground">Error</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Section 4: Layout Showcase (Guidelines §1.2.1, §1.3.1)
function LayoutSection() {
  const [formFactor, setFormFactor] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  return (
    <div className="space-y-8">
      <div className="material-regular rounded-2xl p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Layout Showcase</h2>
        <DescriptionText>
          Guidelines §1.2.1 (Form Factor) & §1.3.1 (Safe Area). Strategi adaptif
          untuk mobile, tablet, dan desktop dengan ergonomi matematis.
        </DescriptionText>
      </div>

      {/* Form Factor Simulator */}
      <div className="glass-regular rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Form Factor Simulator</h3>
        <div className="flex gap-2">
          {(['mobile', 'tablet', 'desktop'] as const).map((factor) => {
            const Icon = factor === 'mobile' ? Smartphone : factor === 'tablet' ? Tablet : Monitor;
            return (
              <PrimaryButton
                key={factor}
                onClick={() => setFormFactor(factor)}
                variant={formFactor === factor ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {factor}
              </PrimaryButton>
            );
          })}
        </div>
      </div>

      {/* Layout Preview */}
      <div className="flex justify-center">
        <motion.div
          key={formFactor}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'border-4 border-border rounded-3xl overflow-hidden shadow-2xl',
            formFactor === 'mobile' && 'w-[375px] h-[667px]',
            formFactor === 'tablet' && 'w-[768px] h-[600px]',
            formFactor === 'desktop' && 'w-full max-w-5xl h-[600px]'
          )}
        >
          <div className="relative h-full bg-gradient-to-br from-purple-100 via-blue-100 to-cyan-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
            {/* Safe Area Indicators */}
            {formFactor === 'mobile' && (
              <>
                <div className="absolute top-0 left-0 right-0 h-12 bg-black/90 flex items-center justify-center">
                  <div className="w-32 h-6 bg-black rounded-full" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/90 flex items-center justify-center">
                  <div className="w-32 h-1 bg-white/50 rounded-full" />
                </div>
              </>
            )}

            {/* Content */}
            <div
              className={cn(
                'h-full flex flex-col',
                formFactor === 'mobile' && 'pt-12 pb-20'
              )}
            >
              {/* Header */}
              <div className="glass-regular p-4">
                <h3 className="text-foreground font-semibold">App Header</h3>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {formFactor === 'mobile' && (
                  <div className="space-y-4">
                    <div className="material-regular rounded-xl p-4">
                      <p className="text-foreground">Stacked Layout (Mobile)</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Vertical stack, single column, tab bar at bottom (Green Zone)
                      </p>
                    </div>
                  </div>
                )}

                {formFactor === 'tablet' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="material-regular rounded-xl p-4 space-y-2">
                      <p className="text-foreground font-semibold">Split View (Tablet)</p>
                      <p className="text-sm text-muted-foreground">
                        Dual pane layout, sidebar navigation
                      </p>
                    </div>
                    <div className="material-regular rounded-xl p-4 space-y-2">
                      <p className="text-foreground font-semibold">Content Pane</p>
                      <p className="text-sm text-muted-foreground">
                        Multi-column grid, increased information density
                      </p>
                    </div>
                  </div>
                )}

                {formFactor === 'desktop' && (
                  <div className="grid grid-cols-12 gap-4 h-full">
                    <div className="col-span-3 space-y-4">
                      <div className="material-regular rounded-xl p-4">
                        <p className="text-foreground font-semibold">Sidebar</p>
                        <p className="text-sm text-muted-foreground mt-2">Persistent navigation</p>
                      </div>
                    </div>
                    <div className="col-span-6 space-y-4">
                      <div className="material-regular rounded-xl p-4">
                        <p className="text-foreground font-semibold">Main Content</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Primary workspace area
                        </p>
                      </div>
                    </div>
                    <div className="col-span-3 space-y-4">
                      <div className="material-regular rounded-xl p-4">
                        <p className="text-foreground font-semibold">Inspector</p>
                        <p className="text-sm text-muted-foreground mt-2">Contextual actions</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Toolbar (Mobile only) */}
              {formFactor === 'mobile' && (
                <div className="glass-regular p-4 flex justify-around items-center">
                  {[Heart, Star, Sparkles, Monitor].map((Icon, i) => (
                    <Icon key={i} className="h-6 w-6 text-primary" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Ergonomi Info */}
      <div className="glass-regular rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Ergonomi Matematis (Fitts's Law)</h3>
        <LongFormText maxCharacters={75}>
          Waktu (T) untuk mencapai target adalah fungsi logaritmik dari jarak (D) ke target
          dan lebar (W) target: T = a + b × log₂(1 + D/W)
        </LongFormText>
        <div className="grid md:grid-cols-3 gap-4 pt-4">
          <div className="material-thin rounded-xl p-4 border-l-4 border-l-chart-2">
            <ShortLabel className="text-chart-2">Green Zone (Easy)</ShortLabel>
            <DescriptionText className="mt-2">
              Bottom screen. Min distance (D), max width (W). Primary actions here.
            </DescriptionText>
          </div>
          <div className="material-thin rounded-xl p-4 border-l-4 border-l-yellow-500">
            <ShortLabel className="text-yellow-600 dark:text-yellow-400">Yellow Zone (Stretch)</ShortLabel>
            <DescriptionText className="mt-2">
              Top screen. High D, small W. Secondary navigation only.
            </DescriptionText>
          </div>
          <div className="material-thin rounded-xl p-4 border-l-4 border-l-destructive">
            <ShortLabel className="text-destructive">Red Zone (Hard)</ShortLabel>
            <DescriptionText className="mt-2">
              Top corners. Max distance. Avoid critical actions here.
            </DescriptionText>
          </div>
        </div>
      </div>
    </div>
  );
}

// Section 5: Accessibility Showcase (Guidelines §2.5, §8.5.3, §1.4.3)
function AccessibilitySection() {
  return (
    <div className="space-y-8">
      <div className="material-regular rounded-2xl p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Accessibility Showcase</h2>
        <DescriptionText>
          Guidelines §2.5 (Reduce Motion), §8.5.3 (Reduce Transparency), §1.4.3 (Dynamic Type),
          §8.5.4 (Window Focus). Sistem adaptif untuk semua pengguna.
        </DescriptionText>
      </div>

      {/* Reduce Motion Demo */}
      <div className="glass-regular rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Reduce Motion</h3>
        <DescriptionText>
          Spring animations fallback ke cross-fade sederhana. Sistem mendeteksi
          prefers-reduced-motion media query dan mengganti animasi kompleks.
        </DescriptionText>
        <div className="material-thin rounded-xl p-4 border-l-4 border-l-primary">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Test:</strong> Enable "Reduce Motion" di system preferences.
            Semua spring animations akan berubah menjadi simple opacity transitions.
          </p>
        </div>
      </div>

      {/* Reduce Transparency Demo */}
      <div className="glass-regular rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Reduce Transparency</h3>
        <DescriptionText>
          Glass material fallback ke opaque solid dengan system tokens. Drastis
          menghemat GPU power dan battery life.
        </DescriptionText>
        <div className="material-thin rounded-xl p-4 border-l-4 border-l-primary">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Test:</strong> Enable "Reduce Transparency" di system preferences.
            Semua glass panels akan menjadi solid opaque dengan bg-background/border-border tokens.
          </p>
        </div>
      </div>

      {/* Dynamic Type Demo */}
      <div className="glass-regular rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Dynamic Type (XXXL+)</h3>
        <DescriptionText>
          Layout beradaptasi dengan font scale pengguna. Tidak ada clipping atau overlap
          pada ukuran font terbesar.
        </DescriptionText>
        <div className="space-y-4 pt-4">
          <div className="material-regular rounded-xl p-4 space-y-2">
            <LongFormText maxCharacters={65}>
              LongFormText component automatically constrains line length to 45-75 characters
              untuk optimal readability, bahkan saat font size berubah drastis.
            </LongFormText>
          </div>
          <div className="material-regular rounded-xl p-4 space-y-2">
            <ShortLabel>Short Label</ShortLabel>
            <DescriptionText>
              ShortLabel dan DescriptionText components scale appropriately tanpa
              breaking layout integrity.
            </DescriptionText>
          </div>
        </div>
        <div className="material-thin rounded-xl p-4 border-l-4 border-l-primary">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Test:</strong> Increase text size di system preferences
            hingga XXXL+. UI elements harus tumbuh vertikal, tidak ada text clipping.
          </p>
        </div>
      </div>

      {/* Window Focus Demo */}
      <div className="glass-regular rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Window Focus State (Desktop §8.5.4)</h3>
        <WindowFocusDemo />
      </div>
    </div>
  );
}

// Section 6: Scroll-Edge Interaction (Guidelines §4.5.3)
function ScrollEdgeSection() {
  const dummyItems = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-8">
      <div className="material-regular rounded-2xl p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Scroll-Edge Interaction</h2>
        <DescriptionText>
          Guidelines §4.5.3. Navigation bar adapts dynamically saat content scroll
          di bawahnya. Transparent → Glass material untuk kontras.
        </DescriptionText>
      </div>

      <div className="glass-regular rounded-2xl overflow-hidden">
        <div className="relative">
          <ScrollEdgeHandler>
            {(isScrolled) => (
              <div
                className={cn(
                  'sticky top-0 z-10 transition-all duration-300 border-b',
                  isScrolled
                    ? 'glass-regular border-border shadow-lg'
                    : 'bg-transparent border-transparent'
                )}
              >
                <div className="p-4 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Scrollable Header</h3>
                  <span className="text-sm text-muted-foreground">
                    {isScrolled ? '🔒 Glass Active' : '🔓 Transparent'}
                  </span>
                </div>
              </div>
            )}
          </ScrollEdgeHandler>

          <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
            <div className="space-y-3">
              {dummyItems.map((item) => (
                <div
                  key={item}
                  className="material-regular rounded-xl p-4 flex items-center justify-between"
                >
                  <span className="text-foreground">List Item {item}</span>
                  <span className="text-sm text-muted-foreground">Scroll me</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="material-thin rounded-xl p-4 border-l-4 border-l-primary">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Implementation:</strong> ScrollEdgeHandler maps scroll
          offset (Y-position) to material opacity. Automatic for standard navigation bars
          paired with scroll views.
        </p>
      </div>
    </div>
  );
}

// Section 7: Anti-Patterns (Guidelines §8.5.1, §8.5.2)
function AntiPatternsSection() {
  const [showAntiPattern, setShowAntiPattern] = useState(false);

  return (
    <div className="space-y-8">
      <div className="material-regular rounded-2xl p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Anti-Patterns</h2>
        <DescriptionText>
          Guidelines §8.5.1 (Glass-on-Glass) & §8.5.2 (Clear Glass without Dimming).
          Visual regression tests untuk anti-patterns yang harus dihindari.
        </DescriptionText>
      </div>

      {/* Glass-on-Glass Anti-Pattern */}
      <div className="glass-regular rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Glass-on-Glass (§8.5.1)</h3>
            <DescriptionText>
              NEVER stack functional glass materials on top of each other (e.g., popover
              on sidebar, sheet on tab bar). Creates visual noise, breaks depth hierarchy.
            </DescriptionText>
          </div>
        </div>

        <div className="pt-4">
          <PrimaryButton
            onClick={() => setShowAntiPattern(!showAntiPattern)}
            variant="destructive"
            className="gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            {showAntiPattern ? 'Hide' : 'Show'} Anti-Pattern
          </PrimaryButton>
        </div>

        {showAntiPattern && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-regular rounded-xl p-6 border-4 border-destructive relative"
          >
            <div className="absolute -top-3 left-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-semibold">
              ❌ ANTI-PATTERN
            </div>
            <p className="text-foreground mb-4">This is functional glass (toolbar)</p>
            
            {/* Nested glass - WRONG! */}
            <div className="glass-regular rounded-xl p-4 border-2 border-yellow-500">
              <p className="text-foreground mb-2">❌ Nested functional glass (popover)</p>
              <p className="text-sm text-muted-foreground">
                Two glass layers stacked = visual chaos. Which one is on top?
                Use material-regular for nested content instead.
              </p>
            </div>
          </motion.div>
        )}

        {/* Correct Pattern */}
        <div className="glass-regular rounded-xl p-6 border-4 border-chart-2">
          <div className="absolute -top-3 left-4 bg-chart-2 text-white px-3 py-1 rounded-full text-sm font-semibold">
            ✅ CORRECT
          </div>
          <p className="text-foreground mb-4">This is functional glass (toolbar)</p>
          
          {/* Content material - CORRECT! */}
          <div className="material-regular rounded-xl p-4 border-2 border-chart-2">
            <p className="text-foreground mb-2">✅ Content material (nested element)</p>
            <p className="text-sm text-muted-foreground">
              Clear hierarchy. Functional glass for navigation, content material for
              nested content. Clean visual separation.
            </p>
          </div>
        </div>
      </div>

      {/* Clear Glass without Dimming Anti-Pattern */}
      <div className="glass-regular rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Clear Glass without Dimming (§8.5.2)</h3>
            <DescriptionText>
              Clear glass variant (§4.2.5) MUST have thin dimming layer when over busy media.
              Without dimming: contrast failure, accessibility fail.
            </DescriptionText>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 pt-4">
          {/* Wrong: Clear glass without dimming */}
          <div 
            className="relative rounded-xl overflow-hidden h-64 border-4 border-destructive"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=600&fit=crop)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute -top-3 left-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-semibold z-10">
              ❌ WITHOUT DIMMING
            </div>
            <GlassPanel
              material="functional"
              density="ultra-thin"
              emphasis="low"
              className="absolute inset-x-4 top-12 p-4"
            >
              <p className="text-foreground mb-2">Clear Glass</p>
              <p className="text-sm">
                Text hard to read over busy background! Contrast fail.
              </p>
            </GlassPanel>
          </div>

          {/* Correct: Clear glass WITH dimming */}
          <div 
            className="relative rounded-xl overflow-hidden h-64 border-4 border-chart-2"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=600&fit=crop)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute -top-3 left-4 bg-chart-2 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
              ✅ WITH DIMMING
            </div>
            {/* Dimming layer */}
            <div className="absolute inset-0 bg-black/35" />
            <GlassPanel
              material="functional"
              density="ultra-thin"
              emphasis="low"
              className="absolute inset-x-4 top-12 p-4"
            >
              <p className="text-foreground mb-2">Clear Glass + Dimming</p>
              <p className="text-sm text-muted-foreground">
                Dimming layer provides minimum contrast floor. Text readable!
              </p>
            </GlassPanel>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="material-thin rounded-xl p-6 border-l-4 border-l-primary space-y-4">
        <h3 className="font-semibold text-foreground">Anti-Pattern Checklist</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-chart-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              ✅ Use functional glass ONLY for navigation/controls (toolbar, tab bar, sidebar)
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-chart-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              ✅ Use content material for nested elements, never stack functional glass
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-chart-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              ✅ Always add dimming layer (black/35%) between clear glass and busy media
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-chart-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              ✅ Test all glass materials with Reduce Transparency enabled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
