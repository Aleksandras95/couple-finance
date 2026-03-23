'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Step = 'choose' | 'create' | 'join'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('choose')
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!householdName.trim()) { setError('Enter a household name'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: householdName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create household')
        return
      }
      router.push('/')
    } catch (e) {
      setError('Network error — check your connection')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    const code = inviteCode.trim().toUpperCase()
    if (!code) { setError('Enter the invite code'); return }
    setError('')
    setLoading(true)
    const res = await fetch(`/api/invite/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      const err = await res.json()
      setError(err.error || 'Invalid code')
      setLoading(false)
      return
    }
    router.push('/')
  }

  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="flex-1 flex flex-col p-6 pt-16">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #F43F5E, #8B5CF6)' }}
          >
            🏡
          </div>
          <h1 className="text-2xl font-bold text-text">Set up your household</h1>
          <p className="text-sm text-muted mt-1 text-center">Create a shared space or join your partner</p>
        </div>

        {step === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => { setStep('create'); setError('') }}
              className="w-full p-5 bg-surface rounded-3xl text-left press-effect transition-all"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                  🏠
                </div>
                <div>
                  <p className="text-base font-bold text-text">Create a household</p>
                  <p className="text-xs text-muted mt-0.5">I&apos;ll invite my partner with a code</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => { setStep('join'); setError('') }}
              className="w-full p-5 bg-surface rounded-3xl text-left press-effect transition-all"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-2xl">
                  🔗
                </div>
                <div>
                  <p className="text-base font-bold text-text">Join a household</p>
                  <p className="text-xs text-muted mt-0.5">I have an invite code from my partner</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {step === 'create' && (
          <div className="space-y-4">
            <button onClick={() => setStep('choose')} className="flex items-center gap-2 text-muted text-sm font-medium mb-2 press-effect">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>
              Back
            </button>

            <Input
              label="Household name"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="e.g. Our Home, The Smiths"
              autoFocus
            />

            {error && <p className="text-sm text-danger font-medium">{error}</p>}

            <Button fullWidth size="lg" loading={loading} onClick={handleCreate} className="mt-4">
              Create Household
            </Button>
          </div>
        )}

        {step === 'join' && (
          <div className="space-y-4">
            <button onClick={() => setStep('choose')} className="flex items-center gap-2 text-muted text-sm font-medium mb-2 press-effect">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>
              Back
            </button>

            <Input
              label="Invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="ABC12345"
              autoFocus
              className="tracking-widest text-center text-lg uppercase"
            />

            {error && <p className="text-sm text-danger font-medium">{error}</p>}

            <Button fullWidth size="lg" loading={loading} onClick={handleJoin} className="mt-4">
              Join Household
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
