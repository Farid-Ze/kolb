import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/useAuth';
import { getSession } from '../services/sessionService';
import type { Session } from '../types/api';

type Role = 'STUDENT' | 'MEDIATOR' | 'ADMIN';

interface UseSessionGuardOptions {
  /** Force guard even if sessionId missing; default true */
  enforce?: boolean;
  /** Roles that naturally bypass ownership checks */
  privilegedRoles?: Role[];
}

interface SessionGuardResult {
  isChecking: boolean;
  hasAccess: boolean;
  reason?: string;
  session?: Session;
}

const DEFAULT_PRIVILEGED: Role[] = ['MEDIATOR', 'ADMIN'];

export const useSessionGuard = (
  sessionId?: string | null,
  options: UseSessionGuardOptions = {},
): SessionGuardResult => {
  const { user } = useAuth();
  const enforce = options.enforce ?? true;
  const privilegedRoles = options.privilegedRoles ?? DEFAULT_PRIVILEGED;

  const normalizedId = sessionId?.toString().trim();
  const shouldFetch = Boolean(enforce && normalizedId && user);

  const {
    data,
    error,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['session-guard', normalizedId],
    queryFn: () => getSession(normalizedId!),
    enabled: shouldFetch,
    retry: false,
  });

  const result = useMemo<SessionGuardResult>(() => {
    if (!enforce || !shouldFetch) {
      return { isChecking: false, hasAccess: true };
    }

    if (isLoading) {
      return { isChecking: true, hasAccess: false };
    }

    if (isError) {
      const message = error instanceof Error ? error.message : 'Sesi tidak dapat diverifikasi.';
      return { isChecking: false, hasAccess: false, reason: message };
    }

    if (!data) {
      return {
        isChecking: false,
        hasAccess: false,
        reason: 'Data sesi tidak ditemukan.',
      };
    }

    const isPrivileged = privilegedRoles.includes((user?.role as Role) ?? 'STUDENT');
    if (isPrivileged) {
      return { isChecking: false, hasAccess: true, session: data };
    }

    const ownsSession = data.user_id === user?.id;
    if (!ownsSession) {
      return {
        isChecking: false,
        hasAccess: false,
        reason: 'Sesi ini tidak terhubung dengan akun Anda.',
      };
    }

    return { isChecking: false, hasAccess: true, session: data };
  }, [data, enforce, error, isError, isLoading, privilegedRoles, shouldFetch, user?.id, user?.role]);

  return result;
};
