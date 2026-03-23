'use client'

import { useState, useEffect, useCallback } from 'react'
import { TransactionCard, type Transaction } from '@/components/transactions/TransactionCard'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { TransactionForm, type TransactionPayload } from '@/components/transactions/TransactionForm'
import { formatEUR, currentMonth, formatMonth, centsToDecimal } from '@/lib/format'

interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: string
}

type FilterType = 'all' | 'income' | 'expense'

export default function TransactionsPage() {
  const [month, setMonth] = useState(currentMonth())
  const [filter, setFilter] = useState<FilterType>('all')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ month })
      if (filter !== 'all') params.set('type', filter)
      params.set('limit', '100')

      const [txRes, catRes] = await Promise.all([
        fetch(`/api/transactions?${params}`),
        fetch('/api/categories'),
      ])
      if (txRes.ok) {
        const d = await txRes.json()
        setTransactions(d.transactions || [])
      }
      if (catRes.ok) {
        const d = await catRes.json()
        setCategories(d.categories || [])
      }
    } finally {
      setLoading(false)
    }
  }, [month, filter])

  useEffect(() => { fetchData() }, [fetchData])

  function changeMonth(dir: 'prev' | 'next') {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, dir === 'prev' ? m - 2 : m, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  async function handleSave(payload: TransactionPayload) {
    const url = editing ? `/api/transactions/${editing.id}` : '/api/transactions'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to save')
    }
    setShowAdd(false)
    setEditing(null)
    fetchData()
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    await fetch(`/api/transactions/${deleting}`, { method: 'DELETE' })
    setDeleteLoading(false)
    setDeleting(null)
    fetchData()
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="px-4 pt-6 space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted font-medium uppercase tracking-wider">Transactions</p>
          <div className="flex items-center gap-2 mt-0.5">
            <button onClick={() => changeMonth('prev')} className="text-muted press-effect">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6" /></svg>
            </button>
            <h1 className="text-xl font-bold text-text">{formatMonth(month)}</h1>
            <button onClick={() => changeMonth('next')} className="text-muted press-effect">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6" /></svg>
            </button>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowAdd(true) }}
          className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-md press-effect"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Summary */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-xs text-muted font-medium">Income</p>
            <p className="text-base font-bold text-income mt-1">+{formatEUR(totalIncome)}</p>
          </div>
          <div className="bg-surface rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
            <p className="text-xs text-muted font-medium">Expenses</p>
            <p className="text-base font-bold text-expense mt-1">-{formatEUR(totalExpenses)}</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex bg-surface rounded-2xl p-1" style={{ boxShadow: 'var(--shadow-card)' }}>
        {(['all', 'income', 'expense'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 ${
              filter === f ? 'bg-primary text-white shadow-sm' : 'text-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Transactions list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm font-semibold text-text">No transactions</p>
          <p className="text-xs text-muted mt-1">Nothing recorded for this period</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              tx={tx}
              onTap={() => {
                setEditing(tx)
                setShowAdd(true)
              }}
              onDelete={() => setDeleting(tx.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setEditing(null) }}
        title={editing ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionForm
          categories={categories}
          onSave={handleSave}
          onCancel={() => { setShowAdd(false); setEditing(null) }}
          initial={editing ? {
            id: editing.id,
            amount: centsToDecimal(editing.amount),
            type: editing.type as 'income' | 'expense',
            category_id: editing.category_id || '',
            date: editing.date,
            description: editing.description || '',
            is_recurring: editing.is_recurring || false,
          } : undefined}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete transaction?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </div>
  )
}
