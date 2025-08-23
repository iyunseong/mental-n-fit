// src/components/dashboard/InbodyForm.tsx
'use client'
import React from 'react'
import type { ComponentProps } from 'react'
import Legacy from '@/components/forms/InbodyForm'

type Props = ComponentProps<typeof Legacy>

export default function InbodyForm(props: Props){
  return <Legacy {...props} />
}


