import { useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import type { RegisterRequest } from '../model'

interface RegisterFormProps {
  onSubmit?: (payload: RegisterRequest) => Promise<void> | void
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [form, setForm] = useState<RegisterRequest>({
    fullName: '',
    email: '',
    password: '',
    nim: '',
    kelas: '',
    tahunMasuk: new Date().getFullYear(),
  })
  const [isSubmitting, setSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleChange = (key: keyof RegisterRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (validationError) setValidationError(null)
  }

  const validate = () => {
    if (form.nim && !/^[0-9]{8}$/.test(form.nim)) {
      return 'NIM must be exactly 8 digits.'
    }
    if (form.kelas && !/^IF-\d{2}$/.test(form.kelas)) {
      return 'Class must be in format IF-XX (e.g., IF-01).'
    }
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onSubmit) return

    const error = validate()
    if (error) {
      setValidationError(error)
      return
    }

    try {
      setSubmitting(true)
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {validationError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {validationError}
        </div>
      )}
      <div className="space-y-2">
        <label className="block font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]" htmlFor="fullName">
          Full Name
        </label>
        <Input 
          id="fullName" 
          onChange={(event) => handleChange('fullName', event.target.value)} 
          required 
          value={form.fullName}
          placeholder="John Doe"
        />
      </div>
      <div className="space-y-2">
        <label className="block font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]" htmlFor="email">
          Email Address
        </label>
        <Input 
          id="email" 
          onChange={(event) => handleChange('email', event.target.value)} 
          required 
          type="email" 
          value={form.email}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label className="block font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          onChange={(event) => handleChange('password', event.target.value)}
          required
          type="password"
          value={form.password}
          placeholder="••••••••"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="block font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]" htmlFor="nim">
            NIM
          </label>
          <Input 
            id="nim" 
            maxLength={8} 
            onChange={(event) => handleChange('nim', event.target.value)} 
            value={form.nim ?? ''} 
            placeholder="12345678"
          />
        </div>
        <div className="space-y-2">
          <label className="block font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]" htmlFor="kelas">
            Class
          </label>
          <Input 
            id="kelas" 
            onChange={(event) => handleChange('kelas', event.target.value)} 
            placeholder="IF-XX" 
            value={form.kelas ?? ''} 
          />
        </div>
        <div className="space-y-2">
          <label className="block font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]" htmlFor="tahunMasuk">
            Year
          </label>
          <Input
            id="tahunMasuk"
            min={1990}
            max={2100}
            onChange={(event) => handleChange('tahunMasuk', Number(event.target.value))}
            type="number"
            value={form.tahunMasuk ?? ''}
          />
        </div>
      </div>
      <Button className="w-full mt-6" isLoading={isSubmitting} type="submit">
        Create Account
      </Button>
    </form>
  )
}
