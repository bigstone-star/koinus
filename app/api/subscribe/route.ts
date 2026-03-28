import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const { tier } = await req.json()
  return NextResponse.json({ url: '/pricing?pending=true&tier=' + tier })
}