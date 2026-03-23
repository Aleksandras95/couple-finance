import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { households, users, categories } from '@/db/schema'
import { getSession } from '@/lib/session'
import { signJWT } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { DEFAULT_CATEGORIES } from '@/lib/categories'
import { nanoid } from '@/lib/nanoid'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.householdId) return NextResponse.json({ error: 'No household' }, { status: 404 })

    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, session.householdId))
      .limit(1)

    const members = await db
      .select({ id: users.id, name: users.name, email: users.email, avatar_color: users.avatar_color })
      .from(users)
      .where(eq(users.household_id, session.householdId))

    return NextResponse.json({ household, members })
  } catch (err) {
    console.error('[household GET]', err)
    return NextResponse.json({ error: 'Failed to load household' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name } = await request.json()
    if (!name) return NextResponse.json({ error: 'Household name required' }, { status: 400 })

    const invite_code = nanoid(8).toUpperCase()

    const [household] = await db
      .insert(households)
      .values({ name, invite_code })
      .returning()

    await db.update(users).set({ household_id: household.id }).where(eq(users.id, session.userId))

    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map((c) => ({
        name: c.name,
        icon: c.icon,
        color: c.color,
        type: c.type,
        is_default: true,
        household_id: household.id,
      }))
    )

    const newToken = await signJWT({
      userId: session.userId,
      householdId: household.id,
      email: session.email,
      name: session.name,
    })

    const response = NextResponse.json({ household })
    response.cookies.set('cf_session', newToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return response
  } catch (err) {
    console.error('[household POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
