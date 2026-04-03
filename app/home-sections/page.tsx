'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HomeSectionsAdmin() {
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data } = await sb
      .from('home_sections')
      .select('*')
      .order('sort_order', { ascending: true })

    setSections(data || [])
    setLoading(false)
  }

  const move = (index: number, direction: 'up' | 'down') => {
    const newList = [...sections]

    if (direction === 'up' && index > 0) {
      ;[newList[index - 1], newList[index]] = [newList[index], newList[index - 1]]
    }

    if (direction === 'down' && index < newList.length - 1) {
      ;[newList[index + 1], newList[index]] = [newList[index], newList[index + 1]]
    }

    setSections(newList)
  }

  const toggle = (index: number) => {
    const newList = [...sections]
    newList[index].is_enabled = !newList[index].is_enabled
    setSections(newList)
  }

  const save = async () => {
    for (let i = 0; i < sections.length; i++) {
      await sb
        .from('home_sections')
        .update({
          sort_order: i,
          is_enabled: sections[i].is_enabled,
        })
        .eq('id', sections[i].id)
    }

    alert('저장 완료')
  }

  if (loading) return <div className="p-4">로딩중...</div>

  return (
    <div className="max-w-lg mx-auto p-4 space-y-3">

      <h1 className="text-lg font-bold">홈 화면 구성 관리</h1>

      {sections.map((s, i) => (
        <div
          key={s.id}
          className="bg-white border rounded-lg p-3 flex items-center justify-between"
        >
          <div>
            <div className="font-bold text-sm">{s.section_label}</div>
            <div className="text-xs text-gray-400">{s.section_key}</div>
          </div>

          <div className="flex gap-2 items-center">

            <button onClick={() => move(i, 'up')} className="text-sm">⬆</button>
            <button onClick={() => move(i, 'down')} className="text-sm">⬇</button>

            <button
              onClick={() => toggle(i)}
              className={`px-2 py-1 text-xs rounded ${
                s.is_enabled ? 'bg-green-500 text-white' : 'bg-gray-300'
              }`}
            >
              {s.is_enabled ? 'ON' : 'OFF'}
            </button>

          </div>
        </div>
      ))}

      <button
        onClick={save}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold"
      >
        저장
      </button>

    </div>
  )
}
