// src/components/dashboard/RangeToggle.tsx
'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useMemo } from 'react'

export default function RangeToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentRange = searchParams.get('range') === '90' ? '90' : '30'

  const makeUrl = useMemo(() => {
    return (range: '30' | '90') => {
      const sp = new URLSearchParams(searchParams?.toString())
      sp.set('range', range)
      // tab이 없을 때 기본은 calendar로
      if (!sp.get('tab')) sp.set('tab', 'calendar')
      return `${pathname}?${sp.toString()}`
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()])

  const setRange = (r: '30' | '90') => {
    router.replace(makeUrl(r))
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1">
      <button
        onClick={() => setRange('30')}
        className={`px-3 py-1.5 text-sm rounded-md transition ${
          currentRange === '30' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-700 hover:text-gray-900'
        }`}
        aria-pressed={currentRange === '30'}
      >
        최근 30일
      </button>
      <button
        onClick={() => setRange('90')}
        className={`px-3 py-1.5 text-sm rounded-md transition ${
          currentRange === '90' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-700 hover:text-gray-900'
        }`}
        aria-pressed={currentRange === '90'}
      >
        최근 90일
      </button>
    </div>
  )
}
