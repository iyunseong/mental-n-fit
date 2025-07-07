// Supabase User 타입 import
import { User } from '@supabase/supabase-js'

// 인증 상태 타입
export type AuthState = {
  isLoading: boolean
  isAuthenticated: boolean
  user: User | null
  error: string | null
}

// 폼 데이터 타입
export type LoginFormData = {
  email: string
  password: string
}

export type RegisterFormData = {
  email: string
  password: string
  confirmPassword: string
  nickname: string
}

// 사용자 프로필 타입
export type UserProfile = {
  id: string
  user_id: string
  nickname: string
  email: string
  created_at: string
  updated_at: string
}

// API 응답 타입
export type AuthResponse = {
  success: boolean
  message: string
  user?: User
} 