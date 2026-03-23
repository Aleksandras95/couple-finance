'use client'

import { useState, useEffect, useCallback } from 'react'
import { BalanceCard } from '@/components/dashboard/BalanceCard'
import { TransactionCard, type Transaction } from '@/components/transactions/TransactionCard'
import { PartnerCard } from '@/components/dashboard/PartnerCard'
import { Modal } from '@/components/ui/Modal'
import { TransactionForm, type TransactionPayload } from '@/components/transactions/TransactionForm'
import { currentMonth } from '@/lib/format'

interface DashboardData {
  totalIncome: number
  totalExpenses: number
  balance: number
  recent: Transaction[]
  userBreakdown: any[]
  categorySpending: any[]
  month: string
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: string
}

export default function HomePage() {
  const [month, setMonth] = useState(currentMonth())
  const [data, setData] = useState<DashboardData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, catRes] = await Promise.all([
        fetch(`/api/dashboard?month=${month}`),
        fetch('/api/categories'),
      ])
      if (dashRes.ok) setData(await dashRes.json())
      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData.categories || [])
      }
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  function changeMonth(dir: 'prev' | 'next') {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, dir === 'prev' ? m - 2 : m, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  async function handleAddTransaction(payload: TransactionPayload) {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to add transaction')
    }
    setShowAdd(false)
    fetchData()
  }

  return (
    <div className="px-4 pt-6 space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted font-medium uppercase tracking-wider">Overview</p>
          <h1 className="text-xl font-bold text-text">My Finances</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-md press-effect"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Balance Card */}
      {loading ? (
        <div className="h-48 skeleton rounded-3xl" />
      ) : (
        <BalanceCard
          balance={data?.balance ?? 0}
          income={data?.totalIncome ?? 0}
          expenses={data?.totalExpenses ?? 0}
          month={month}
          onMonthChange={changeMonth}
        />
      )}

      {/* Partner overview */}
      {!loading && data && data.userBreakdown.length > 0 && (
        <PartnerCard userBreakdown={data.userBreakdown} />
      )}

      {/* Top spending categories */}
      {!loading && data && data.categorySpending.length > 0 && (
        <div className="bg-surface rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-sm font-bold text-text mb-3">Top Spending</p>
          <div className="space-y-2.5">
            {data.categorySpending.map((cat: any) => {
              const max = data.categorySpending[0].total
              const pct = max > 0 ? (cat.total / max) * 100 : 0
              return (
                <div key={cat.category_id || 'other'} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: `${cat.category_color || '#6B7280'}15` }}
                  >
                    {cat.category_icon || '📦'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-text">{cat.category_name || 'Other'}</span>
                      <span className="text-xs font-bold text-expense">
                        -{(parseInt(String(cat.total)) / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                    <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: cat.category_color || '#6B7280' }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-text">Recent</p>
          <a href="/transactions" className="text-xs text-primary font-semibold">See all</a>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
          </div>
        ) : data?.recent.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-4xl mb-3">💸</p>
            <p className="text-sm font-semibold text-text">No transactions yet</p>
            <p className="text-xs text-muted mt-1">Tap + to add your first one</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.recent.map((tx) => (
              <TransactionCard key={tx.id} tx={tx} compact />
            ))}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Transaction">
        <TransactionForm
          categories={categories}
          onSave={handleAddTransaction}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>
    </div>
  )
}
