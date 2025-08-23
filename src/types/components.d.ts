declare module '@/components/dashboard/HealthCalendar' {
  import React from 'react'
  export type HealthCalendarProps = {
    onDateSelect?: (date: string) => void
    compact?: boolean
  }
  const HealthCalendar: React.FC<HealthCalendarProps>
  export default HealthCalendar
}

declare module '@/components/dashboard/DailySummarySidebar' {
  import React from 'react'
  export type DailySummarySidebarProps = {
    selectedDate: string
    onEditCondition?: () => void
    onEditWorkout?: () => void
    onEditMeal?: () => void
    onEditInbody?: () => void
    refreshTrigger?: number
  }
  const DailySummarySidebar: React.FC<DailySummarySidebarProps>
  export default DailySummarySidebar
}

declare module '@/components/forms/DailyConditionForm' {
  import React from 'react'
  export type DailyConditionFormProps = {
    selectedDate?: string
    onSave?: () => void
    onCancel?: () => void
    onDataSaved?: () => void
    logToEdit?: unknown
  }
  const DailyConditionForm: React.FC<DailyConditionFormProps>
  export default DailyConditionForm
}

declare module '@/components/forms/MealLogForm' {
  import React from 'react'
  export type MealLogFormProps = {
    selectedDate?: string
    onSave?: () => void
    onCancel?: () => void
    onDataSaved?: () => void
  }
  const MealLogForm: React.FC<MealLogFormProps>
  export default MealLogForm
}

declare module '@/components/dashboard/InbodyTrendChart' {
  import React from 'react'
  const InbodyTrendChart: React.FC<{ refreshTrigger?: number }>
  export default InbodyTrendChart
}

declare module '@/components/dashboard/VolumeTrendChart' {
  import React from 'react'
  const VolumeTrendChart: React.FC<{ refreshTrigger?: number }>
  export default VolumeTrendChart
}

declare module '@/components/dashboard/MealTrendChart' {
  import React from 'react'
  const MealTrendChart: React.FC<{ refreshTrigger?: number }>
  export default MealTrendChart
}


