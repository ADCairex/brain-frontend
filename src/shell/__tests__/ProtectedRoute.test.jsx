import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, it, expect } from 'vitest'
import { useAuth } from '@shared/context/AuthContext'
import ProtectedRoute from '@shell/ProtectedRoute'

vi.mock('@shared/context/AuthContext')

describe('ProtectedRoute', () => {
  it('renders nothing while auth is loading (user undefined)', () => {
    useAuth.mockReturnValue({ user: undefined })

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Contenido protegido</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('redirects to /login when user is not authenticated', () => {
    useAuth.mockReturnValue({ user: null })

    render(
      <MemoryRouter initialEntries={['/finance']}>
        <Routes>
          <Route path="/login" element={<div>Página de login</div>} />
          <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <div>Contenido protegido</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Página de login')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  it('renders children when user is authenticated', () => {
    useAuth.mockReturnValue({ user: { id: 1, email: 'user@example.com' } })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Contenido protegido</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })
})
