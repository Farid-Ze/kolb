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
const createMatchMediaList = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => true,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => createMatchMediaList(query)),
});

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '0px';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(private readonly callback?: IntersectionObserverCallback) {}

  disconnect(): void {
    // noop
  }

  observe(target: Element): void {
    void target;
    // noop
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve(target: Element): void {
    void target;
    // noop
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
  constructor(private readonly callback?: ResizeObserverCallback) {}

  observe(target: Element, options?: ResizeObserverOptions): void {
    void target;
    void options;
    // noop
  }

  unobserve(target: Element): void {
    void target;
    // noop
  }

  disconnect(): void {
    // noop
  }
}

globalThis.ResizeObserver = MockResizeObserver;

// Mock localStorage with in-memory store for deterministic tests
const createLocalStorageMock = (): Storage => {
  const storage = new Map<string, string>();
  const storageImpl = {
    get length() {
      return storage.size;
    },
    clear: vi.fn(() => {
      storage.clear();
    }),
    getItem: vi.fn((key: string) => (storage.has(key) ? storage.get(key)! : null)),
    key: vi.fn((index: number) => Array.from(storage.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
  } satisfies Storage;

  return storageImpl;
};

let localStorageMock = createLocalStorageMock();
globalThis.localStorage = localStorageMock;

beforeEach(() => {
  localStorageMock = createLocalStorageMock();
  globalThis.localStorage = localStorageMock;
});

// Mock console methods untuk cleaner test output (optional)
globalThis.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
