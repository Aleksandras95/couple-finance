'use client'

import { formatEUR } from '@/lib/format'

interface Member {
  user_id: string
  user_name: string | null
  user_avatar_color: string | null
  type: string
  total: string | null
}

interface PartnerCardProps {
  userBreakdown: Member[]
}

interface PartnerSummary {
  id: string
  name: string
  color: string
  income: number
  expenses: number
}

export function PartnerCard({ userBreakdown }: PartnerCardProps) {
  const partnerMap: Record<string, PartnerSummary> = {}

  for (const row of userBreakdown) {
    if (!row.user_id) continue
    if (!partnerMap[row.user_id]) {
      partnerMap[row.user_id] = {
        id: row.user_id,
        name: row.user_name || 'Unknown',
        color: row.user_avatar_color || '#F43F5E',
        income: 0,
        expenses: 0,
      }
    }
    const total = parseInt(String(row.total || 0))
    if (row.type === 'income') partnerMap[row.user_id].income += total
    else partnerMap[row.user_id].expenses += total
  }

  const partners = Object.values(partnerMap)

  if (partners.length === 0) {
    return null
  }

  return (
    <div className="bg-surface rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
      <p className="text-sm font-bold text-text mb-3">Partner Overview</p>
      <div className="space-y-3">
        {partners.map((p) => {
          const net = p.income - p.expenses
          return (
            <div key={p.id} className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: p.color }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text truncate">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-income font-medium">+{formatEUR(p.income)}</span>
                  <span className="text-xs text-muted">·</span>
                  <span className="text-xs text-expense font-medium">-{formatEUR(p.expenses)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${net >= 0 ? 'text-income' : 'text-expense'}`}>
                  {net >= 0 ? '+' : ''}{formatEUR(Math.abs(net))}
                </p>
                <p className="text-xs text-muted">net</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
