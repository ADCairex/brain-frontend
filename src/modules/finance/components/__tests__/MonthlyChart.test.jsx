import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MonthlyChart from '@finance/components/MonthlyChart'

describe('MonthlyChart', () => {
  it('renders the section heading', () => {
    render(<MonthlyChart />)
    expect(screen.getByText('Resumen Mensual')).toBeInTheDocument()
  })

  it('renders the legend labels', () => {
    render(<MonthlyChart />)
    expect(screen.getByText('Ingresos')).toBeInTheDocument()
    expect(screen.getByText('Gastos')).toBeInTheDocument()
  })

  it('renders without crashing when data is empty', () => {
    render(<MonthlyChart data={[]} />)
    expect(screen.getByText('Resumen Mensual')).toBeInTheDocument()
  })

  it('renders without crashing when data is provided', () => {
    const data = [
      { month: 1, income: 3000, expenses: 1200 },
      { month: 2, income: 3200, expenses: 1400 },
    ]
    render(<MonthlyChart data={data} />)
    expect(screen.getByText('Resumen Mensual')).toBeInTheDocument()
  })
})
