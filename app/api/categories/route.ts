import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories } from '@/db/schema'
import { getSession } from '@/lib/session'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.householdId) return NextResponse.json({ error: 'No household' }, { status: 400 })

    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.household_id, session.householdId))
      .orderBy(categories.name)

    return NextResponse.json({ categories: rows })
  } catch (err) {
    console.error('[categories GET]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.householdId) return NextResponse.json({ error: 'No household' }, { status: 400 })

    const { name, icon, color, type } = await request.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const [cat] = await db
      .insert(categories)
      .values({
        name,
        icon: icon || '📦',
        color: color || '#6B7280',
        type: type || 'both',
        is_default: false,
        household_id: session.householdId,
      })
      .returning()

    return NextResponse.json({ category: cat }, { status: 201 })
  } catch (err) {
    console.error('[categories POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
