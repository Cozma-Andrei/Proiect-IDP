import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import LoginPage from '../pages/LoginPage'

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}))

describe('LoginPage', () => {
  it('renders login form elements', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Autentificare')).toBeDefined()
    expect(screen.getByLabelText('Email')).toBeDefined()
    expect(screen.getByText('Parola')).toBeDefined()
    expect(screen.getByRole('button', { name: /login/i })).toBeDefined()
  })

  it('shows forgot password link', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    const link = screen.getByText('Ai uitat parola?')
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('/forgot-password')
  })
})
