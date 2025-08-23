"use client"
import React from 'react'
import Legacy from '../DailyConditionForm'
type LegacyProps = {
  onDataSaved?: () => void
  selectedDate?: string | null
  onSave?: (() => void) | null
  onCancel?: (() => void) | null
  logToEdit?: unknown
}
const LegacyComp = Legacy as unknown as React.ComponentType<LegacyProps>

type Props = {
  onDataSaved?: () => void
  selectedDate?: string
  onSave?: () => void
  onCancel?: () => void
}

export default function DailyConditionFormInner(props: Props){
  const mappedProps: LegacyProps = {
    onDataSaved: props.onDataSaved,
    selectedDate: props.selectedDate ?? null,
    onSave: props.onSave ?? null,
    onCancel: props.onCancel ?? null,
  }
  return <LegacyComp {...mappedProps} />
}


