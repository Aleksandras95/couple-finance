import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { transactions } from '@/db/schema'
import { getSession } from '@/lib/session'
import { eq, and } from 'drizzle-orm'
import { decimalToCents } from '@/lib/format'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [tx] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.household_id, session.householdId!)))
    .limit(1)

  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ transaction: tx })
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { amount, type, category_id, date, description, is_recurring, recurring_interval } = body

  const amountCents = amount ? decimalToCents(amount) : undefined

  const [tx] = await db
    .update(transactions)
    .set({
      ...(amountCents !== undefined && { amount: amountCents }),
      ...(type && { type }),
      ...(category_id !== undefined && { category_id }),
      ...(date && { date }),
      ...(description !== undefined && { description }),
      ...(is_recurring !== undefined && { is_recurring }),
      ...(recurring_interval !== undefined && { recurring_interval }),
      updated_at: new Date(),
    })
    .where(and(eq(transactions.id, id), eq(transactions.household_id, session.householdId!)))
    .returning()

  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ transaction: tx })
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.household_id, session.householdId!)))

  return NextResponse.json({ ok: true })
}
