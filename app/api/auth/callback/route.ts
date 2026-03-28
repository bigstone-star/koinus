import { NextResponse } from 'next/server'
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (code) return NextResponse.redirect(url.origin + '/?login=success')
  return NextResponse.redirect(url.origin + '/auth/login')
}