import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { registerUser } from '../services/authService';
import { API_BASE_URL } from '../config/api';
import { Eye, EyeOff, UserPlus, Info } from 'lucide-react';
import { GlassPanel } from '../components/ui/GlassPanel';
import { useNonBlockingNavigate } from '../hooks/useNonBlockingNavigate';

/**
 * KLSI 4.0 - RegisterPage
 * Tasks 16-18: RegisterPage dengan shadcn/ui, react-hook-form, zod, React Query
 */

// Task 14: Zod validation schema
const registerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Anda harus menyetujui untuk melanjutkan',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNonBlockingNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Task 14: react-hook-form + zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      consent: false,
    },
  });

  // Watch password untuk validasi confirmPassword
  const password = watch('password');

  // Check if we're in demo mode (no backend)
  const isDemoMode = API_BASE_URL === '/api' || API_BASE_URL.includes('localhost');

  // Spring configuration (Guidelines.md Section 2.3.1)
  const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  };

  // Task 18: useRegisterMutation dengan React Query
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      return await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
    },
    // Task 18: toast.success on success
    onSuccess: () => {
      toast.success('Registrasi berhasil! Silakan login.');
      navigate('/auth/login');
    },
    // Task 15: toast.error on error
    onError: (error: Error) => {
      toast.error(error.message || 'Registrasi gagal. Silakan coba lagi.');
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  const handleRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <GlassPanel as="section" material="content" density="spacious" className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-foreground">
              Daftar Akun
            </h1>
            <p className="text-muted-foreground">
              Buat akun untuk memulai asesmen
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            {/* Demo Mode Info */}
            {isDemoMode && (
              <motion.div 
                className="material-regular rounded-lg p-4 bg-primary/10 border border-primary/20"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springConfig}
              >
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-foreground">
                      Mode Demo - Registrasi akan tersimpan sementara
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Untuk testing, gunakan akun demo yang sudah tersedia di halaman login.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error akan ditampilkan via toast, tidak perlu error message statis */}

            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-foreground">
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className="w-full rounded-lg bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border touch-manipulation"
                placeholder="John Doe"
                {...register('name', {
                  required: 'Nama wajib diisi',
                  minLength: {
                    value: 3,
                    message: 'Nama minimal 3 karakter',
                  },
                })}
              />
              {errors.name && (
                <p className="text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full rounded-lg bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border touch-manipulation"
                placeholder="nama@email.com"
                {...register('email', {
                  required: 'Email wajib diisi',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Format email tidak valid',
                  },
                })}
              />
              {errors.email && (
                <p className="text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="w-full rounded-lg bg-input-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border touch-manipulation"
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password wajib diisi',
                    minLength: {
                      value: 6,
                      message: 'Password minimal 6 karakter',
                    },
                  })}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  whileHover={{ color: 'var(--color-foreground)' }}
                  whileTap={{ scale: 0.95 }}
                  transition={springConfig}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </motion.button>
              </div>
              {errors.password && (
                <p className="text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-foreground">
                Konfirmasi Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="w-full rounded-lg bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border touch-manipulation"
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Konfirmasi password wajib diisi',
                  validate: (value) =>
                    value === password || 'Password tidak cocok',
                })}
              />
              {errors.confirmPassword && (
                <p className="text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Consent Checkbox */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
                  {...register('consent', {
                    required: 'Anda harus menyetujui untuk melanjutkan',
                  })}
                />
                <span className="text-muted-foreground">
                  Saya memahami bahwa KLSI 4.0 digunakan untuk refleksi belajar dan
                  perancangan aktivitas. Data saya dapat diakses oleh fasilitator
                  yang ditunjuk dan tidak digunakan untuk penilaian atau seleksi.
                </span>
              </label>
              {errors.consent && (
                <p className="text-destructive">{errors.consent.message}</p>
              )}
            </div>

            {/* Submit Button - Zona Hijau (Section 1.3.2) */}
            <motion.button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full rounded-lg bg-primary text-primary-foreground px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring inline-flex items-center justify-center gap-2 touch-manipulation"
              whileHover={!registerMutation.isPending ? { scale: 1.02 } : {}}
              whileTap={!registerMutation.isPending ? { scale: 0.98 } : {}}
              transition={springConfig}
            >
              {registerMutation.isPending ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                  Memproses...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Daftar
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="text-center space-y-2 pt-4 border-t border-border">
            <p className="text-muted-foreground">
              Sudah punya akun?{' '}
              <Link
                to="/auth/login"
                className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                Masuk
              </Link>
            </p>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};
