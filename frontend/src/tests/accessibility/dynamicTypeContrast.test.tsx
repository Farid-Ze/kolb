/**
 * Dynamic Type & Contrast Accessibility Tests
 * Guidelines.md §1.4.3 & §3.4
 */
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor, renderHook } from '@testing-library/react';
import { AccessibleHeading } from '../../components/ui/AccessibleHeading';
import { useContrastGuard } from '../../hooks/useContrastGuard';
import { WCAGLevel } from '../../lib/accessibility';

type CssVarMap = Record<string, string>;

const ORIGINAL_GET_COMPUTED_STYLE = window.getComputedStyle;

const setupComputedStyleMock = (fontSize: string, vars: CssVarMap) => {
  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });

  return vi
    .spyOn(window, 'getComputedStyle')
    .mockImplementation(() => ({
      fontSize,
      getPropertyValue: (prop: string) => vars[prop] ?? '',
    } as CSSStyleDeclaration));
};

afterEach(() => {
  document.documentElement.style.cssText = '';
  window.getComputedStyle = ORIGINAL_GET_COMPUTED_STYLE;
  vi.restoreAllMocks();
});

describe('AccessibleHeading dynamic type behaviour', () => {
  it('applies relaxed line-height for XXXL scale to prevent clipping', () => {
    const spy = setupComputedStyleMock('24px', {
      '--foreground': '#111827',
      '--background': '#ffffff',
    });

    render(<AccessibleHeading variant="section">Instruksi</AccessibleHeading>);
    const heading = screen.getByRole('heading', { name: 'Instruksi' });
    expect(heading.className).toMatch(/leading-relaxed/);

    spy.mockRestore();
  });
});

describe('useContrastGuard', () => {
  it('falls back to safe color when contrast ratio fails WCAG AA', async () => {
    setupComputedStyleMock('16px', {
      '--foreground': '#f4f4f4',
      '--background': '#ffffff',
    });

    const { result } = renderHook(() =>
      useContrastGuard({
        foregroundVar: '--foreground',
        backgroundVar: '--background',
        level: WCAGLevel.AA,
      })
    );

    await waitFor(() => {
      expect(result.current.color).toBe('#111827');
    });
  });
});
