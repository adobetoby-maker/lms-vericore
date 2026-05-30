'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

interface Props { locale: 'en' | 'es'; pathname: string }

export function LangToggle({ locale, pathname }: Props) {
  const router = useRouter()
  const [, start] = useTransition()

  function toggle() {
    const next = locale === 'en' ? 'es' : 'en'
    document.cookie = `locale=${next}; path=/; max-age=31536000`
    start(() => router.refresh())
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
      style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}
    >
      <span className="text-base">{locale === 'en' ? '🇺🇸' : '🇲🇽'}</span>
      <span>{locale === 'en' ? 'English' : 'Español'}</span>
    </button>
  )
}
