'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { auth } from '@/lib/supabase'
import { UserProfile } from '@/lib/authTypes'
import { Brain, Home, User as UserIcon, Settings, Menu, X } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 컴포넌트 마운트 시 사용자 정보 가져오기
  useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await auth.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          
          // 프로필 정보도 가져오기
          const userProfile = await auth.getUserProfile(currentUser.id)
          setProfile(userProfile)
        } else {
          // 사용자가 로그인되어 있지 않으면 로그인 페이지로 리다이렉트
          router.push('/login')
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  // 로딩 중일 때 표시할 화면
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 사용자 정보가 없으면 빈 화면 (리다이렉트 진행 중)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                mental-n-fit
              </h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                <Home className="w-4 h-4" />
                <span>홈</span>
              </Link>
              <Link href="/survey" className="text-gray-600 hover:text-blue-600 transition-colors">
                MetaType 16
              </Link>
              <Link href="/results" className="text-gray-600 hover:text-blue-600 transition-colors">
                결과
              </Link>
              
              {/* 사용자 정보 */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    안녕하세요, {profile?.nickname || user.email}님!
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4">
              <Link 
                href="/"
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                <span>홈</span>
              </Link>
              <Link 
                href="/survey"
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                MetaType 16
              </Link>
              <Link 
                href="/results"
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                결과
              </Link>
              
              {/* 모바일 사용자 정보 */}
              <div className="px-4 py-2 space-y-4">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <UserIcon className="w-4 h-4" />
                  <span>안녕하세요, {profile?.nickname || user.email}님!</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* 대시보드 헤더 */}
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
              <p className="text-gray-600">
                안녕하세요, {profile?.nickname || user.email?.split('@')[0]}님! 오늘도 좋은 하루 되세요.
              </p>
            </div>
          </div>
          
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  환영합니다! 
                </h2>
                <p className="text-gray-600 mb-6">
                  성공적으로 로그인되었습니다. 이곳은 인증된 사용자만 접근할 수 있는 보호된 페이지입니다.
                </p>
                
                {/* 사용자 정보 카드 */}
                <div className="bg-white overflow-hidden shadow rounded-lg max-w-md mx-auto">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      사용자 정보
                    </h3>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">닉네임</dt>
                        <dd className="mt-1 text-sm text-gray-900">{profile?.nickname || '설정되지 않음'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">이메일</dt>
                        <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">사용자 ID</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-mono text-xs break-all">{user.id}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">가입일</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">이메일 확인</dt>
                        <dd className="mt-1 text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.email_confirmed_at 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.email_confirmed_at ? '확인됨' : '미확인'}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 