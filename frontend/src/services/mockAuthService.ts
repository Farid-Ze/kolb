/**
 * KLSI 4.0 - Mock Auth Service
 * Mock authentication untuk development/demo tanpa backend
 */

interface MockUser {
  email: string;
  password: string;
  userData: {
    id: string;
    email: string;
    name: string;
    role: 'STUDENT' | 'MEDIATOR' | 'ADMIN';
    created_at: string;
  };
}

// Mock users untuk demo
const MOCK_USERS: MockUser[] = [
  {
    email: 'demo@klsi.com',
    password: 'demo123',
    userData: {
      id: 'mock-user-1',
      email: 'demo@klsi.com',
      name: 'Demo Student',
      role: 'STUDENT',
      created_at: new Date().toISOString(),
    },
  },
  {
    email: 'mediator@klsi.com',
    password: 'mediator123',
    userData: {
      id: 'mock-user-2',
      email: 'mediator@klsi.com',
      name: 'Demo Mediator',
      role: 'MEDIATOR',
      created_at: new Date().toISOString(),
    },
  },
  {
    email: 'admin@klsi.com',
    password: 'admin123',
    userData: {
      id: 'mock-user-3',
      email: 'admin@klsi.com',
      name: 'Demo Admin',
      role: 'ADMIN',
      created_at: new Date().toISOString(),
    },
  },
];

interface MockLoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'STUDENT' | 'MEDIATOR' | 'ADMIN';
    created_at: string;
  };
}

/**
 * Mock login - simulasi delay network
 */
export const mockLogin = async (
  email: string,
  password: string
): Promise<MockLoginResponse> => {
  // Simulasi network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // CRITICAL: Triple-layer whitespace defense
  const cleanEmail = email.trim();
  const cleanPassword = password.trim();

  console.log('[Mock Auth] Login attempt:', { 
    email: cleanEmail, 
    passwordLength: cleanPassword.length,
    passwordPreview: cleanPassword.substring(0, 3) + '...'
  });

  // Cari user
  const mockUser = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === cleanEmail.toLowerCase()
  );

  if (!mockUser) {
    console.warn('[Mock Auth] ❌ Email tidak ditemukan:', cleanEmail);
    console.log('[Mock Auth] 📋 Valid emails:', MOCK_USERS.map(u => u.email).join(', '));
    throw new Error('Email tidak terdaftar');
  }

  // Debug password comparison
  console.log('[Mock Auth] 🔍 Password comparison:', {
    received: `"${cleanPassword}"`,
    expected: `"${mockUser.password}"`,
    match: mockUser.password === cleanPassword,
    receivedLength: cleanPassword.length,
    expectedLength: mockUser.password.length,
    receivedChars: cleanPassword.split('').map(c => c.charCodeAt(0)),
    expectedChars: mockUser.password.split('').map(c => c.charCodeAt(0)),
  });

  if (mockUser.password !== cleanPassword) {
    console.warn('[Mock Auth] ❌ Password salah untuk:', cleanEmail);
    console.log('[Mock Auth] 💡 Hint: Password yang benar adalah:', mockUser.password);
    console.log('[Mock Auth] 🔑 Valid demo credentials:');
    MOCK_USERS.forEach(u => {
      console.log(`   - ${u.email} / ${u.password} (${u.userData.role})`);
    });
    throw new Error('Password salah');
  }

  // Generate mock token
  const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log('[Mock Auth] ✅ Login berhasil:', mockUser.userData.name, '-', mockUser.userData.role);

  return {
    access_token: mockToken,
    token_type: 'Bearer',
    user: mockUser.userData,
  };
};

/**
 * Mock register
 */
export const mockRegister = async (data: {
  email: string;
  password: string;
  name: string;
}): Promise<{
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'MEDIATOR' | 'ADMIN';
  created_at: string;
}> => {
  // Simulasi network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Check if email already exists
  const existingUser = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === data.email.toLowerCase()
  );

  if (existingUser) {
    throw new Error('Email sudah terdaftar');
  }

  // Create new mock user
  return {
    id: `mock-user-${Date.now()}`,
    email: data.email,
    name: data.name,
    role: 'STUDENT',
    created_at: new Date().toISOString(),
  };
};

/**
 * Mock get current user
 */
export const mockGetCurrentUser = async (token: string): Promise<{
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'MEDIATOR' | 'ADMIN';
  created_at: string;
}> => {
  // Simulasi network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Validasi token format
  if (!token.startsWith('mock_token_')) {
    throw new Error('Invalid token');
  }

  // Return default mock user (assume at least one mock user is defined)
  const firstUser = MOCK_USERS[0];
  if (!firstUser) {
    throw new Error('No mock users configured');
  }
  return firstUser.userData;
};

/**
 * Get demo credentials info
 */
export const getDemoCredentials = (): Array<{
  email: string;
  password: string;
  role: string;
}> => {
  return MOCK_USERS.map((u) => ({
    email: u.email,
    password: u.password,
    role: u.userData.role,
  }));
};