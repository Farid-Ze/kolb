import { useLatestAssessmentSession } from '../api/hooks';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

export const useAuthStatus = () => {
  const { isLoading, isUnauthorized } = useLatestAssessmentSession();

  let status: AuthStatus = 'loading';

  if (!isLoading) {
    if (isUnauthorized) {
      status = 'guest';
    } else {
      // If not loading and not unauthorized, we successfully hit the API (even if 404/null data)
      status = 'authenticated';
    }
  }

  return {
    status,
    isLoading,
    isAuthenticated: status === 'authenticated',
    isGuest: status === 'guest'
  };
};
