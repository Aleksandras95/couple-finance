'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

interface User {
  id: string
  email: string
  name: string
  avatar_color: string
  household_id: string | null
}

interface HouseholdMember {
  id: string
  name: string
  email: string
  avatar_color: string
}

interface Household {
  id: string
  name: string
  invite_code: string
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogout, setShowLogout] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [showCategories, setShowCategories] = useState(false)

  useEffect(() => {
    async function load() {
      const [userRes, hhRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/household'),
      ])
      if (userRes.ok) setUser((await userRes.json()).user)
      if (hhRes.ok) {
        const d = await hhRes.json()
        setHousehold(d.household)
        setMembers(d.members || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  async function copyInviteCode() {
    if (!household) return
    await navigator.clipboard.writeText(household.invite_code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <div className="h-8 w-32 skeleton rounded-xl" />
        <div className="h-24 skeleton rounded-2xl" />
        <div className="h-40 skeleton rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 space-y-4 fade-in">
      <h1 className="text-xl font-bold text-text">Account</h1>

      {/* User profile */}
      <div className="bg-surface rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: user?.avatar_color || '#F43F5E' }}
          >
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold text-text">{user?.name}</p>
            <p className="text-sm text-muted">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Household */}
      {household && (
        <div className="bg-surface rounded-2xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-text">Household</p>
            <span className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1 font-semibold">
              {household.name}
            </span>
          </div>

          {/* Members */}
          <div className="space-y-3 mb-4">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: m.avatar_color }}
                >
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{m.name}</p>
                  <p className="text-xs text-muted">{m.email}</p>
                </div>
                {m.id === user?.id && (
                  <span className="ml-auto text-xs text-muted bg-bg rounded-full px-2 py-0.5">You</span>
                )}
              </div>
            ))}
          </div>

          {/* Invite */}
          {members.length < 2 && (
            <button
              onClick={() => setShowInvite(true)}
              className="w-full py-3 border border-dashed border-primary/40 rounded-2xl text-sm text-primary font-semibold hover:bg-primary/5 transition-colors"
            >
              + Invite your partner
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="bg-surface rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <button
          onClick={() => router.push('/account/categories')}
          className="flex items-center justify-between w-full px-5 py-4 hover:bg-bg transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4"/><circle cx="17" cy="17" r="4"/><line x1="17" y1="14" x2="17" y2="20"/><line x1="14" y1="17" x2="20" y2="17"/></svg>
            </div>
            <span className="text-sm font-semibold text-text">Manage Categories</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted"><polyline points="9,18 15,12 9,6"/></svg>
        </button>

        <div className="h-px bg-border mx-5" />

        <button
          onClick={() => setShowLogout(true)}
          className="flex items-center justify-between w-full px-5 py-4 hover:bg-bg transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-danger/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <span className="text-sm font-semibold text-danger">Sign Out</span>
          </div>
        </button>
      </div>

      {/* Invite Modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Partner">
        <div className="px-6 pb-8 space-y-4">
          <p className="text-sm text-muted">Share this code with your partner so they can join your household.</p>
          {household && (
            <div className="bg-bg rounded-2xl p-6 text-center">
              <p className="text-3xl font-bold text-text tracking-widest">{household.invite_code}</p>
            </div>
          )}
          <Button
            fullWidth
            onClick={copyInviteCode}
            variant={copiedCode ? 'secondary' : 'primary'}
          >
            {copiedCode ? '✓ Copied!' : 'Copy Invite Code'}
          </Button>
          <p className="text-xs text-muted text-center">
            Your partner enters this code during registration
          </p>
        </div>
      </Modal>

      {/* Logout confirm */}
      <ConfirmModal
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
        title="Sign out?"
        message="You'll need to log in again to access your finances."
        confirmLabel="Sign Out"
        confirmVariant="danger"
      />
    </div>
  )
}
