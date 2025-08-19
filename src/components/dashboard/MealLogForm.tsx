'use client'
import React from 'react'
import type { ComponentProps } from 'react'
import Legacy from '@/components/forms/MealLogForm'

type Props = ComponentProps<typeof Legacy>

export default function MealLogForm(props: Props){
  return <Legacy {...props} />
}


