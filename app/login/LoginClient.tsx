'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { THEMES, type ThemeId } from '@/lib/themes'
import { ScoreSheet } from '@/components/ScoreSheet'
import brand from '@/lib/brand'
import type { Messages } from '@/lib/i18n/translations'
import { t } from '@/lib/i18n/translations'

interface Props {
  messages: Messages
  locale: 'en' | 'es'
}

// Demo credentials only available when NEXT_PUBLIC_ENABLE_DEMO=true — never set this in production client deployments
const ENABLE_DEMO  = process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true'
const DEMO_LEARNER = { email: 'learner@demo.com', password: 'Learner123!' }
const DEMO_ADMIN   = { email: 'admin@demo.com',   password: 'Admin123!' }

export default function LoginClient({ messages, locale }: Props) {
  const { themeId, setThemeId } = useTheme()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async function signIn(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(t(messages, 'login.error_invalid')); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  async function fillDemo(type: 'learner' | 'admin') {
    const creds = type === 'admin' ? DEMO_ADMIN : DEMO_LEARNER
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword(creds)
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  function toggleLocale() {
    const next = locale === 'en' ? 'es' : 'en'
    document.cookie = `locale=${next}; path=/; max-age=31536000`
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">

        {/* Brand logo */}
        <div className="flex flex-col items-center mb-8">
          {brand.logoPath.endsWith('.svg') || brand.logoPath.startsWith('http') ? (
            <Image
              src={brand.logoPath}
              alt={brand.logoAlt}
              width={180}
              height={52}
              className="mb-4"
              style={{ filter: themeId === 'vericore' ? 'brightness(1)' : 'none' }}
              priority
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                 style={{ background: 'var(--accent)' }}>
              <span className="text-xl font-bold" style={{ color: 'var(--accent-fg)' }}>
                {brand.name[0]}
              </span>
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight text-center" style={{ color: 'var(--text)' }}>
            {brand.name}
          </h1>
          <p className="text-xs mt-1 text-center max-w-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
            {brand.tagline}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-2xl card-theme">

          {/* Theme swatches + lang toggle */}
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setThemeId(theme.id as ThemeId)}
                  className={`swatch${themeId === theme.id ? ' active' : ''}`}
                  style={{ background: theme.preview }}
                  title={theme.name}
                  aria-label={`Switch to ${theme.name} theme`}
                />
              ))}
            </div>
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}
            >
              <span>{locale === 'en' ? '🇺🇸' : '🇲🇽'}</span>
              <span>{locale === 'en' ? 'EN' : 'ES'}</span>
            </button>
          </div>

          <h2 className="text-xl font-semibold mb-5" style={{ color: 'var(--text)' }}>
            {t(messages, 'login.welcome')}
          </h2>

          <form onSubmit={signIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text2)' }}>
                {t(messages, 'login.email')}
              </label>
              <input
                type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder={t(messages, 'login.email_placeholder')}
                className="input-theme w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text2)' }}>
                {t(messages, 'login.password')}
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="input-theme w-full rounded-xl px-4 py-3 text-sm pr-11"
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: 'var(--text3)' }}>
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2" style={{ color: '#f87171' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold cursor-pointer transition-all disabled:opacity-60"
              style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />{t(messages, 'login.signing_in')}
                  </span>
                : t(messages, 'login.sign_in')}
            </button>
          </form>

          {/* Demo buttons — only shown when NEXT_PUBLIC_ENABLE_DEMO=true */}
          {ENABLE_DEMO && (
            <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs text-center mb-3" style={{ color: 'var(--text3)' }}>
                {t(messages, 'login.demo_access')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['learner', 'admin'] as const).map(type => (
                  <button key={type} onClick={() => fillDemo(type)} disabled={loading}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer transition-all disabled:opacity-60"
                    style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                    {t(messages, `login.${type}_demo`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-center mt-5" style={{ color: 'var(--text3)' }}>
            {t(messages, 'login.no_account')}
          </p>

          <ScoreSheet />
        </div>
      </div>
    </div>
  )
}
