'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react'
import DOMPurify from 'dompurify'

// TipTap — install: npm i @tiptap/react @tiptap/pm @tiptap/starter-kit
// generateHTML requires @tiptap/html (bundled with @tiptap/react in v2)
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'

interface SlideModule {
  id: string
  course_id: number
  title: string
  slide_type: 'tiptap' | 'pdf'
  content: Record<string, unknown> | null
  pdf_path: string | null
  pdf_file_name: string | null
  slide_order: number
  read_aloud_enabled: boolean
}

interface Props {
  slides: SlideModule[]
  courseId: number
  onComplete?: () => void
}

function extractText(content: Record<string, unknown> | null): string {
  if (!content) return ''
  try {
    const html = generateHTML(content as Parameters<typeof generateHTML>[0], [StarterKit])
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  } catch {
    return ''
  }
}

function getPdfUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${base}/storage/v1/object/public/slides/${path}`
}

export default function SlideViewer({ slides, courseId, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [completeCalled, setCompleteCalled] = useState(false)

  const slide = slides[index]
  const total = slides.length
  const isLast = index === total - 1

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  useEffect(() => {
    if (speaking) window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [index])

  function goNext() {
    if (index < total - 1) {
      setIndex(i => i + 1)
    } else if (!completeCalled) {
      setCompleteCalled(true)
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      })
      onComplete?.()
    }
  }

  function goPrev() {
    if (index > 0) setIndex(i => i - 1)
  }

  function toggleReadAloud() {
    if (speaking) {
      window.speechSynthesis?.cancel()
      setSpeaking(false)
      return
    }
    const text = slide.slide_type === 'tiptap'
      ? extractText(slide.content)
      : slide.pdf_file_name ?? slide.title
    if (!text) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utter)
    setSpeaking(true)
  }

  if (total === 0) return null

  // Sanitize after generating so any HTML that slipped through the editor cannot execute
  const safeHtml = useMemo(() => {
    if (slide.slide_type !== 'tiptap') return ''
    try {
      const raw = generateHTML(
        (slide.content ?? { type: 'doc', content: [] }) as Parameters<typeof generateHTML>[0],
        [StarterKit],
      )
      return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
    } catch {
      return ''
    }
  }, [slide.id, slide.content, slide.slide_type])

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: 'var(--bg3)' }}>
        <div
          className="h-full transition-all duration-300"
          style={{ background: 'var(--accent)', width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>{slide.title}</h3>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs" style={{ color: 'var(--text3)' }}>
            {index + 1} / {total}
          </span>
          {slide.read_aloud_enabled && (
            <button
              onClick={toggleReadAloud}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{
                background: speaking ? 'var(--accent)' : 'var(--bg2)',
                color: speaking ? 'var(--accent-fg)' : 'var(--text2)',
              }}
              title={speaking ? 'Stop reading' : 'Read aloud'}
            >
              {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Slide content */}
      <div className="min-h-[320px] p-6">
        {slide.slide_type === 'tiptap' ? (
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[280px] gap-4">
            {slide.pdf_path ? (
              <>
                <iframe
                  src={getPdfUrl(slide.pdf_path)}
                  className="w-full rounded-lg"
                  style={{ height: '500px', border: '1px solid var(--border)' }}
                  title={slide.title}
                />
                <a
                  href={getPdfUrl(slide.pdf_path)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm transition-colors"
                  style={{ color: 'var(--accent)' }}
                >
                  Open PDF in new tab ↗
                </a>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text3)' }}>No PDF uploaded yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div
        className="px-5 py-4 border-t flex items-center justify-between"
        style={{ borderColor: 'var(--border)' }}
      >
        <button
          onClick={goPrev}
          disabled={index === 0}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
          style={{ background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <button
          onClick={goNext}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          {isLast ? 'Mark Complete' : 'Next'}
          {!isLast && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
