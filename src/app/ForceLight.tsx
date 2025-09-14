'use client'

import { useEffect } from 'react'

export default function ForceLight() {
  useEffect(() => {
    const root = document.documentElement
    // 강제로 dark 클래스를 제거하고 light 클래스를 보장
    if (root.classList.contains('dark')) root.classList.remove('dark')
    root.classList.add('light')
  }, [])
  return null
}





