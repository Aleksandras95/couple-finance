import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { households, users } from '@/db/schema'
import { getSession } from '@/lib/session'
import { signJWT } from '@/lib/auth'
import { eq } from 'drizzle-orm'

type Ctx = { params: Promise<{ code: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { code } = await ctx.params

  const [household] = await db
    .select()
    .from(households)
    .where(eq(households.invite_code, code.toUpperCase()))
    .limit(1)

  if (!household) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
  }

  const members = await db
    .select({ id: users.id, name: users.name, avatar_color: users.avatar_color })
    .from(users)
    .where(eq(users.household_id, household.id))

  return NextResponse.json({ household: { id: household.id, name: household.name }, members })
}

export async function POST(_request: NextRequest, ctx: Ctx) {
  const { code } = await ctx.params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [household] = await db
    .select()
    .from(households)
    .where(eq(households.invite_code, code.toUpperCase()))
    .limit(1)

  if (!household) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
  }

  const members = await db
    .select()
    .from(users)
    .where(eq(users.household_id, household.id))

  if (members.length >= 2) {
    return NextResponse.json({ error: 'Household already has 2 members' }, { status: 400 })
  }

  await db.update(users).set({ household_id: household.id }).where(eq(users.id, session.userId))

  const newToken = await signJWT({
    userId: session.userId,
    householdId: household.id,
    email: session.email,
    name: session.name,
  })

  const response = NextResponse.json({ household: { id: household.id, name: household.name } })
  response.cookies.set('cf_session', newToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}
