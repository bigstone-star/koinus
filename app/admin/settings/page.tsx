'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      setMessage('')

      const { data: authData } = await sb.auth.getUser()
      const user = authData.user

      if (!user) {
        window.location.href = '/auth/login'
        return
      }

      const { data: profile, error: profileError } = await sb
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        setErrorMsg('권한 정보를 불러오지 못했습니다.')
        return
      }

      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        window.location.href = '/'
        return
      }

      setUserRole(profile.role)

      const { data: settingData, error: settingError } = await sb
        .from('settings')
        .select('value')
        .eq('key', 'logo_url')
        .maybeSingle()

      if (settingError) {
        setErrorMsg('현재 로고 정보를 불러오지 못했습니다.')
        return
      }

      setLogoUrl(settingData?.value || '')
    } catch (error) {
      setErrorMsg('설정 화면을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file: File) => {
    try {
      setSaving(true)
      setErrorMsg('')
      setMessage('')

      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const fileName = `logo-${Date.now()}.${ext}`

      const { error: uploadError } = await sb.storage
        .from('assets')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type || 'image/png',
        })

      if (uploadError) {
        setErrorMsg(`업로드 실패: ${uploadError.message}`)
        return
      }

      const { data: publicUrlData } = sb.storage
        .from('assets')
        .getPublicUrl(fileName)

      const nextUrl = publicUrlData.publicUrl

      const { error: upsertError } = await sb
        .from('settings')
        .upsert({
          key: 'logo_url',
          value: nextUrl,
          updated_at: new Date().toISOString(),
        })

      if (upsertError) {
        setErrorMsg(`저장 실패: ${upsertError.message}`)
        return
      }

      setLogoUrl(nextUrl)
      setMessage('로고가 저장되었습니다.')
    } catch (error) {
      setErrorMsg('로고 업로드 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMsg('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    await handleUpload(file)

    e.target.value = ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-3xl mx-auto pb-10">
      <div className="bg-[#1a1a2e] px-5 pt-10 pb-6">
        <h1 className="text-[22px] font-extrabold text-white">사이트 설정</h1>
        <p className="text-white/50 text-[12px] mt-1">
          로고 업로드 및 기본 사이트 자산 관리
        </p>
      </div>

      <div className="px-4 pt-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-[16px] font-bold text-slate-800">
                로고 관리
              </div>
              <div className="text-[12px] text-slate-400 mt-1">
                PNG, JPG, WEBP 권장
              </div>
            </div>

            {userRole && (
              <div className="text-[11px] px-2 py-1 rounded bg-slate-100 text-slate-500 font-bold">
                {userRole}
              </div>
            )}
          </div>

          {logoUrl ? (
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[12px] font-bold text-slate-500 mb-3">
                현재 로고 미리보기
              </div>
              <img
                src={logoUrl}
                alt="Current Logo"
                className="max-h-20 w-auto object-contain"
              />
              <div className="mt-3 text-[11px] text-slate-400 break-all">
                {logoUrl}
              </div>
            </div>
          ) : (
            <div className="mb-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-400">
              아직 등록된 로고가 없습니다.
            </div>
          )}

          <label className="inline-flex items-center justify-center px-4 py-3 rounded-xl bg-indigo-600 text-white text-[13px] font-bold cursor-pointer hover:bg-indigo-700 transition">
            {saving ? '업로드 중...' : '로고 파일 업로드'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={saving}
            />
          </label>

          {message && (
            <div className="mt-4 text-[13px] font-bold text-emerald-600">
              {message}
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 text-[13px] font-bold text-red-600">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
