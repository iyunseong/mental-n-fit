import { createClient } from '@supabase/supabase-js'
import { UserProfile } from './authTypes'

// Supabase 프로젝트 설정값들
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 환경 변수 필수 검증
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경 변수 누락: NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.'
  )
}

// Supabase 클라이언트 인스턴스 생성 (싱글톤 패턴)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 인증 관련 헬퍼 함수들
export const auth = {
  // 회원가입 (프로필 생성 포함)
  signUp: async (email: string, password: string, nickname: string) => {
    // 먼저 계정 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return { data: null, error: authError }
    }

    // 계정 생성 성공 시 프로필 정보 저장
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          nickname,
          email,
        })

      if (profileError) {
        console.error('프로필 생성 실패:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })
        // 프로필 생성 실패해도 계정 생성은 성공했으므로 성공으로 처리
      }
    }

    return { data: authData, error: authError }
  },

  // 로그인
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  },

  // 로그아웃
  signOut: async () => {
    return await supabase.auth.signOut()
  },

  // 현재 사용자 정보 가져오기
  getCurrentUser: async () => {
    if (process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === '1') {
      return { id: 'e2e-user', email: 'e2e@example.com' } as unknown as import('@supabase/supabase-js').User
    }
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // 세션 정보 가져오기
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  // 사용자 프로필 가져오기
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    if (process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === '1') {
      return {
        user_id: userId,
        nickname: 'E2E Tester',
        email: 'e2e@example.com',
        created_at: new Date().toISOString(),
      } as unknown as UserProfile
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('프로필 조회 실패:', error)
      return null
    }

    return data
  },

  // 기존 사용자의 프로필 생성 (닉네임 필요)
  createMissingProfile: async (userId: string, email: string, nickname: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        nickname,
        email,
      })
      .select()
      .single()

    if (error) {
      console.error('프로필 생성 실패:', error)
      return null
    }

    return data
  }
} 