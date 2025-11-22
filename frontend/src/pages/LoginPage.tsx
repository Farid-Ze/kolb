import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import { useReduceTransparency } from '../hooks/useReduceTransparency';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../contexts/useAuth';
import { API_BASE_URL } from '../config/api';
import { getDemoCredentials } from '../services/mockAuthService';
import { loginWithEmail } from '../services/authService';
import { Eye, EyeOff, LogIn, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/Label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { cn } from '../lib/utils';
import { NonDiagnosticNotice } from '../components/report/NonDiagnosticNotice';
import {
  CROSS_FADE,
  SPRING_SMOOTH,
  useMotionConfig,
  usePrefersReducedMotionSetting,
} from '../lib/motion';
import { consumeAuthIntent, consumeAuthErrorMessage } from '../utils/errorHandler';
import { useNonBlockingNavigate } from '../hooks/useNonBlockingNavigate';

/**
 * KLSI 4.0 - LoginPage
 * Tasks 11-15: LoginPage dengan shadcn/ui, react-hook-form, zod, React Query
 * 
 * Implementasi sesuai Guidelines.md:
 * - Liquid Glass material (glass-regular)
 * - Motion spring-based animation (Bagian 2.3.1)
 * - Accessibility (focus-visible, ARIA labels)
 * - Ergonomics (mobile-friendly button placement)
 */

// Zod validation schema (Task 14)
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .trim()
    .min(1, 'Password wajib diisi')
    .min(6, 'Password minimal 6 karakter')
    .max(64, 'Password maksimal 64 karakter'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNonBlockingNavigate();
  const location = useLocation();
  const { setAuthData } = useAuth();
  const reduceTransparency = useReduceTransparency();
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoInfo] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  React.useEffect(() => {
    const pendingMessage = consumeAuthErrorMessage();
    if (pendingMessage) {
      setFormError(pendingMessage);
    }
  }, []);

  const resolveRedirectTarget = React.useCallback(() => {
    // Priority 1: URL query parameter (explicit, debuggable)
    const searchParams = new URLSearchParams(location.search);
    const returnToParam = searchParams.get('returnTo');
    if (returnToParam) {
      const decoded = decodeURIComponent(returnToParam);
      // Safety: prevent infinite loop if returnTo points to login page
      if (!decoded.startsWith('/auth/login') && !decoded.startsWith('/auth/register')) {
        return decoded;
      }
    }

    // Priority 2: sessionStorage (auth:postLoginRedirect)
    const storedIntent = consumeAuthIntent();
    if (storedIntent && !storedIntent.startsWith('/auth/')) {
      return storedIntent;
    }

    // Priority 3: location.state.from
    const state = location.state as { from?: Location } | undefined;
    const fromState = state?.from?.pathname && !state.from.pathname.startsWith('/auth/')
      ? `${state.from.pathname}${state.from.search ?? ''}${state.from.hash ?? ''}`
      : undefined;
    if (fromState) {
      return fromState;
    }

    // Default: home page
    return '/';
  }, [location.search, location.state]);

  // Task 14: react-hook-form + zod integration
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Check if we're in demo mode (no backend)
  const isDemoMode = API_BASE_URL === '/api' || API_BASE_URL.includes('localhost');
  const demoCredentials = getDemoCredentials();

  // Task 13: useLoginMutation dengan React Query
  const mapErrorMessage = (errorMessage: string) => {
    if (/unable to reach/i.test(errorMessage) || /network error/i.test(errorMessage)) {
      return 'Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.';
    }
    return errorMessage;
  };

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await loginWithEmail(data.email, data.password);
      return response;
    },
    onSuccess: (response) => {
      // Store auth data using AuthContext
      const { access_token, user: userData } = response;
      setAuthData(access_token, userData);
      setFormError(null);
      
      toast.success('Login berhasil! Selamat datang ' + userData.name);
      
      // Navigate to stored intent or home page
      const target = resolveRedirectTarget();
      if (target === '/') {
        if (userData.role === 'MEDIATOR') {
          navigate('/mediator', { replace: true });
          return;
        }
        if (userData.role === 'RESEARCHER') {
          navigate('/research', { replace: true });
          return;
        }
      }
      navigate(target, { replace: true });
    },
    // Task 15: toast.error on mutation error
    onError: (error: Error) => {
      const rawMessage = error.message || 'Login gagal. Silakan coba lagi.';
      const friendlyMessage = mapErrorMessage(rawMessage);
      setFormError(friendlyMessage);
      
      // Jika error adalah password salah, berikan hint yang lebih membantu
      if (friendlyMessage.includes('Password salah') || friendlyMessage.includes('Email tidak terdaftar')) {
        toast.error(friendlyMessage, {
          description: 'Gunakan Quick Login buttons atau credentials: demo@klsi.com / demo123',
          duration: 5000,
        });
      } else {
        toast.error(friendlyMessage);
      }
    },
  });

  const onSubmit = (data: LoginFormData) => {
    // Trim whitespace to avoid login errors
    const trimmedData = {
      email: data.email.trim(),
      password: data.password.trim(),
    };
    console.log('[LoginPage] Manual login attempt:', { email: trimmedData.email, passwordLength: trimmedData.password.length });
    setFormError(null);
    loginMutation.mutate(trimmedData);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  // Quick login - langsung login dengan kredensial demo
  const quickLogin = (email: string, password: string) => {
    // CRITICAL: Trim whitespace untuk menghindari login errors
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    console.log('[LoginPage] Quick login:', { 
      email: trimmedEmail, 
      password: trimmedPassword 
    });
    
    toast.info('Memproses login...', { duration: 1000 });
    setFormError(null);
    loginMutation.mutate({ 
      email: trimmedEmail, 
      password: trimmedPassword 
    });
  };

  const prefersReducedMotion = usePrefersReducedMotionSetting();
  const cardTransition = useMotionConfig(SPRING_SMOOTH, CROSS_FADE);
  const infoTransition = React.useMemo(
    () => ({ ...cardTransition, delay: prefersReducedMotion ? 0 : 0.15 }),
    [cardTransition, prefersReducedMotion]
  );
  const cardInitial = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 };
  const cardAnimate = prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 };
  const infoInitial = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 };
  const infoAnimate = prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
      {/* Main Auth Card */}
      <motion.div
        className="w-full max-w-md"
        initial={cardInitial}
        animate={cardAnimate}
        transition={cardTransition}
      >
        <Card
          className={cn(
            'border border-border/80 shadow-2xl ring-1 ring-border/40 backdrop-blur-sm',
            reduceTransparency ? 'bg-background' : 'material-thick'
          )}
        >
          <CardHeader className="space-y-1">
            <CardTitle className="text-center">
              KLSI 4.0
            </CardTitle>
            <CardDescription className="text-center">
              Learning Style Inventory
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Form */}
            <form onSubmit={handleFormSubmit} noValidate className="space-y-6">
              {formError && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              {/* Demo Mode Info */}
              {isDemoMode && showDemoInfo && (
                <Alert variant="info" showIcon={false}>
                  <Info className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription className="space-y-3">
                    <p className="font-medium">Mode Demo - Backend tidak tersedia</p>
                    <p className="text-sm">Klik tombol di bawah untuk login langsung:</p>
                    <div className="space-y-2">
                      {demoCredentials.map((cred) => (
                        <Button
                          key={cred.email}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            'w-full justify-between h-auto py-3 text-left shadow-sm focus-visible:ring-2 focus-visible:ring-ring',
                            reduceTransparency ? 'bg-background' : 'bg-card hover:bg-muted'
                          )}
                          onClick={() => quickLogin(cred.email, cred.password)}
                          disabled={loginMutation.isPending}
                        >
                          <div className="text-left space-y-1">
                            <div className="font-medium">{cred.role}</div>
                            <div className="text-xs text-muted-foreground">
                              {cred.email} • {cred.password}
                            </div>
                          </div>
                          <LogIn className="h-4 w-4 ml-2 flex-shrink-0" />
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                      💡 Tip: Klik tombol di atas untuk login otomatis, atau salin credentials ke form manual
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Email Field - Task 11: shadcn Input & Label */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={isDemoMode ? "demo@klsi.com" : "nama@email.com"}
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={isDemoMode ? "demo123" : "•••••••"}
                    {...register('password')}
                    className={errors.password ? 'border-destructive pr-12' : 'pr-12'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-destructive">{errors.password.message}</p>
                )}
                {isDemoMode && !errors.password && (
                  <p className="text-xs text-muted-foreground">
                    💡 Demo password: <span className="font-mono">demo123</span>
                  </p>
                )}
              </div>

              {/* Submit Button - Task 11: shadcn Button */}
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full"
                size="lg"
              >
                {loginMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Masuk
                  </>
                )}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="text-center space-y-2 pt-4 border-t border-border">
              <p className="text-muted-foreground">
                Belum punya akun?{' '}
                <Link
                  to="/auth/register"
                  className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
                >
                  Daftar
                </Link>
              </p>
              {/* Show "Continue as Guest" option if user came from a page via returnTo */}
              {location.search.includes('returnTo') && (
                <p className="text-muted-foreground">
                  <Link
                    to="/"
                    className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
                  >
                    Continue as Guest
                  </Link>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <NonDiagnosticNotice variant="compact" className="mt-4 text-left" />

        {/* Additional Info */}
        <motion.div
          className="mt-4 text-center"
          initial={infoInitial}
          animate={infoAnimate}
          transition={infoTransition}
        >
          <p className="text-muted-foreground">
            Instrumen formatif untuk refleksi belajar; bukan alat seleksi atau diagnosis.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};