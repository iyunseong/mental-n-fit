import { NextResponse } from 'next/server'
import { saveMeal } from '@/actions/meals'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    await saveMeal(body)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    return NextResponse.json({ ok: false, error: msg }, { status: 400 })
  }
}



