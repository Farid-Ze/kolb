import { useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '../../../shared/ui/Button'
import { FloatingInput } from '../../../shared/ui/Input'
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
      <FloatingInput 
        label="Email Address"
        autoComplete="email" 
        id="email" 
        onChange={(event) => setEmail(event.target.value)} 
        required 
        type="email" 
        value={email}
      />
      <FloatingInput
        label="Password"
        autoComplete="current-password"
        id="password"
        onChange={(event) => setPassword(event.target.value)}
        required
        type="password"
        value={password}
      />
      <Button className="w-full mt-6" isLoading={isSubmitting} type="submit">
        Sign In
      </Button>
    </form>
  )
}
