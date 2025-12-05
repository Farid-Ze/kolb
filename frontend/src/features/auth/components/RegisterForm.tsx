import { useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '../../../shared/ui/Button'
import { FloatingInput } from '../../../shared/ui/Input'
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
      <FloatingInput 
        label="Full Name"
        id="fullName" 
        onChange={(event) => handleChange('fullName', event.target.value)} 
        required 
        value={form.fullName}
      />
      <FloatingInput 
        label="Email Address"
        id="email" 
        onChange={(event) => handleChange('email', event.target.value)} 
        required 
        type="email" 
        value={form.email}
      />
      <FloatingInput
        label="Password"
        id="password"
        onChange={(event) => handleChange('password', event.target.value)}
        required
        type="password"
        value={form.password}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <FloatingInput 
          label="NIM"
          id="nim" 
          maxLength={8} 
          onChange={(event) => handleChange('nim', event.target.value)} 
          value={form.nim ?? ''} 
        />
        <FloatingInput 
          label="Class (IF-XX)"
          id="kelas" 
          onChange={(event) => handleChange('kelas', event.target.value)} 
          value={form.kelas ?? ''} 
        />
        <FloatingInput
          label="Year"
          id="tahunMasuk"
          type="number"
          onChange={(event) => handleChange('tahunMasuk', Number(event.target.value))}
          value={form.tahunMasuk ?? ''}
        />
      </div>
      <Button className="w-full mt-6" isLoading={isSubmitting} type="submit">
        Create Account
      </Button>
    </form>
  )
}
