import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { budgets, categories, transactions } from '@/db/schema'
import { getSession } from '@/lib/session'
import { eq, and, gte, lte, sum } from 'drizzle-orm'
import { decimalToCents, currentMonth } from '@/lib/format'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.householdId) return NextResponse.json({ error: 'No household' }, { status: 400 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || currentMonth()

    const rows = await db
      .select({
        id: budgets.id,
        amount: budgets.amount,
        month: budgets.month,
        category_id: budgets.category_id,
        category_name: categories.name,
        category_icon: categories.icon,
        category_color: categories.color,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.category_id, categories.id))
      .where(and(eq(budgets.household_id, session.householdId), eq(budgets.month, month)))

    const [year, m] = month.split('-')
    const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate()
    const startDate = `${month}-01`
    const endDate = `${month}-${lastDay}`

    const spent = await db
      .select({
        category_id: transactions.category_id,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.household_id, session.householdId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(transactions.category_id)

    const spentMap: Record<string, number> = {}
    for (const s of spent) {
      if (s.category_id) spentMap[s.category_id] = parseInt(String(s.total || 0))
    }

    const result = rows.map((b) => ({
      ...b,
      spent: b.category_id ? (spentMap[b.category_id] || 0) : 0,
    }))

    return NextResponse.json({ budgets: result, month })
  } catch (err) {
    console.error('[budgets GET]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.householdId) return NextResponse.json({ error: 'No household' }, { status: 400 })

    const { category_id, amount, month } = await request.json()
    if (!category_id || !amount || !month) {
      return NextResponse.json({ error: 'category_id, amount and month required' }, { status: 400 })
    }

    const amountCents = decimalToCents(amount)

    await db
      .delete(budgets)
      .where(
        and(
          eq(budgets.household_id, session.householdId),
          eq(budgets.category_id, category_id),
          eq(budgets.month, month)
        )
      )

    const [budget] = await db
      .insert(budgets)
      .values({ category_id, household_id: session.householdId, amount: amountCents, month })
      .returning()

    return NextResponse.json({ budget }, { status: 201 })
  } catch (err) {
    console.error('[budgets POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
