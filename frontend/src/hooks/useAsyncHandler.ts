import { DependencyList, useCallback } from 'react';

interface UseAsyncHandlerOptions {
  onError?: (error: unknown) => void;
  suppressConsoleError?: boolean;
}

type AsyncCallback<TArgs extends unknown[]> = (
  ...args: TArgs
) => Promise<unknown>;

/**
 * Provides a memoized callback that safely executes an async function without
 * forcing every call-site to sprinkle `void` or `catch` statements.
 * Errors are surfaced through the optional `onError` callback to keep
 * event handlers deterministic.
 */
export function useAsyncHandler<TArgs extends unknown[]>(
  handler: AsyncCallback<TArgs>,
  deps: DependencyList = [],
  options?: UseAsyncHandlerOptions
): (...args: TArgs) => void {
  const memoizedHandler = useCallback(handler, deps);
  const { onError, suppressConsoleError = false } = options ?? {};

  return useCallback(
    (...args: TArgs) => {
      memoizedHandler(...args).catch((error) => {
        if (onError) {
          onError(error);
          return;
        }
        if (!suppressConsoleError) {
          // eslint-disable-next-line no-console -- centralized debug surface
          console.error('[useAsyncHandler] unhandled rejection', error);
        }
      });
    },
    [memoizedHandler, onError, suppressConsoleError]
  );
}
