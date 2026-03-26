import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Wallet } from 'lucide-react'
import StatCard from '@finance/components/StatCard'

describe('StatCard', () => {
  const baseProps = {
    title: 'Balance',
    amount: '1.234 €',
    icon: Wallet,
    trend: '+12%',
    trendUp: true,
  }

  it('renders title and amount', () => {
    render(<StatCard {...baseProps} />)
    expect(screen.getByText('Balance')).toBeInTheDocument()
    expect(screen.getByText('1.234 €')).toBeInTheDocument()
  })

  it('renders trend text', () => {
    render(<StatCard {...baseProps} />)
    expect(screen.getByText('+12%')).toBeInTheDocument()
    expect(screen.getByText('vs mes anterior')).toBeInTheDocument()
  })

  it('applies emerald color when trendUp is true', () => {
    render(<StatCard {...baseProps} trendUp={true} trend="+5%" />)
    expect(screen.getByText('+5%')).toHaveClass('text-emerald-500')
  })

  it('applies rose color when trendUp is false', () => {
    render(<StatCard {...baseProps} trendUp={false} trend="-3%" />)
    expect(screen.getByText('-3%')).toHaveClass('text-rose-500')
  })
})
