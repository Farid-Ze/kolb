import { describe, expect, it } from 'vitest';
import { normalizeUserRole } from '../../contexts/authUtils';
import type { Role } from '../../contexts/auth.types';

type BackendRole = 'MAHASISWA' | Role;

const buildBackendUser = (role: BackendRole) => ({
  id: 'user-1',
  email: 'user@example.com',
  name: 'Nama User',
  role,
  created_at: '2025-01-01T00:00:00.000Z',
});

describe('Role propagation contract', () => {
  it('normalizes MAHASISWA payloads into STUDENT for the UI', () => {
    const normalized = normalizeUserRole(buildBackendUser('MAHASISWA'));
    expect(normalized.role).toBe('STUDENT');
  });

  it('leaves MEDIATOR and ADMIN roles untouched', () => {
    const privileged: Role[] = ['MEDIATOR', 'ADMIN'];
    privileged.forEach((role) => {
      const normalized = normalizeUserRole(buildBackendUser(role));
      expect(normalized.role).toBe(role);
    });
  });

  it('is idempotent to prevent double-normalization drift', () => {
    const once = normalizeUserRole(buildBackendUser('MAHASISWA'));
    const twice = normalizeUserRole(once);
    expect(twice.role).toBe('STUDENT');
    expect(twice).toEqual(once);
  });
});
