'use client'
import React from 'react'
import type { ComponentProps } from 'react'
import Legacy from '@/components/forms/WorkoutLogForm'

type Props = ComponentProps<typeof Legacy>

export default function WorkoutLogForm(props: Props){
  return <Legacy {...props} />
}


