import { useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import type { LoginRequest } from '../model'

interface LoginFormProps {
  onSubmit?: (payload: LoginRequest) => Promise<void> | void
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onSubmit) return
    try {
      setSubmitting(true)
      await onSubmit({ email, password })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]" htmlFor="email">
          Email Address
        </label>
        <Input 
          autoComplete="email" 
          id="email" 
          onChange={(event) => setEmail(event.target.value)} 
          required 
          type="email" 
          value={email}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label className="block font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]" htmlFor="password">
          Password
        </label>
        <Input
          autoComplete="current-password"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
          placeholder="••••••••"
        />
      </div>
      <Button className="w-full mt-6" isLoading={isSubmitting} type="submit">
        Sign In
      </Button>
    </form>
  )
}
