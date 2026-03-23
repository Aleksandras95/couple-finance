'use client'

import { useState, useEffect, useCallback } from 'react'
import { BudgetProgress } from '@/components/budget/BudgetProgress'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { currentMonth, formatMonth, centsToDecimal, formatEUR } from '@/lib/format'

interface Budget {
  id: string
  amount: number
  spent: number
  month: string
  category_id: string
  category_name: string | null
  category_icon: string | null
  category_color: string | null
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: string
}

export default function BudgetPage() {
  const [month, setMonth] = useState(currentMonth())
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editBudget, setEditBudget] = useState<Budget | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Form state
  const [formCategory, setFormCategory] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [budgetRes, catRes] = await Promise.all([
        fetch(`/api/budgets?month=${month}`),
        fetch('/api/categories'),
      ])
      if (budgetRes.ok) {
        const d = await budgetRes.json()
        setBudgets(d.budgets || [])
      }
      if (catRes.ok) {
        const d = await catRes.json()
        setCategories(d.categories?.filter((c: Category) => c.type === 'expense' || c.type === 'both') || [])
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

  function openAdd() {
    setEditBudget(null)
    setFormCategory('')
    setFormAmount('')
    setFormError('')
    setShowAdd(true)
  }

  function openEdit(b: Budget) {
    setEditBudget(b)
    setFormCategory(b.category_id)
    setFormAmount(centsToDecimal(b.amount))
    setFormError('')
    setShowAdd(true)
  }

  async function handleSave() {
    setFormError('')
    if (!formCategory) { setFormError('Select a category'); return }
    if (!formAmount || parseFloat(formAmount) <= 0) { setFormError('Enter a valid amount'); return }

    setFormLoading(true)
    try {
      const res = await fetch(editBudget ? `/api/budgets/${editBudget.id}` : '/api/budgets', {
        method: editBudget ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: formCategory, amount: formAmount, month }),
      })
      if (!res.ok) {
        const err = await res.json()
        setFormError(err.error || 'Failed to save')
        return
      }
      setShowAdd(false)
      fetchData()
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete() {
    if (!deletingId) return
    setDeleteLoading(true)
    await fetch(`/api/budgets/${deletingId}`, { method: 'DELETE' })
    setDeleteLoading(false)
    setDeletingId(null)
    fetchData()
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)

  const usedCategoryIds = new Set(budgets.map((b) => b.category_id))
  const availableCategories = editBudget
    ? categories
    : categories.filter((c) => !usedCategoryIds.has(c.id))

  return (
    <div className="px-4 pt-6 space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted font-medium uppercase tracking-wider">Budgets</p>
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
          onClick={openAdd}
          className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-md press-effect"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Total overview */}
      {!loading && budgets.length > 0 && (
        <div
          className="bg-surface rounded-2xl p-4"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-text">Total Budget</p>
            <span className="text-xs font-semibold text-muted">
              {formatEUR(totalSpent)} / {formatEUR(totalBudget)}
            </span>
          </div>
          <div className="h-2.5 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%`,
                background: 'linear-gradient(90deg, #F43F5E, #8B5CF6)',
              }}
            />
          </div>
        </div>
      )}

      {/* Budget list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm font-semibold text-text">No budgets set</p>
          <p className="text-xs text-muted mt-1 mb-4">Plan your spending by category</p>
          <Button onClick={openAdd} size="sm">Set a budget</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => (
            <BudgetProgress
              key={b.id}
              name={b.category_name || 'Category'}
              icon={b.category_icon || '📦'}
              color={b.category_color || '#6B7280'}
              budget={b.amount}
              spent={b.spent}
              onEdit={() => openEdit(b)}
              onDelete={() => setDeletingId(b.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Budget Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={editBudget ? 'Edit Budget' : 'Set Budget'}
      >
        <div className="px-6 pb-8 space-y-4">
          {!editBudget && (
            <Select
              label="Category"
              value={formCategory}
              onChange={setFormCategory}
              options={availableCategories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
              placeholder="Select category"
            />
          )}
          {editBudget && (
            <div className="flex items-center gap-3 p-4 bg-bg rounded-2xl">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: `${editBudget.category_color}15` }}
              >
                {editBudget.category_icon}
              </div>
              <p className="text-sm font-semibold text-text">{editBudget.category_name}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Monthly Limit</label>
            <div className="flex items-center gap-2 bg-bg border border-border rounded-2xl px-4 py-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <span className="text-muted font-medium text-sm">€</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="flex-1 bg-transparent text-text text-sm font-medium focus:outline-none placeholder:text-muted/50"
              />
            </div>
          </div>

          {formError && <p className="text-sm text-danger font-medium">{formError}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)} fullWidth>Cancel</Button>
            <Button onClick={handleSave} loading={formLoading} fullWidth>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Remove budget?"
        message="This will remove the spending limit for this category."
        confirmLabel="Remove"
        loading={deleteLoading}
      />
    </div>
  )
}
