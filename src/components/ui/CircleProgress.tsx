'use client'

type Props = {
  /** 0~1 사이 */
  progress: number
  /** 원 크기(px) */
  size?: number
  /** 원 두께(px) */
  stroke?: number
  /** 진행 색 */
  color?: string
  /** 배경 트랙 색 */
  trackColor?: string
  /** 중앙에 보여줄 내용 */
  center?: React.ReactNode
  /** 접근성 라벨 */
  ariaLabel?: string
}

export default function CircleProgress({
  progress,
  size = 96,
  stroke = 10,
  color = '#0EA5E9',
  trackColor = '#E5E7EB',
  center,
  ariaLabel = 'progress',
}: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const value = Math.max(0, Math.min(1, progress || 0))
  const dash = c * value
  const gap = c - dash

  return (
    <div style={{ width: size, height: size }} aria-label={ariaLabel} role="img" className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${dash} ${gap}`} transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      {center && (
        <div className="absolute inset-0 flex items-center justify-center">
          {center}
        </div>
      )}
    </div>
  )
}
