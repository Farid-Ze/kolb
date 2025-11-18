/**
 * KLSI 4.0 - Test Setup Configuration
 * Global test setup dan mocks
 */
import React from 'react';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock Recharts globally to simplify integration tests
vi.mock('recharts', () => {
  const createStub = (defaultTestId?: string) =>
    ({ children, ['data-testid']: overrideTestId }: { children?: React.ReactNode; ['data-testid']?: string } = {}) =>
      React.createElement(
        'div',
        overrideTestId || defaultTestId ? { 'data-testid': overrideTestId || defaultTestId } : undefined,
        children,
      );

  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => React.createElement('div', undefined, children),
    ScatterChart: createStub('scatter-chart'),
    Scatter: createStub('scatter'),
    XAxis: createStub('x-axis'),
    YAxis: createStub('y-axis'),
    CartesianGrid: createStub('cartesian-grid'),
    Tooltip: createStub('tooltip'),
    ReferenceLine: createStub('reference-line'),
    Label: createStub('label'),
    Cell: createStub('cell'),
    BarChart: createStub('bar-chart'),
    Bar: createStub('bar'),
    Legend: createStub('legend'),
    RadarChart: createStub('radar-chart'),
    Radar: createStub('radar'),
    PolarGrid: createStub('polar-grid'),
    PolarAngleAxis: createStub('polar-angle-axis'),
    PolarRadiusAxis: createStub('polar-radius-axis'),
  };
});

// Mock window.matchMedia untuk testing responsive behavior
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock localStorage with in-memory store for deterministic tests
const createLocalStorageMock = () => {
  const storage = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => (storage.has(key) ? storage.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
    }),
    clear: vi.fn(() => {
      storage.clear();
    }),
  };
};

let localStorageMock = createLocalStorageMock();
globalThis.localStorage = localStorageMock as unknown as Storage;

beforeEach(() => {
  localStorageMock = createLocalStorageMock();
  globalThis.localStorage = localStorageMock as unknown as Storage;
});

// Mock console methods untuk cleaner test output (optional)
globalThis.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
