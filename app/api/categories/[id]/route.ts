import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories } from '@/db/schema'
import { getSession } from '@/lib/session'
import { eq, and } from 'drizzle-orm'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, icon, color, type } = await request.json()

  const [cat] = await db
    .update(categories)
    .set({
      ...(name && { name }),
      ...(icon && { icon }),
      ...(color && { color }),
      ...(type && { type }),
    })
    .where(and(eq(categories.id, id), eq(categories.household_id, session.householdId!)))
    .returning()

  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ category: cat })
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.household_id, session.householdId!)))

  return NextResponse.json({ ok: true })
}
