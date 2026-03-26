import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import AddInvestmentModal from '@finance/components/AddInvestmentModal'
import { server } from '@/test/msw/server'

const onClose = vi.fn()
const onSaved = vi.fn()

function renderModal(props = {}) {
  render(
    <AddInvestmentModal
      open={true}
      onClose={onClose}
      onSaved={onSaved}
      accounts={[{ id: 1, name: 'Cuenta principal' }]}
      {...props}
    />
  )
}

describe('AddInvestmentModal', () => {
  it('renders default title', () => {
    renderModal()
    expect(screen.getByText('Nueva Inversión')).toBeInTheDocument()
  })

  it('renders prefill title when prefill is provided', () => {
    renderModal({ prefill: { asset_symbol: 'AAPL', asset_name: 'Apple Inc.' } })
    expect(screen.getByText('Nueva compra — Apple Inc.')).toBeInTheDocument()
  })

  it('pre-fills symbol and name when prefill is provided', () => {
    renderModal({ prefill: { asset_symbol: 'AAPL', asset_name: 'Apple Inc.' } })
    expect(screen.getByLabelText('Símbolo')).toHaveValue('AAPL')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Apple Inc.')
  })

  it('shows symbol validation error when symbol is empty', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByText('Registrar Inversión'))

    expect(await screen.findByText('Ingresa el símbolo (ej: AAPL)')).toBeInTheDocument()
  })

  it('shows all required field validation errors at once', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByText('Registrar Inversión'))

    expect(await screen.findByText('Ingresa el símbolo (ej: AAPL)')).toBeInTheDocument()
    expect(screen.getByText('Ingresa el nombre del activo')).toBeInTheDocument()
    expect(screen.getByText('Ingresa el importe pagado')).toBeInTheDocument()
    expect(screen.getByText('Ingresa la cantidad recibida')).toBeInTheDocument()
  })

  it('shows derived price calculation when totalPaid and quantity are filled', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.type(screen.getByLabelText('Total pagado (€)'), '600')
    await user.type(screen.getByLabelText('Cantidad recibida'), '4')

    expect(await screen.findByText('Precio unitario')).toBeInTheDocument()
    expect(screen.getByText('Invertido en acciones')).toBeInTheDocument()
  })

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByText('Cancelar'))

    expect(onClose).toHaveBeenCalled()
  })

  it('calls onSaved after successful save', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.type(screen.getByLabelText('Símbolo'), 'AAPL')
    await user.type(screen.getByLabelText('Nombre'), 'Apple Inc.')
    await user.type(screen.getByLabelText('Total pagado (€)'), '600')
    await user.type(screen.getByLabelText('Cantidad recibida'), '4')
    await user.click(screen.getByText('Registrar Inversión'))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
  })

  it('shows API error when save fails', async () => {
    server.use(
      http.post('http://localhost:8000/finance/api/investments', () =>
        HttpResponse.json({ detail: 'Error al guardar' }, { status: 500 })
      )
    )

    const user = userEvent.setup()
    renderModal()

    await user.type(screen.getByLabelText('Símbolo'), 'AAPL')
    await user.type(screen.getByLabelText('Nombre'), 'Apple Inc.')
    await user.type(screen.getByLabelText('Total pagado (€)'), '600')
    await user.type(screen.getByLabelText('Cantidad recibida'), '4')
    await user.click(screen.getByText('Registrar Inversión'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error al guardar')
    })
  })
})
