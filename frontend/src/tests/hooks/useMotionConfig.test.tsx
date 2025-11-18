import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  UIPreferencesContext,
  UIPreferencesContextType,
} from '../../contexts/UIPreferencesContext';
import {
  useMotionConfig,
  SPRING_CONFIG,
  CROSS_FADE,
} from '../../lib/motion';

const TestComponent = () => {
  const transition = useMotionConfig();
  return (
    <div data-testid="transition">{JSON.stringify(transition)}</div>
  );
};

const renderWithPreference = (reduceMotion?: boolean) => {
  if (reduceMotion === undefined) {
    return render(<TestComponent />);
  }

  const noop = () => {};
  const value: UIPreferencesContextType = {
    theme: 'light',
    reduceMotion,
    reduceTransparency: false,
    setTheme: noop,
    toggleTheme: noop,
    setReduceMotion: noop,
    setReduceTransparency: noop,
  };

  return render(
    <UIPreferencesContext.Provider value={value}>
      <TestComponent />
    </UIPreferencesContext.Provider>
  );
};

describe('useMotionConfig', () => {
  it('returns spring config when motion is allowed', () => {
    renderWithPreference(false);
    expect(screen.getByTestId('transition').textContent).toEqual(
      JSON.stringify(SPRING_CONFIG)
    );
  });

  it('returns fallback when context requests reduced motion', () => {
    renderWithPreference(true);
    expect(screen.getByTestId('transition').textContent).toEqual(
      JSON.stringify(CROSS_FADE)
    );
  });

  it('uses system preference when context is absent', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    renderWithPreference();
    expect(screen.getByTestId('transition').textContent).toEqual(
      JSON.stringify(CROSS_FADE)
    );

    window.matchMedia = originalMatchMedia;
  });
});
