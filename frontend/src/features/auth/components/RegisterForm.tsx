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

  const handleChange = (key: keyof RegisterRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onSubmit) return
    try {
      setSubmitting(true)
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-600" htmlFor="fullName">
          Full Name
        </label>
        <Input id="fullName" onChange={(event) => handleChange('fullName', event.target.value)} required value={form.fullName} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-600" htmlFor="email">
          Email
        </label>
        <Input id="email" onChange={(event) => handleChange('email', event.target.value)} required type="email" value={form.email} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-600" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          onChange={(event) => handleChange('password', event.target.value)}
          required
          type="password"
          value={form.password}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-600" htmlFor="nim">
            NIM
          </label>
          <Input id="nim" maxLength={8} onChange={(event) => handleChange('nim', event.target.value)} value={form.nim ?? ''} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-600" htmlFor="kelas">
            Class (IF-XX)
          </label>
          <Input id="kelas" onChange={(event) => handleChange('kelas', event.target.value)} value={form.kelas ?? ''} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-600" htmlFor="tahunMasuk">
            Enrollment Year
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
      <Button className="w-full" isLoading={isSubmitting} type="submit">
        Create Account
      </Button>
    </form>
  )
}
