'use client'

import { useRouter } from 'next/navigation'
import { auth } from '@/lib/supabase'
import { Button } from './Button'

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  redirectTo?: string
}

export default function LogoutButton({ 
  variant = 'primary', 
  size = 'md', 
  className = '',
  redirectTo = '/login'
}: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push(redirectTo)
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      className={className}
    >
      로그아웃
    </Button>
  )
} 