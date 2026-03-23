'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Registration failed')
      setLoading(false)
      return
    }

    router.push('/onboarding')
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-6 pt-12">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl mb-4 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #F43F5E, #8B5CF6)' }}
        >
          💑
        </div>
        <h1 className="text-2xl font-bold text-text">Create account</h1>
        <p className="text-sm text-muted mt-1">Start managing finances together</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <Input
          label="Your name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex"
          autoComplete="name"
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          autoComplete="new-password"
          required
          minLength={6}
        />

        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-2xl px-4 py-3">
            <p className="text-sm text-danger font-medium">{error}</p>
          </div>
        )}

        <Button type="submit" loading={loading} fullWidth size="lg" className="mt-6">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-8">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  )
}
