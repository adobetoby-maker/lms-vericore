'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { THEMES, applyTheme, type ThemeId } from '@/lib/themes'

interface ThemeCtx {
  themeId: ThemeId
  setThemeId: (id: ThemeId) => void
}

const Ctx = createContext<ThemeCtx>({ themeId: 'midnight', setThemeId: () => {} })

// Injected at runtime so Tailwind's build-time CSS parser never sees the escaped selectors
const DARK_OVERRIDES = `
  .bg-\\[#0a0a18\\]               { background: var(--bg)  !important; }
  .bg-\\[#1a1a2e\\]               { background: var(--bg2) !important; }
  .bg-\\[#252545\\]               { background: var(--bg3) !important; }
  .hover\\:bg-\\[#252545\\]:hover  { background: var(--bg3) !important; }
  .border-\\[#2a2a4a\\]           { border-color: var(--border) !important; }
  .border-\\[#1a1a2e\\]           { border-color: var(--border) !important; }
  .divide-\\[#2a2a4a\\] > :not(:first-child),
  .divide-\\[#2a2a4a\\]\\/50 > :not(:first-child) { border-color: var(--border) !important; }
`

const LIGHT_TEXT_OVERRIDES = `
  .text-white                              { color: var(--text)  !important; }
  .text-slate-100, .text-slate-200, .text-slate-300 { color: var(--text2) !important; }
  .text-slate-400, .text-slate-500, .text-slate-600 { color: var(--text3) !important; }
  .placeholder-slate-500::placeholder,
  .placeholder-slate-600::placeholder     { color: var(--text3) !important; }
  /* Keep button/badge text white on light themes */
  button.text-white                        { color: #ffffff !important; }
  [class*="bg-indigo-"].text-white         { color: #ffffff !important; }
  [class*="bg-emerald-"].text-white        { color: #ffffff !important; }
  [class*="bg-red-"].text-white            { color: #ffffff !important; }
  [class*="bg-amber-"].text-white          { color: #ffffff !important; }
  [class*="bg-sky-"].text-white            { color: #ffffff !important; }
  [class*="bg-indigo-"] .text-white        { color: #ffffff !important; }
  [class*="bg-emerald-"] .text-white       { color: #ffffff !important; }
  [class*="bg-red-"] .text-white           { color: #ffffff !important; }
`

function injectOverrides(mode: 'dark' | 'light') {
  let el = document.getElementById('lms-theme-overrides')
  if (!el) {
    el = document.createElement('style')
    el.id = 'lms-theme-overrides'
    document.head.appendChild(el)
  }
  el.textContent = DARK_OVERRIDES + (mode === 'light' ? LIGHT_TEXT_OVERRIDES : '')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>('midnight')

  useEffect(() => {
    const saved = localStorage.getItem('lms-theme') as ThemeId | null
    const id = THEMES.find(t => t.id === saved) ? saved! : 'midnight'
    const theme = THEMES.find(t => t.id === id)!
    setThemeIdState(id)
    applyTheme(theme)
    injectOverrides(theme.mode)
  }, [])

  function setThemeId(id: ThemeId) {
    const theme = THEMES.find(t => t.id === id)!
    setThemeIdState(id)
    localStorage.setItem('lms-theme', id)
    // Also persist in cookie so SSR can read it and inject overrides before hydration
    document.cookie = `lms-theme=${id}; path=/; max-age=31536000; SameSite=Lax`
    applyTheme(theme)
    injectOverrides(theme.mode)
  }

  return <Ctx.Provider value={{ themeId, setThemeId }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
