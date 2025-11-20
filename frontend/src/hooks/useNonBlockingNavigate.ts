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
      navigate(to, options);
    },
    [navigate]
  );
};
