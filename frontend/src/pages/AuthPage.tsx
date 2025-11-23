import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { LoginForm, RegisterForm, useAuth } from '../features/auth'
import type { LoginRequest, RegisterRequest } from '../features/auth'
import { register as registerApi } from '../features/auth/api'

const tabs = [
  { key: 'login', label: 'Login' },
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
    <section className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-wide text-slate-500">Auth</p>
        <h1 className="text-2xl font-semibold">Access Zenotika</h1>
        <p className="text-slate-600">Sign in with your existing account or register with campus credentials.</p>
      </div>
      <div className="flex rounded-md border border-slate-200 bg-white p-1 text-sm font-medium text-slate-500">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`flex-1 rounded-md px-3 py-2 transition ${
              activeTab === tab.key ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
            }`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {activeTab === 'login' ? (
          <LoginForm onSubmit={handleLogin} />
        ) : (
          <RegisterForm onSubmit={handleRegister} />
        )}
      </div>
      {isLoading && <p className="text-center text-xs text-slate-400">Syncing profile…</p>}
    </section>
  )
}
