'use client'

import { formatEUR } from '@/lib/format'

interface BudgetProgressProps {
  name: string
  icon: string
  color: string
  budget: number
  spent: number
  onEdit?: () => void
  onDelete?: () => void
}

export function BudgetProgress({ name, icon, color, budget, spent, onEdit, onDelete }: BudgetProgressProps) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const overBudget = spent > budget
  const nearLimit = percentage >= 80 && !overBudget

  const barColor = overBudget
    ? '#EF4444'
    : nearLimit
    ? '#F59E0B'
    : color

  return (
    <div
      className="bg-surface rounded-2xl p-4"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
            style={{ backgroundColor: `${color}15` }}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-text">{name}</p>
            <p className="text-xs text-muted mt-0.5">
              {formatEUR(spent)} <span className="text-border">/ {formatEUR(budget)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold ${
              overBudget ? 'text-danger' : nearLimit ? 'text-warning' : 'text-muted'
            }`}
          >
            {Math.round(percentage)}%
          </span>
          {onEdit && (
            <button onClick={onEdit} className="w-7 h-7 rounded-full bg-bg flex items-center justify-center text-muted hover:text-text transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="w-7 h-7 rounded-full bg-bg flex items-center justify-center text-muted hover:text-danger transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-bg rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      {overBudget && (
        <p className="text-xs text-danger font-medium mt-2">
          Over by {formatEUR(spent - budget)}
        </p>
      )}
    </div>
  )
}
