import { useCallback } from 'react';
import { NavigateOptions, To, useNavigate } from 'react-router-dom';

/**
 * Wraps React Router's navigate to ensure we always return void.
 * This keeps lint rules like no-floating-promises satisfied when
 * navigate may return a Promise (e.g., data routers).
 */
export const useNonBlockingNavigate = () => {
  const navigate = useNavigate();

  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (options) {
        navigate(to, options);
        return;
      }
      navigate(to);
    },
    [navigate]
  );
};
