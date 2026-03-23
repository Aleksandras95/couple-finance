'use client'

import { formatEUR, formatDateShort } from '@/lib/format'

export interface Transaction {
  id: string
  amount: number
  type: string
  date: string
  description?: string | null
  is_recurring?: boolean
  category_id?: string | null
  category_name?: string | null
  category_icon?: string | null
  category_color?: string | null
  user_id?: string | null
  user_name?: string | null
  user_avatar_color?: string | null
  recurring_interval?: string | null
}

interface TransactionCardProps {
  tx: Transaction
  onTap?: () => void
  onDelete?: () => void
  compact?: boolean
}

export function TransactionCard({ tx, onTap, onDelete, compact = false }: TransactionCardProps) {
  const isIncome = tx.type === 'income'

  return (
    <div
      className="flex items-center gap-3 p-4 bg-surface rounded-2xl press-effect cursor-pointer"
      style={{ boxShadow: 'var(--shadow-card)' }}
      onClick={onTap}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-lg"
        style={{ backgroundColor: tx.category_color ? `${tx.category_color}15` : '#F1F5F9' }}
      >
        {tx.category_icon || (isIncome ? '💰' : '💸')}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-text truncate">
            {tx.category_name || (isIncome ? 'Income' : 'Expense')}
          </p>
          {tx.is_recurring && (
            <span className="text-[10px] bg-secondary/10 text-secondary rounded-full px-1.5 py-0.5 font-semibold flex-shrink-0">
              Recurring
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {tx.description && (
            <p className="text-xs text-muted truncate">{tx.description}</p>
          )}
          {!compact && tx.user_name && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <div
                className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: tx.user_avatar_color || '#F43F5E' }}
              />
              <span className="text-xs text-muted">{tx.user_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Amount + Date */}
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${isIncome ? 'text-income' : 'text-expense'}`}>
          {isIncome ? '+' : '-'}{formatEUR(tx.amount)}
        </p>
        <p className="text-xs text-muted mt-0.5">{formatDateShort(tx.date)}</p>
      </div>
    </div>
  )
}
