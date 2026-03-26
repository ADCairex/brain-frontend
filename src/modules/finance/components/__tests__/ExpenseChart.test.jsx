import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExpenseChart from '@finance/components/ExpenseChart'

describe('ExpenseChart', () => {
  it('renders the section heading', () => {
    render(<ExpenseChart />)
    expect(screen.getByText('Gastos por Categoría')).toBeInTheDocument()
  })

  it('renders without crashing when data is empty', () => {
    render(<ExpenseChart data={[]} />)
    expect(screen.getByText('Gastos por Categoría')).toBeInTheDocument()
  })

  it('renders without crashing when data is provided', () => {
    const data = [
      { category: 'comida', total: 300 },
      { category: 'transporte', total: 150 },
    ]
    render(<ExpenseChart data={data} />)
    expect(screen.getByText('Gastos por Categoría')).toBeInTheDocument()
  })
})
