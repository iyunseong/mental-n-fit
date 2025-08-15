"use client"
import React from 'react'
import { Card } from '@/components/ui/Card'
import { Info, CheckCircle2, AlertTriangle } from 'lucide-react'

type Variant = 'info' | 'success' | 'warning'

type NudgeCardProps = {
  title: string
  detail?: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  variant?: Variant
}

const variantMap: Record<Variant, { icon: React.ReactNode; color: string; button: string; subtle: string }> = {
  info: {
    icon: <Info className="w-4 h-4 text-blue-600" />,
    color: 'text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    subtle: 'text-blue-600',
  },
  success: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    color: 'text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    subtle: 'text-emerald-600',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    color: 'text-amber-700',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
    subtle: 'text-amber-600',
  },
}

export default function NudgeCard({ title, detail, primaryLabel, onPrimary, secondaryLabel, onSecondary, variant = 'info' }: NudgeCardProps) {
  const v = variantMap[variant]
  return (
    <Card className="p-0">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{v.icon}</div>
          <div className="flex-1">
            <div className={`text-sm font-medium ${v.color}`}>{title}</div>
            {detail && <div className="text-sm text-gray-600 mt-1">{detail}</div>}
            <div className="mt-3 flex items-center gap-2">
              <button onClick={onPrimary} className={`px-3 py-1.5 rounded-md text-sm ${v.button}`}>{primaryLabel}</button>
              {secondaryLabel && onSecondary && (
                <button onClick={onSecondary} className={`px-3 py-1.5 rounded-md text-sm border border-gray-200 ${v.subtle}`}>
                  {secondaryLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}


