import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'couple-finance-secret-key-change-in-production'
)

const PUBLIC_PAGES = ['/login', '/register', '/invite']
const PUBLIC_API = ['/api/auth/login', '/api/auth/register', '/api/invite']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith('/api/')

  // Allow public pages
  if (PUBLIC_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow public API routes
  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('cf_session')?.value

  // Not logged in
  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    const session = payload as { userId: string; householdId: string | null }

    // Logged in but no household
    if (!session.householdId) {
      if (isApiRoute) {
        // Allow /api/household POST so the user can CREATE a household
        if (pathname === '/api/household') {
          return NextResponse.next()
        }
        return NextResponse.json({ error: 'No household' }, { status: 403 })
      }
      // On pages: only allow /onboarding
      if (!pathname.startsWith('/onboarding')) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
      return NextResponse.next()
    }

    // Logged in WITH household — don't let them back to onboarding
    if (pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
  } catch {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('cf_session')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
