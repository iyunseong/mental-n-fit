'use client'
import React from 'react'
import type { ComponentProps } from 'react'
import Legacy from '@/components/forms/DailyConditionForm'

type Props = ComponentProps<typeof Legacy>

export default function DailyConditionForm(props: Props){
  return <Legacy {...props} />
}


