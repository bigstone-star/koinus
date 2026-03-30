import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type BusinessRow = {
  id: string
  name_kr?: string | null
  name_en?: string | null
  category_main?: string | null
  category_sub?: string | null
  address?: string | null
  phone?: string | null
  rating?: number | null
  review_count?: number | null
  description_kr?: string | null
  is_vip?: boolean | null
  vip_tier?: string | null
}

function normalizeQuery(input: string) {
  return input.replace(/\s+/g, ' ').trim()
}

function extractCategoryHints(q: string) {
  const lower = q.toLowerCase()

  const hints: string[] = []

  if (q.includes('치과') || lower.includes('dent')) hints.push('치과')
  if (q.includes('한의원') || q.includes('한방') || lower.includes('acupuncture')) hints.push('한의원')
  if (q.includes('식당') || q.includes('음식') || q.includes('맛집') || q.includes('카페') || lower.includes('restaurant') || lower.includes('cafe')) hints.push('식당·카페')
  if (q.includes('마트') || q.includes('식품') || lower.includes('market')) hints.push('마트·식품')
  if (q.includes('병원') || q.includes('의원') || q.includes('클리닉') || lower.includes('clinic') || lower.includes('medical')) hints.push('의료')
  if (q.includes('변호') || q.includes('법률') || lower.includes('law')) hints.push('법률')
  if (q.includes('미용') || q.includes('헤어') || q.includes('네일') || lower.includes('beauty')) hints.push('미용')
  if (q.includes('부동산') || lower.includes('real estate')) hints.push('부동산')
  if (q.includes('세탁') || lower.includes('laundry')) hints.push('세탁소')
  if (q.includes('교육') || q.includes('학원') || lower.includes('academy')) hints.push('교육')
  if (q.includes('자동차') || q.includes('정비') || lower.includes('auto')) hints.push('자동차')
  if (q.includes('금융') || q.includes('보험') || lower.includes('insurance') || lower.includes('finance')) hints.push('금융·보험')

  return Array.from(new Set(hints))
}

async function searchBusinesses(query: string): Promise<BusinessRow[]> {
  const normalized = normalizeQuery(query)
  const categoryHints = extractCategoryHints(normalized)

  let dbQuery = sb
    .from('businesses')
    .select(`
      id,
      name_kr,
      name_en,
      category_main,
      category_sub,
      address,
      phone,
      rating,
      review_count,
      description_kr,
      is_vip,
      vip_tier
    `)
    .eq('is_active', true)
    .limit(12)

  if (categoryHints.length === 1) {
    dbQuery = dbQuery.eq('category_main', categoryHints[0])
  }

  if (normalized) {
    const escaped = normalized.replace(/,/g, ' ')
    dbQuery = dbQuery.or(
      [
        `name_kr.ilike.%${escaped}%`,
        `name_en.ilike.%${escaped}%`,
        `category_main.ilike.%${escaped}%`,
        `category_sub.ilike.%${escaped}%`,
        `address.ilike.%${escaped}%`,
        `description_kr.ilike.%${escaped}%`,
      ].join(',')
    )
  }

  dbQuery = dbQuery
    .order('is_vip', { ascending: false })
    .order('rating', { ascending: false, nullsFirst: false })
    .order('review_count', { ascending: false, nullsFirst: false })

  const { data, error } = await dbQuery

  if (error) {
    throw new Error(error.message)
  }

  const rows = data || []

  if (rows.length > 0) return rows

  // fallback: category hint only
  if (categoryHints.length > 0) {
    const { data: fallbackData, error: fallbackError } = await sb
      .from('businesses')
      .select(`
        id,
        name_kr,
        name_en,
        category_main,
        category_sub,
        address,
        phone,
        rating,
        review_count,
        description_kr,
        is_vip,
        vip_tier
      `)
      .eq('is_active', true)
      .eq('category_main', categoryHints[0])
      .order('is_vip', { ascending: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .order('review_count', { ascending: false, nullsFirst: false })
      .limit(12)

    if (fallbackError) throw new Error(fallbackError.message)
    return fallbackData || []
  }

  return []
}

async function generateSummary(userQuery: string, businesses: BusinessRow[]) {
  if (!process.env.OPENAI_API_KEY) {
    return '추천 문장 생성을 위해 OPENAI_API_KEY가 필요합니다.'
  }

  const businessText = businesses
    .slice(0, 5)
    .map((b, i) => {
      return [
        `${i + 1}. ${b.name_kr || b.name_en || '이름 없음'}`,
        `카테고리: ${b.category_main || '-'}${b.category_sub ? ` / ${b.category_sub}` : ''}`,
        `평점: ${b.rating ?? '-'} / 리뷰수: ${b.review_count ?? '-'}`,
        `주소: ${b.address || '-'}`,
        `설명: ${b.description_kr || '-'}`,
        `VIP: ${b.is_vip ? `예(${b.vip_tier || 'vip'})` : '아니오'}`,
      ].join('\n')
    })
    .join('\n\n')

  const prompt = `
사용자 요청:
${userQuery}

후보 업소:
${businessText}

지시:
- 반드시 위 후보 업소만 근거로 추천 문장을 작성한다.
- 없는 사실을 만들지 않는다.
- 한국어로 3~5문장으로 간단히 작성한다.
- "가장 잘 맞는 곳", "무난한 선택", "VIP 우선 노출"처럼 비교해도 되지만 과장하지 않는다.
- 마지막 문장은 "아래 업소 리스트도 함께 확인하세요."로 끝낸다.
`

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: prompt,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI error: ${text}`)
  }

  const json = await response.json()

  return (
    json.output_text ||
    json.output?.[0]?.content?.[0]?.text ||
    '추천 문장을 생성하지 못했습니다.'
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const query = normalizeQuery(body?.query || '')

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      )
    }

    const businesses = await searchBusinesses(query)
    const summary =
      businesses.length > 0
        ? await generateSummary(query, businesses)
        : '조건에 맞는 업소를 찾지 못했습니다. 검색어를 조금 더 구체적으로 입력해 주세요.'

    return NextResponse.json({
      query,
      summary,
      businesses,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
