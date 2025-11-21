import { useState } from 'react';

/**
 * KLSI 4.0 - useLocalStorage Hook
 * Custom hook untuk sync state dengan localStorage
 */

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Get from localStorage atau use initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }
      const parsed: unknown = JSON.parse(item);
      return parsed as T;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  // Update localStorage saat storedValue berubah
  const setValue = (value: T | ((val: T) => T)) => {
    setStoredValue((prev) => {
      const valueToStore =
        typeof value === 'function'
          ? (value as (val: T) => T)(prev)
          : value;

      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      } catch (error) {
        console.error('Error writing to localStorage:', error);
        return prev;
      }
    });
  };

  return [storedValue, setValue];
}
