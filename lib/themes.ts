export type ThemeId = 'vericore' | 'vericore-light' | 'midnight' | 'slate'
export type ColorMode = 'dark' | 'light'

export interface Theme {
  id: ThemeId
  name: string
  mode: ColorMode
  preview: string
  vars: Record<string, string>
}

export const THEMES: Theme[] = [
  {
    // Vericore brand — deep forest black + teal (extracted from vericorecg.com)
    id: 'vericore',
    name: 'Vericore',
    mode: 'dark',
    preview: '#00e5a0',
    vars: {
      '--bg':        '#061510',
      '--bg2':       '#0d1f18',
      '--bg3':       '#152b21',
      '--border':    'rgba(0,229,160,0.12)',
      '--text':      '#d8ece3',
      '--text2':     'rgba(216,236,227,0.6)',
      '--text3':     'rgba(216,236,227,0.35)',
      '--accent':    '#00e5a0',
      '--accent-h':  '#00c98a',
      '--accent-fg': '#061510',
      '--card':      'rgba(13,31,24,0.85)',
      '--input-bg':  '#061510',
    },
  },
  {
    // Vericore light — cream + sage
    id: 'vericore-light',
    name: 'Vericore Light',
    mode: 'light',
    preview: '#00c98a',
    vars: {
      '--bg':        '#f2f9f6',
      '--bg2':       '#ffffff',
      '--bg3':       '#e4f2eb',
      '--border':    'rgba(0,0,0,0.1)',
      '--text':      '#061510',
      '--text2':     'rgba(6,21,16,0.6)',
      '--text3':     'rgba(6,21,16,0.4)',
      '--accent':    '#00a870',
      '--accent-h':  '#008f5e',
      '--accent-fg': '#ffffff',
      '--card':      'rgba(255,255,255,0.95)',
      '--input-bg':  '#ffffff',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    mode: 'dark',
    preview: '#4f46e5',
    vars: {
      '--bg':        '#0a0a18',
      '--bg2':       '#1a1a2e',
      '--bg3':       '#252545',
      '--border':    'rgba(255,255,255,0.08)',
      '--text':      '#f2f2f7',
      '--text2':     'rgba(235,235,245,0.6)',
      '--text3':     'rgba(235,235,245,0.3)',
      '--accent':    '#4f46e5',
      '--accent-h':  '#4338ca',
      '--accent-fg': '#ffffff',
      '--card':      'rgba(26,26,46,0.8)',
      '--input-bg':  '#0a0a18',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    mode: 'dark',
    preview: '#3b82f6',
    vars: {
      '--bg':        '#0d1117',
      '--bg2':       '#161b22',
      '--bg3':       '#21262d',
      '--border':    'rgba(255,255,255,0.1)',
      '--text':      '#e6edf3',
      '--text2':     'rgba(230,237,243,0.6)',
      '--text3':     'rgba(230,237,243,0.3)',
      '--accent':    '#3b82f6',
      '--accent-h':  '#2563eb',
      '--accent-fg': '#ffffff',
      '--card':      'rgba(22,27,34,0.9)',
      '--input-bg':  '#0d1117',
    },
  },
]

export function getTheme(id: ThemeId): Theme {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}

export function applyTheme(theme: Theme, el: HTMLElement = document.documentElement) {
  for (const [k, v] of Object.entries(theme.vars)) {
    el.style.setProperty(k, v)
  }
  el.setAttribute('data-theme', theme.id)
  el.setAttribute('data-mode', theme.mode)
}
