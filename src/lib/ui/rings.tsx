import React from 'react'

type ProgressRingProps = {
  value: number
  label?: string
  size?: number
  stroke?: number
}

export function ProgressRing({ value, label, size = 64, stroke = 8 }: ProgressRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, isFinite(value) ? value : 0))
  const dash = (clamped / 100) * circumference

  return (
    <div className="inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10b981"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-gray-800 text-sm"
        >
          {Math.round(clamped)}%
        </text>
      </svg>
      {label && <div className="mt-1 text-xs text-gray-600">{label}</div>}
    </div>
  )
}


