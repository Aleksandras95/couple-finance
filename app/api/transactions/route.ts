import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { transactions, users, categories } from '@/db/schema'
import { getSession } from '@/lib/session'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { decimalToCents } from '@/lib/format'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.householdId) return NextResponse.json({ error: 'No household' }, { status: 400 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    const conditions = [eq(transactions.household_id, session.householdId)]

    if (month) {
      conditions.push(gte(transactions.date, `${month}-01`))
      const [year, m] = month.split('-')
      const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate()
      conditions.push(lte(transactions.date, `${month}-${lastDay}`))
    }

    if (type) {
      conditions.push(eq(transactions.type, type))
    }

    const rows = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        date: transactions.date,
        description: transactions.description,
        is_recurring: transactions.is_recurring,
        recurring_interval: transactions.recurring_interval,
        created_at: transactions.created_at,
        category_id: transactions.category_id,
        category_name: categories.name,
        category_icon: categories.icon,
        category_color: categories.color,
        user_id: transactions.user_id,
        user_name: users.name,
        user_avatar_color: users.avatar_color,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.category_id, categories.id))
      .leftJoin(users, eq(transactions.user_id, users.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.created_at))
      .limit(limit)

    return NextResponse.json({ transactions: rows })
  } catch (err) {
    console.error('[transactions GET]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.householdId) return NextResponse.json({ error: 'No household' }, { status: 400 })

    const body = await request.json()
    const { amount, type, category_id, date, description, is_recurring, recurring_interval } = body

    if (!amount || !type || !date) {
      return NextResponse.json({ error: 'Amount, type and date required' }, { status: 400 })
    }

    const amountCents = decimalToCents(amount)
    if (amountCents <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    }

    const [tx] = await db
      .insert(transactions)
      .values({
        amount: amountCents,
        type,
        category_id: category_id || null,
        date,
        description: description || null,
        user_id: session.userId,
        household_id: session.householdId,
        is_recurring: is_recurring || false,
        recurring_interval: recurring_interval || null,
      })
      .returning()

    return NextResponse.json({ transaction: tx }, { status: 201 })
  } catch (err) {
    console.error('[transactions POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
