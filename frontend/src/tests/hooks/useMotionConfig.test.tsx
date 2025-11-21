import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UIPreferencesContext } from '../../contexts/ui-preferences-context';
import type { UIPreferencesContextType } from '../../contexts/uiPreferences.types';
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
    const matchMediaMock = vi
      .spyOn(window, 'matchMedia')
      .mockImplementation((query: string): MediaQueryList => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => true,
      }));

    renderWithPreference();
    expect(screen.getByTestId('transition').textContent).toEqual(
      JSON.stringify(CROSS_FADE)
    );

    matchMediaMock.mockRestore();
  });
});
