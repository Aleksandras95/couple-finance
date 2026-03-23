import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { transactions, users, categories } from '@/db/schema'
import { getSession } from '@/lib/session'
import { eq, and, gte, lte, sum, desc } from 'drizzle-orm'
import { currentMonth } from '@/lib/format'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.householdId) return NextResponse.json({ error: 'No household' }, { status: 400 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || currentMonth()

    const [year, m] = month.split('-')
    const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate()
    const startDate = `${month}-01`
    const endDate = `${month}-${lastDay}`

    const conditions = [
      eq(transactions.household_id, session.householdId),
      gte(transactions.date, startDate),
      lte(transactions.date, endDate),
    ]

    const [incomeRow] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(and(...conditions, eq(transactions.type, 'income')))

    const [expenseRow] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(and(...conditions, eq(transactions.type, 'expense')))

    const userBreakdown = await db
      .select({
        user_id: transactions.user_id,
        user_name: users.name,
        user_avatar_color: users.avatar_color,
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.user_id, users.id))
      .where(and(...conditions))
      .groupBy(transactions.user_id, transactions.type, users.name, users.avatar_color)

    const recent = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        date: transactions.date,
        description: transactions.description,
        is_recurring: transactions.is_recurring,
        category_name: categories.name,
        category_icon: categories.icon,
        category_color: categories.color,
        user_name: users.name,
        user_avatar_color: users.avatar_color,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.category_id, categories.id))
      .leftJoin(users, eq(transactions.user_id, users.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.created_at))
      .limit(10)

    const categorySpending = await db
      .select({
        category_id: transactions.category_id,
        category_name: categories.name,
        category_icon: categories.icon,
        category_color: categories.color,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.category_id, categories.id))
      .where(and(...conditions, eq(transactions.type, 'expense')))
      .groupBy(transactions.category_id, categories.name, categories.icon, categories.color)
      .orderBy(desc(sum(transactions.amount)))
      .limit(5)

    const totalIncome = parseInt(String(incomeRow?.total || 0))
    const totalExpenses = parseInt(String(expenseRow?.total || 0))
    const balance = totalIncome - totalExpenses

    return NextResponse.json({
      month,
      totalIncome,
      totalExpenses,
      balance,
      userBreakdown,
      recent,
      categorySpending,
    })
  } catch (err) {
    console.error('[dashboard GET]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
