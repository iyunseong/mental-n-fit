import React from 'react'

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode
  title?: string
  className?: string
  description?: string
  headerRight?: React.ReactNode
}

export function Card({ children, title, description, className = '', headerRight, ...rest }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`} {...rest}>
      {(title || description || headerRight) && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          {headerRight}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}


