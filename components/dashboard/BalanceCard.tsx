'use client'

import { formatEUR, formatMonth } from '@/lib/format'

interface BalanceCardProps {
  balance: number
  income: number
  expenses: number
  month: string
  onMonthChange?: (dir: 'prev' | 'next') => void
}

export function BalanceCard({ balance, income, expenses, month, onMonthChange }: BalanceCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6"
      style={{
        background: 'linear-gradient(135deg, #F43F5E 0%, #8B5CF6 100%)',
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/8" />

      <div className="relative">
        {/* Month selector */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/70 text-sm font-medium">Total Balance</p>
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
            {onMonthChange && (
              <button onClick={() => onMonthChange('prev')} className="text-white/70 hover:text-white transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </button>
            )}
            <span className="text-white text-xs font-semibold">{formatMonth(month)}</span>
            {onMonthChange && (
              <button onClick={() => onMonthChange('next')} className="text-white/70 hover:text-white transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Balance */}
        <p className="text-4xl font-bold text-white mb-5 tracking-tight">
          {formatEUR(balance)}
        </p>

        {/* Income / Expense row */}
        <div className="flex gap-4">
          <div className="flex-1 bg-white/15 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="18,15 12,9 6,15" />
                </svg>
              </div>
              <span className="text-white/70 text-xs font-medium">Income</span>
            </div>
            <p className="text-white font-bold text-base">{formatEUR(income)}</p>
          </div>

          <div className="flex-1 bg-white/15 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </div>
              <span className="text-white/70 text-xs font-medium">Expenses</span>
            </div>
            <p className="text-white font-bold text-base">{formatEUR(expenses)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
