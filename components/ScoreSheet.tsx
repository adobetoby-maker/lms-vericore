'use client'

import { ExternalLink } from 'lucide-react'

interface ScoreItem {
  label: string
  score: number
  color: string
  trackColor: string
}

const SCORES: ScoreItem[] = [
  { label: 'SEO',          score: 86,  color: '#06b6d4', trackColor: 'rgba(6,182,212,0.15)' },
  { label: 'Security',     score: 100, color: '#10b981', trackColor: 'rgba(16,185,129,0.15)' },
  { label: 'Performance',  score: 88,  color: '#f59e0b', trackColor: 'rgba(245,158,11,0.15)' },
  { label: 'Overall',      score: 91,  color: '#818cf8', trackColor: 'rgba(129,140,248,0.15)' },
]

function ScoreRing({ score, color, trackColor, label }: ScoreItem) {
  const r = 22
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 52 52" className="w-full h-full -rotate-90">
          <circle cx="26" cy="26" r={r} fill="none" stroke={trackColor} strokeWidth="5" />
          <circle
            cx="26" cy="26" r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${fill} ${circ}`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color }}>
          {score}
        </span>
      </div>
      <span className="text-xs" style={{ color: 'var(--text3)' }}>{label}</span>
    </div>
  )
}

export function ScoreSheet() {
  return (
    <div className="mt-6 rounded-xl p-4" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: 'var(--text3)' }}>
          Site quality · evaluated by
        </span>
        <a
          href="https://manage.worker-bee.app/evaluate"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs transition-opacity hover:opacity-80"
          style={{ color: 'var(--accent)' }}
        >
          worker-bee.app
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="flex items-center justify-around">
        {SCORES.map(s => <ScoreRing key={s.label} {...s} />)}
      </div>

      <div className="mt-3 pt-3 flex flex-wrap gap-x-3 gap-y-1" style={{ borderTop: '1px solid var(--border)' }}>
        {[
          { label: '✓ HTTPS', ok: true },
          { label: '✓ CSP', ok: true },
          { label: '✓ HSTS', ok: true },
          { label: '✓ robots.txt', ok: true },
          { label: '✓ sitemap.xml', ok: true },
          { label: '✓ OG tags', ok: true },
        ].map(item => (
          <span key={item.label} className="text-xs" style={{ color: item.ok ? '#10b981' : '#f87171' }}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
