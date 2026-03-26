import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import TransactionItem from '@finance/components/TransactionItem'

const baseProps = {
  description: 'Supermercado',
  amount: 150,
  category: 'comida',
  date: '2025-06-15',
  isIncome: false,
}

describe('TransactionItem', () => {
  it('renders description and category', () => {
    render(<TransactionItem {...baseProps} />)
    expect(screen.getByText('Supermercado')).toBeInTheDocument()
    expect(screen.getByText(/comida/i)).toBeInTheDocument()
  })

  it('renders expense with minus sign', () => {
    render(<TransactionItem {...baseProps} isIncome={false} />)
    expect(screen.getByText(/-150/)).toBeInTheDocument()
  })

  it('renders income with plus sign', () => {
    render(<TransactionItem {...baseProps} isIncome={true} amount={3000} />)
    expect(screen.getByText(/^\+3/)).toBeInTheDocument()
  })

  it('hides amount when hideAmount is true', () => {
    render(<TransactionItem {...baseProps} hideAmount={true} />)
    expect(screen.getByText('****** €')).toBeInTheDocument()
    expect(screen.queryByText(/-150/)).not.toBeInTheDocument()
  })

  it('does not render delete button when onDelete is not provided', () => {
    render(<TransactionItem {...baseProps} />)
    expect(screen.queryByLabelText(/eliminar supermercado/i)).not.toBeInTheDocument()
  })

  it('shows confirm buttons after first delete click', async () => {
    const user = userEvent.setup()
    render(<TransactionItem {...baseProps} onDelete={vi.fn()} />)

    await user.click(screen.getByLabelText(/eliminar supermercado/i))

    expect(screen.getByLabelText(/confirmar eliminación/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Cancelar eliminación')).toBeInTheDocument()
  })

  it('calls onDelete after confirming', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<TransactionItem {...baseProps} onDelete={onDelete} />)

    await user.click(screen.getByLabelText(/eliminar supermercado/i))
    await user.click(screen.getByLabelText(/confirmar eliminación/i))

    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('cancels delete confirmation on cancel click', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<TransactionItem {...baseProps} onDelete={onDelete} />)

    await user.click(screen.getByLabelText(/eliminar supermercado/i))
    await user.click(screen.getByLabelText('Cancelar eliminación'))

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByLabelText(/confirmar eliminación/i)).not.toBeInTheDocument()
  })
})
