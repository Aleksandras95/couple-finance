'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { today } from '@/lib/format'

interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: string
}

interface TransactionFormProps {
  onSave: (data: TransactionPayload) => Promise<void>
  onCancel: () => void
  initial?: Partial<TransactionPayload & { id: string }>
  categories: Category[]
}

export interface TransactionPayload {
  amount: string
  type: 'income' | 'expense'
  category_id: string
  date: string
  description: string
  is_recurring: boolean
  recurring_interval: string
}

export function TransactionForm({ onSave, onCancel, initial, categories }: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>(initial?.type || 'expense')
  const [amount, setAmount] = useState(initial?.amount || '')
  const [categoryId, setCategoryId] = useState(initial?.category_id || '')
  const [date, setDate] = useState(initial?.date || today())
  const [description, setDescription] = useState(initial?.description || '')
  const [isRecurring, setIsRecurring] = useState(initial?.is_recurring || false)
  const [recurringInterval, setRecurringInterval] = useState(initial?.recurring_interval || 'monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === 'both'
  )

  const categoryOptions = filteredCategories.map((c) => ({
    value: c.id,
    label: `${c.icon} ${c.name}`,
  }))

  const selectedCategory = categories.find((c) => c.id === categoryId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const normalizedAmount = amount.replace(',', '.')
    if (!normalizedAmount || parseFloat(normalizedAmount) <= 0) {
      setError('Enter a valid amount')
      return
    }

    setLoading(true)
    try {
      await onSave({
        amount: normalizedAmount,
        type,
        category_id: categoryId,
        date,
        description,
        is_recurring: isRecurring,
        recurring_interval: recurringInterval,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
      {/* Type Toggle */}
      <div className="flex bg-bg rounded-2xl p-1">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); setCategoryId('') }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 capitalize ${
              type === t
                ? t === 'expense'
                  ? 'bg-expense text-white shadow-sm'
                  : 'bg-income text-white shadow-sm'
                : 'text-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="bg-bg rounded-2xl p-4 text-center">
        <p className="text-xs text-muted font-medium mb-2 uppercase tracking-wider">Amount</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl font-bold text-muted">€</span>
          <input
            type="text"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-4xl font-bold bg-transparent text-text text-center w-40 focus:outline-none placeholder:text-border"
          />
        </div>
      </div>

      {/* Category */}
      <Select
        label="Category"
        value={categoryId}
        onChange={setCategoryId}
        options={categoryOptions}
        placeholder="Select category"
      />

      {/* Date */}
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {/* Description */}
      <Input
        label="Note (optional)"
        type="text"
        placeholder="What was this for?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Recurring toggle */}
      <div className="flex items-center justify-between p-4 bg-bg rounded-2xl">
        <div>
          <p className="text-sm font-semibold text-text">Recurring</p>
          <p className="text-xs text-muted mt-0.5">Repeat every month</p>
        </div>
        <button
          type="button"
          onClick={() => setIsRecurring(!isRecurring)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isRecurring ? 'bg-primary' : 'bg-border'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isRecurring ? 'translate-x-6' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {isRecurring && (
        <Select
          label="Repeat every"
          value={recurringInterval}
          onChange={setRecurringInterval}
          options={[
            { value: 'weekly', label: 'Week' },
            { value: 'monthly', label: 'Month' },
            { value: 'yearly', label: 'Year' },
          ]}
        />
      )}

      {error && <p className="text-sm text-danger font-medium text-center">{error}</p>}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel} fullWidth>
          Cancel
        </Button>
        <Button type="submit" loading={loading} fullWidth>
          {initial?.id ? 'Save Changes' : 'Add'}
        </Button>
      </div>
    </form>
  )
}
