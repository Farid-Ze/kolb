/**
 * KLSI 4.0 - Reduce Transparency Fallback Tests
 * Task TODO2.md Phase 5.10
 * 
 * Guidelines.md §8.5.3:
 * - All glass materials must have opaque fallback
 * - Fallback colors must maintain contrast
 * - Saves GPU power & battery
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { TintedGlassButton } from '../../components/ui/TintedGlassButton';
import { ModalLayer } from '../../components/ui/ModalLayer';
import { UIPreferencesProvider } from '../../contexts/UIPreferencesContext';

interface TestScenario {
  name: string;
  component: React.ReactNode;
  expectedBehavior: string;
}

/**
 * Test scenarios untuk Reduce Transparency fallback
 * 
 * Guidelines §8.5.3:
 * 1. Glass materials → opaque background
 * 2. Tinted glass → solid color with opacity
 * 3. Modal backdrop → solid color, no blur
 * 4. Contrast ratios maintained
 */
export const ReduceTransparencyTests: React.FC = () => {
  const [modalOpen, setModalOpen] = React.useState(false);
  
  const scenarios: TestScenario[] = [
    {
      name: 'GlassPanel Functional (glass-regular)',
      component: (
        <GlassPanel material="functional" density="regular" className="p-6">
          <h3 className="text-foreground mb-2">Functional Glass</h3>
          <p className="text-muted-foreground">
            Should become: bg-background with border-border
          </p>
          <div className="mt-4 space-y-1">
            <p className="text-xs text-muted-foreground">Expected fallback:</p>
            <code className="text-xs">bg-background border border-border</code>
          </div>
        </GlassPanel>
      ),
      expectedBehavior: 'Blur removed, solid background with border',
    },
    {
      name: 'GlassPanel Content (material-regular)',
      component: (
        <GlassPanel material="content" variant="regular" className="p-6">
          <h3 className="text-foreground mb-2">Content Material</h3>
          <p className="text-muted-foreground">
            Should become: bg-background with border-border
          </p>
        </GlassPanel>
      ),
      expectedBehavior: 'Blur removed, solid background',
    },
    {
      name: 'TintedGlassButton',
      component: (
        <TintedGlassButton
          tintColor="hsl(var(--primary))"
          variant="primary"
          size="md"
          onClick={() => console.log('clicked')}
        >
          Primary CTA Button
        </TintedGlassButton>
      ),
      expectedBehavior: 'Tint becomes solid color with 0.9 opacity, no highlight overlay',
    },
    {
      name: 'Modal Backdrop',
      component: (
        <div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded"
          >
            Open Modal
          </button>
          <ModalLayer
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Test Modal"
          >
            <p>Modal backdrop should have no blur, only solid rgba(0,0,0,0.5)</p>
          </ModalLayer>
        </div>
      ),
      expectedBehavior: 'backdropFilter: none, backgroundColor: solid rgba',
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl text-foreground">
          Reduce Transparency Fallback Tests
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Guidelines.md §8.5.3: Semua material transparan harus memiliki fallback opaque.
          Toggle "Reduce Transparency" di AccessibilityTester untuk menguji.
        </p>
        
        {/* Instructions */}
        <div className="material-regular rounded-xl p-6 border-l-4 border-l-primary">
          <h2 className="text-foreground mb-3">Testing Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Open AccessibilityTester (dev panel)</li>
            <li>Enable "Reduce Transparency" checkbox</li>
            <li>Verify each component below loses blur/transparency</li>
            <li>Check text contrast ratios remain WCAG AA (4.5:1)</li>
            <li>Verify GPU usage drops (check DevTools Performance)</li>
          </ol>
        </div>
      </div>

      {/* Test Scenarios Grid */}
      <div className="grid gap-8">
        {scenarios.map((scenario, index) => (
          <div
            key={index}
            className="space-y-4 p-6 rounded-xl border border-border"
          >
            {/* Scenario Header */}
            <div className="space-y-2">
              <h3 className="text-lg text-foreground">
                {index + 1}. {scenario.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                <strong>Expected:</strong> {scenario.expectedBehavior}
              </p>
            </div>

            {/* Component Preview */}
            <div className="p-8 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-lg">
              {scenario.component}
            </div>

            {/* Visual Comparison Grid */}
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-sm text-foreground mb-2">Normal State:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>backdrop-filter: blur()</li>
                  <li>background: rgba with alpha</li>
                  <li>Highlight overlays visible</li>
                </ul>
              </div>
              <div>
                <p className="text-sm text-foreground mb-2">Reduce Transparency:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>backdrop-filter: none</li>
                  <li>background: opaque solid</li>
                  <li>Highlight overlays removed</li>
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contrast Check Reference */}
      <div className="material-thin rounded-xl p-6 space-y-4">
        <h2 className="text-foreground">Contrast Validation Reference</h2>
        <p className="text-sm text-muted-foreground">
          All fallback colors must meet WCAG AA standards:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-foreground">Required Ratios:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Normal text: 4.5:1 minimum</li>
              <li>Large text (18pt+): 3:1 minimum</li>
              <li>UI components: 3:1 minimum</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-foreground">Fallback Colors:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>bg-background: System adapted</li>
              <li>border-border: System adapted</li>
              <li>text-foreground: High contrast</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Performance Note */}
      <div className="material-thin rounded-xl p-6 border-l-4 border-l-chart-4">
        <h3 className="text-foreground mb-2">Performance Benefits</h3>
        <p className="text-sm text-muted-foreground">
          Reduce Transparency fallback drastically reduces GPU shader load:
        </p>
        <ul className="mt-3 text-xs text-muted-foreground space-y-1 list-disc list-inside ml-2">
          <li>Removes expensive blur fragment shaders</li>
          <li>Eliminates real-time backdrop sampling</li>
          <li>Saves battery on mobile devices</li>
          <li>Improves frame rate on older hardware</li>
        </ul>
      </div>
    </div>
  );
};

const renderWithUIPreferences = (ui: React.ReactElement) =>
  render(<UIPreferencesProvider>{ui}</UIPreferencesProvider>);

describe('ReduceTransparencyTests playground', () => {
  it('renders instructional copy and scenarios', () => {
    renderWithUIPreferences(<ReduceTransparencyTests />);
    expect(
      screen.getByText('Reduce Transparency Fallback Tests')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Guidelines\.md §8\.5\.3/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /GlassPanel Functional/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /TintedGlassButton/i })
    ).toBeInTheDocument();
  });

  it('shows modal instructions without crashing', async () => {
    const user = userEvent.setup();
    renderWithUIPreferences(<ReduceTransparencyTests />);
    await user.click(screen.getByRole('button', { name: /open modal/i }));
    expect(
      screen.getByText(/Modal backdrop should have no blur/i)
    ).toBeInTheDocument();
  });
});
