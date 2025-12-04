import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { LoginForm, RegisterForm, useAuth } from '../features/auth'
import type { LoginRequest, RegisterRequest } from '../features/auth'
import { register as registerApi } from '../features/auth/api'
import { SpeedTunnel } from '../shared/ui/SpeedTunnel'

const tabs = [
  { key: 'login', label: 'Sign In' },
  { key: 'register', label: 'Register' },
] as const

type TabKey = (typeof tabs)[number]['key']

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
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center selection:bg-blue-500 selection:text-white">
      {/* Background */}
      <SpeedTunnel />
      
      {/* Back to Home */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 group"
      >
        <h1 className="font-headline text-xl font-bold tracking-tighter text-white group-hover:text-[var(--zen-accent)] transition-colors">
          ZENOTIKA<span className="text-[var(--zen-accent)]">™</span>
        </h1>
        <p className="font-ui text-[9px] uppercase tracking-[0.2em] text-gray-400">
          Innovation Partner
        </p>
      </Link>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative bg-[var(--zen-bg-card)]/90 backdrop-blur-xl border border-[var(--zen-border)] rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-headline text-3xl font-bold text-white uppercase tracking-tight mb-2">
              Access Portal
            </h2>
            <p className="font-ui text-sm text-[var(--zen-text-muted)]">
              Enter your credentials to continue
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-full border border-[var(--zen-border)] bg-[var(--zen-bg)]/50 p-1 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`flex-1 rounded-full px-4 py-2.5 font-ui text-xs uppercase tracking-wider transition-all ${
                  activeTab === tab.key 
                    ? 'bg-[var(--zen-accent)] text-white shadow-lg shadow-blue-500/25' 
                    : 'text-[var(--zen-text-muted)] hover:text-white'
                }`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              {success}
            </div>
          )}

          {/* Forms */}
          {activeTab === 'login' ? (
            <LoginForm onSubmit={handleLogin} />
          ) : (
            <RegisterForm onSubmit={handleRegister} />
          )}

          {/* Loading indicator */}
          {isLoading && (
            <p className="mt-4 text-center font-ui text-xs text-[var(--zen-text-muted)] uppercase tracking-wider">
              Authenticating...
            </p>
          )}
        </div>

        {/* Footer text */}
        <p className="mt-6 text-center font-ui text-xs text-[var(--zen-text-muted)]">
          By continuing, you agree to Zenotika's Terms of Service
        </p>
      </div>
    </div>
  )
}
