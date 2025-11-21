import { useCallback } from 'react';

interface UseAsyncHandlerOptions {
  onError?: (error: unknown) => void;
  suppressConsoleError?: boolean;
}

type AsyncCallback<TArgs extends unknown[]> = (
  ...args: TArgs
) => Promise<unknown> | void;

/**
 * Provides a memoized callback that safely executes an async function without
 * forcing every call-site to sprinkle `void` or `catch` statements.
 * Errors are surfaced through the optional `onError` callback to keep
 * event handlers deterministic.
 */
export function useAsyncHandler<TArgs extends unknown[]>(
  handler: AsyncCallback<TArgs>,
  options?: UseAsyncHandlerOptions
): (...args: TArgs) => void {
  const { onError, suppressConsoleError = false } = options ?? {};

  return useCallback(
    (...args: TArgs) => {
      try {
        const result = handler(...args);
        if (isPromiseLike(result)) {
          void result.catch((error) => {
            if (onError) {
              onError(error);
              return;
            }
            if (!suppressConsoleError) {
              console.error('[useAsyncHandler] unhandled rejection', error);
            }
          });
        }
      } catch (error) {
        if (onError) {
          onError(error);
          return;
        }
        if (!suppressConsoleError) {
          console.error('[useAsyncHandler] sync error', error);
        }
      }
    },
    [handler, onError, suppressConsoleError]
  );
}

const isPromiseLike = (value: unknown): value is Promise<unknown> =>
  typeof value === 'object' && value !== null && 'then' in value && typeof (value as Promise<unknown>).then === 'function';
