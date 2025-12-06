import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

import { LoginForm, RegisterForm, useAuth } from '../features/auth'
import type { LoginRequest, RegisterRequest } from '../features/auth'
import { register as registerApi } from '../features/auth/api'

const tabs = [
  { key: 'login', label: 'Sign In' },
  { key: 'register', label: 'Register' },
] as const

type TabKey = (typeof tabs)[number]['key']

/**
 * AWWWARDS-LEVEL AUTH PAGE
 * 
 * Design Principles:
 * - Centered card with glass morphism
 * - Subtle glow for depth
 * - Premium micro-interactions on tabs
 * - Clear visual hierarchy
 * - Accessible form structure
 */

export function AuthPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('login')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()

  const handleLogin = async (payload: LoginRequest) => {
    setError(null)
    setSuccess(null)
    try {
      await login(payload)
      navigate('/future/dashboard')
    } catch (err) {
      console.error(err)
      setError('Unable to sign in. Please verify your credentials.')
    }
  }

  const handleRegister = async (payload: RegisterRequest) => {
    setError(null)
    setSuccess(null)
    try {
      await registerApi(payload)
      await login({ email: payload.email, password: payload.password })
      setSuccess('Account created successfully!')
      navigate('/future/dashboard')
    } catch (err) {
      console.error(err)
      setError('Registration failed. Please review the requirements and try again.')
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-[8.33%]">
      {/* Auth Card - Glass Morphism */}
      <div 
        className="relative z-10 w-full max-w-md animate-hero-fade-up opacity-0"
        style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
      >
        {/* Ambient glow */}
        <div 
          className="absolute -inset-8 bg-indigo-500/8 blur-[60px] rounded-full pointer-events-none" 
          aria-hidden="true"
        />
        
        <div className="relative bg-[#0c0c14]/95 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-8 sm:p-10 shadow-2xl shadow-black/50">
          {/* Header */}
          <header className="text-center mb-8">
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-white uppercase tracking-[-0.02em] mb-2">
              Access Portal
            </h2>
            <p className="font-ui text-sm text-gray-500">
              Enter your credentials to continue
            </p>
          </header>

          {/* Tab Switcher - Premium pill design with animated indicator */}
          <div 
            className="flex rounded-full border border-white/[0.08] bg-black/30 p-1 mb-8"
            role="tablist"
            aria-label="Authentication type"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`${tab.key}-panel`}
                id={`${tab.key}-tab`}
                className={`relative flex-1 rounded-full px-4 py-2.5 font-ui text-[11px] uppercase tracking-[0.1em] font-semibold gpu-transition ${
                  activeTab === tab.key 
                    ? 'text-white' 
                    : 'text-gray-500 hover:text-white'
                }`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                {/* Animated sliding indicator */}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="auth-tab-indicator"
                    className="absolute inset-0 rounded-full bg-indigo-600 shadow-lg shadow-indigo-500/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Error/Success Messages - Accessible */}
          {error && (
            <div 
              role="alert"
              className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 animate-hero-fade-up"
              style={{ animationDuration: '0.3s' }}
            >
              {error}
            </div>
          )}
          {success && (
            <div 
              role="status"
              className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-400 animate-hero-fade-up"
              style={{ animationDuration: '0.3s' }}
            >
              {success}
            </div>
          )}

          {/* Form Panels with smooth crossfade */}
          <AnimatePresence mode="wait">
            {activeTab === 'login' && (
              <motion.div
                key="login"
                id="login-panel"
                role="tabpanel"
                aria-labelledby="login-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
              >
                <LoginForm onSubmit={handleLogin} />
              </motion.div>
            )}
            
            {activeTab === 'register' && (
              <motion.div
                key="register"
                id="register-panel"
                role="tabpanel"
                aria-labelledby="register-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
              >
                <RegisterForm onSubmit={handleRegister} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {isLoading && (
            <div className="mt-6 flex items-center justify-center gap-2" aria-live="polite">
              <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              <span className="font-ui text-xs text-gray-500 uppercase tracking-wider">
                Authenticating...
              </span>
            </div>
          )}
        </div>

        {/* Footer - Terms */}
        <p className="mt-8 text-center font-ui text-[11px] text-gray-600 leading-relaxed">
          By continuing, you agree to Zenotika's{' '}
          <a href="/terms" className="text-gray-400 hover:text-white gpu-transition underline underline-offset-2">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  )
}
