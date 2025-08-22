import { NextResponse } from 'next/server'

// NOTE: Stub implementation to unblock UI. Later, wire to Supabase missions table with auth.

export async function GET() {
  // Accept date param but return empty list for now to avoid 404s
  // const { searchParams } = new URL(req.url)
  // const date = searchParams.get('date')
  return NextResponse.json([], { status: 200 })
}

export async function POST() {
  // Accept { id, action } and respond success for now
  // const body = await req.json().catch(() => null)
  return NextResponse.json({ ok: true }, { status: 200 })
}


