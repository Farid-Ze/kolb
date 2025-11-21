import type { Role, User } from './auth.types';

const mapIncomingRole = (value: string): Role => {
  if (value === 'MAHASISWA') {
    return 'STUDENT';
  }
  if (value === 'STUDENT' || value === 'MEDIATOR' || value === 'ADMIN') {
    return value;
  }
  return 'STUDENT';
};

export const normalizeUserRole = (userData: User): User => {
  const incoming = userData?.role ?? 'STUDENT';
  const normalizedRole = mapIncomingRole(incoming);
  if (normalizedRole === userData.role) {
    return userData;
  }
  return {
    ...userData,
    role: normalizedRole,
  };
};

export const isUser = (value: unknown): value is User => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<User>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.role === 'string' &&
    typeof candidate.created_at === 'string'
  );
};

export const parseStoredUser = (raw: string): User | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const assertUser = (value: unknown): User => {
  if (!isUser(value)) {
    throw new Error('Invalid user payload received from auth service');
  }
  return value;
};
