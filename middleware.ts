import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  // E2E 테스트용 인증 우회
  if (process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === '1' || req.headers.get('x-e2e') === '1') {
    return res
  }
  
  // Supabase 클라이언트 생성 (미들웨어용)
  const supabase = createMiddlewareClient({ req, res })
  
  // 세션 확인
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 보호된 라우트 정의
  const protectedRoutes = ['/dashboard']
  const authRoutes = ['/login', '/register']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )
  
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // 보호된 라우트에 접근하려는데 세션이 없는 경우
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // 이미 로그인된 사용자가 인증 페이지(로그인/회원가입)에 접근하는 경우
  if (isAuthRoute && session) {
    const redirectUrl = new URL('/dashboard', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * 다음 경로들을 제외한 모든 요청 경로에서 미들웨어 실행:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 

