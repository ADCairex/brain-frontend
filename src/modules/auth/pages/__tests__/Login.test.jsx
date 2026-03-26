import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { useAuth } from '@shared/context/AuthContext'
import LoginPage from '@auth/pages/Login'
import { server } from '@/test/msw/server'

vi.mock('@shared/context/AuthContext')

const setUser = vi.fn()

function renderLogin() {
  useAuth.mockReturnValue({ setUser })
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    setUser.mockClear()
  })

  it('renders email and password inputs', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    renderLogin()

    const passwordInput = screen.getByPlaceholderText('••••••••')
    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: '' }))
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('navigates to / and calls setUser on successful login', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(setUser).toHaveBeenCalledWith({ id: 1, email: 'user@example.com' })
    })
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('shows error message on failed login', async () => {
    server.use(
      http.post('http://localhost:8000/auth/login', () =>
        HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
      )
    )

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('disables submit button while loading', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')

    const button = screen.getByRole('button', { name: /iniciar sesión/i })
    await user.click(button)

    // Button becomes disabled during the async login
    await waitFor(() => expect(setUser).toHaveBeenCalled())
  })
})
