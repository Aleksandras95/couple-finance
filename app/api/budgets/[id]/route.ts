import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { budgets } from '@/db/schema'
import { getSession } from '@/lib/session'
import { eq, and } from 'drizzle-orm'
import { decimalToCents } from '@/lib/format'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount } = await request.json()
  if (!amount) return NextResponse.json({ error: 'Amount required' }, { status: 400 })

  const [budget] = await db
    .update(budgets)
    .set({ amount: decimalToCents(amount) })
    .where(and(eq(budgets.id, id), eq(budgets.household_id, session.householdId!)))
    .returning()

  if (!budget) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ budget })
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db
    .delete(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.household_id, session.householdId!)))

  return NextResponse.json({ ok: true })
}
