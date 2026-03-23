'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'

interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: string
  is_default: boolean
}

const EMOJI_OPTIONS = ['📦', '🏠', '🍕', '🚗', '⚡', '❤️', '🎬', '🛍️', '📱', '💼', '💻', '💰', '✈️', '🎮', '🐾', '🌱', '🎓', '💊', '🛒', '🍺']
const COLOR_OPTIONS = ['#F43F5E', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444', '#F97316', '#6B7280']

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Form
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('📦')
  const [formColor, setFormColor] = useState('#6B7280')
  const [formType, setFormType] = useState('expense')

  async function fetchCategories() {
    setLoading(true)
    const res = await fetch('/api/categories')
    if (res.ok) {
      const d = await res.json()
      setCategories(d.categories || [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  function openAdd() {
    setEditCat(null)
    setFormName(''); setFormIcon('📦'); setFormColor('#6B7280'); setFormType('expense')
    setFormError('')
    setShowAdd(true)
  }

  function openEdit(c: Category) {
    setEditCat(c)
    setFormName(c.name); setFormIcon(c.icon); setFormColor(c.color); setFormType(c.type)
    setFormError('')
    setShowAdd(true)
  }

  async function handleSave() {
    if (!formName.trim()) { setFormError('Name required'); return }
    setFormLoading(true)
    const url = editCat ? `/api/categories/${editCat.id}` : '/api/categories'
    const method = editCat ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formName, icon: formIcon, color: formColor, type: formType }),
    })
    if (!res.ok) {
      const err = await res.json()
      setFormError(err.error || 'Failed to save')
    } else {
      setShowAdd(false)
      fetchCategories()
    }
    setFormLoading(false)
  }

  async function handleDelete() {
    if (!deletingId) return
    setDeleteLoading(true)
    await fetch(`/api/categories/${deletingId}`, { method: 'DELETE' })
    setDeleteLoading(false)
    setDeletingId(null)
    fetchCategories()
  }

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both')

  return (
    <div className="px-4 pt-6 pb-8 space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center press-effect" style={{ boxShadow: 'var(--shadow-card)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <h1 className="text-xl font-bold text-text">Categories</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={openAdd}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-14 skeleton rounded-2xl"/>)}
        </div>
      ) : (
        <>
          {incomeCategories.length > 0 && (
            <div>
              <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-2 px-1">Income</p>
              <div className="space-y-2">
                {incomeCategories.map((c) => (
                  <CategoryRow key={c.id} category={c} onEdit={() => openEdit(c)} onDelete={c.is_default ? undefined : () => setDeletingId(c.id)} />
                ))}
              </div>
            </div>
          )}

          {expenseCategories.length > 0 && (
            <div>
              <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-2 px-1">Expenses</p>
              <div className="space-y-2">
                {expenseCategories.map((c) => (
                  <CategoryRow key={c.id} category={c} onEdit={() => openEdit(c)} onDelete={c.is_default ? undefined : () => setDeletingId(c.id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editCat ? 'Edit Category' : 'New Category'}>
        <div className="px-6 pb-8 space-y-4">
          <Input label="Name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Groceries" />

          <div>
            <label className="block text-sm font-medium text-text mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setFormIcon(emoji)}
                  className={`w-10 h-10 rounded-xl text-lg transition-all ${formIcon === emoji ? 'bg-primary/20 ring-2 ring-primary' : 'bg-bg'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  onClick={() => setFormColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${formColor === color ? 'ring-2 ring-offset-2 ring-text scale-110' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <Select
            label="Type"
            value={formType}
            onChange={setFormType}
            options={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
              { value: 'both', label: 'Both' },
            ]}
          />

          {formError && <p className="text-sm text-danger font-medium">{formError}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)} fullWidth>Cancel</Button>
            <Button onClick={handleSave} loading={formLoading} fullWidth>Save</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete category?"
        message="Transactions using this category will keep their data but lose the category reference."
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </div>
  )
}

function CategoryRow({ category, onEdit, onDelete }: { category: Category; onEdit: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-surface rounded-2xl px-4 py-3" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ backgroundColor: `${category.color}15` }}>
        {category.icon}
      </div>
      <p className="flex-1 text-sm font-semibold text-text">{category.name}</p>
      {category.is_default && <span className="text-xs text-muted bg-bg rounded-full px-2 py-0.5">Default</span>}
      <button onClick={onEdit} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-muted hover:text-text transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      {onDelete && (
        <button onClick={onDelete} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-muted hover:text-danger transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </button>
      )}
    </div>
  )
}
