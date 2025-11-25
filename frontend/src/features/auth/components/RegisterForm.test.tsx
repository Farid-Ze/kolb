import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RegisterForm } from './RegisterForm'

describe('RegisterForm', () => {
  it('renders all registration fields', () => {
    render(<RegisterForm />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nim/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/class/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/enrollment year/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('validates NIM format', async () => {
    render(<RegisterForm onSubmit={vi.fn()} />)
    
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } })

    const nimInput = screen.getByLabelText(/nim/i)
    fireEvent.change(nimInput, { target: { value: '123' } })
    expect(nimInput).toHaveValue('123')

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/nim must be exactly 8 digits/i)).toBeInTheDocument()
  })

  it('validates Class format', async () => {
    render(<RegisterForm onSubmit={vi.fn()} />)
    
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } })
    fireEvent.change(screen.getByLabelText(/nim/i), { target: { value: '12345678' } })
    
    fireEvent.change(screen.getByLabelText(/class/i), { target: { value: 'INVALID' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/class must be in format if-xx/i)).toBeInTheDocument()
  })

  it('calls onSubmit with valid data', async () => {
    const handleSubmit = vi.fn()
    render(<RegisterForm onSubmit={handleSubmit} />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/nim/i), { target: { value: '10112233' } })
    fireEvent.change(screen.getByLabelText(/class/i), { target: { value: 'IF-01' } })
    fireEvent.change(screen.getByLabelText(/enrollment year/i), { target: { value: '2023' } })
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        nim: '10112233',
        kelas: 'IF-01',
        tahunMasuk: 2023,
      })
    })
  })
})
