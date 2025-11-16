/**
 * KLSI 4.0 - useLocalStorage Hook Unit Tests
 * Tests untuk custom hook useLocalStorage
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with initial value when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial value')
    );

    const [value] = result.current;
    expect(value).toBe('initial value');
  });

  it('should initialize with value from localStorage if it exists', () => {
    const existingValue = { name: 'Test', age: 25 };
    localStorage.getItem = vi
      .fn()
      .mockReturnValue(JSON.stringify(existingValue));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', { name: '', age: 0 })
    );

    const [value] = result.current;
    expect(value).toEqual(existingValue);
    expect(localStorage.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      const [, setValue] = result.current;
      setValue('updated');
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify('updated')
    );
    expect(result.current[0]).toBe('updated');
  });

  it('should handle function updater', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      const [, setValue] = result.current;
      setValue((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'counter',
      JSON.stringify(1)
    );
  });

  it('should handle complex objects', () => {
    const complexObject = {
      user: { name: 'John', roles: ['admin', 'user'] },
      settings: { theme: 'dark', notifications: true },
    };

    const { result } = renderHook(() => useLocalStorage('config', null));

    act(() => {
      const [, setValue] = result.current;
      setValue(complexObject);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'config',
      JSON.stringify(complexObject)
    );
    expect(result.current[0]).toEqual(complexObject);
  });

  it('should handle localStorage read errors gracefully', () => {
    localStorage.getItem = vi.fn().mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const consoleErrorSpy = vi.spyOn(console, 'error');

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'fallback')
    );

    expect(result.current[0]).toBe('fallback');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should handle localStorage write errors gracefully', () => {
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const consoleErrorSpy = vi.spyOn(console, 'error');

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      const [, setValue] = result.current;
      setValue('new value');
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should handle invalid JSON in localStorage', () => {
    localStorage.getItem = vi.fn().mockReturnValue('invalid json {');

    const consoleErrorSpy = vi.spyOn(console, 'error');

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default')
    );

    expect(result.current[0]).toBe('default');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
