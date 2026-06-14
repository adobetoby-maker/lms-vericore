'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Plus, FileText, File, ChevronUp, ChevronDown, Trash2,
  Loader2, Volume2, Upload, ExternalLink,
} from 'lucide-react'

// TipTap — install: npm i @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder
// If not yet installed, this component will throw at runtime until packages are added.
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

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
  created_at: string
  updated_at: string
}

interface Props {
  courseId: number
  courseTitle: string
  initialSlides: SlideModule[]
}

export default function SlideDeckEditor({ courseId, initialSlides }: Props) {
  const [slides, setSlides] = useState<SlideModule[]>(initialSlides)
  const [selectedId, setSelectedId] = useState<string | null>(initialSlides[0]?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selected = slides.find(s => s.id === selectedId) ?? null

  // ── Persist helpers ────────────────────────────────────────────────────────

  async function patchSlide(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/slides/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const updated: SlideModule = await res.json()
    setSlides(prev => prev.map(s => s.id === id ? updated : s))
  }

  const scheduleContentSave = useCallback((id: string, content: Record<string, unknown>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = setTimeout(async () => {
      await patchSlide(id, { content })
      setSaving(false)
    }, 800)
  }, [])

  // ── TipTap editor ──────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your slide content…' }),
    ],
    content: selected?.slide_type === 'tiptap' ? (selected.content ?? { type: 'doc', content: [] }) : { type: 'doc', content: [] },
    onBlur: ({ editor: e }) => {
      if (!selectedId || selected?.slide_type !== 'tiptap') return
      scheduleContentSave(selectedId, e.getJSON() as Record<string, unknown>)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  })

  // Sync editor content when selected slide changes
  useEffect(() => {
    if (!editor || !selected) return
    if (selected.slide_type !== 'tiptap') return
    const current = JSON.stringify(editor.getJSON())
    const next = JSON.stringify(selected.content ?? { type: 'doc', content: [] })
    if (current !== next) {
      editor.commands.setContent(selected.content ?? { type: 'doc', content: [] })
    }
  }, [selectedId, editor, selected])

  // ── Slide CRUD ─────────────────────────────────────────────────────────────

  async function addSlide(type: 'tiptap' | 'pdf') {
    if (type === 'pdf') { fileInputRef.current?.click(); return }
    setAdding(true)
    const res = await fetch('/api/slides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId, title: `Slide ${slides.length + 1}`, slide_type: type }),
    })
    const slide: SlideModule = await res.json()
    setSlides(prev => [...prev, slide])
    setSelectedId(slide.id)
    setAdding(false)
  }

  async function deleteSlide(id: string) {
    if (!confirm('Delete this slide?')) return
    await fetch(`/api/slides/${id}`, { method: 'DELETE' })
    const remaining = slides.filter(s => s.id !== id)
    setSlides(remaining)
    if (selectedId === id) setSelectedId(remaining[0]?.id ?? null)
  }

  async function moveSlide(id: string, dir: -1 | 1) {
    const idx = slides.findIndex(s => s.id === id)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= slides.length) return

    const reordered = [...slides]
    ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]]

    // Update orders locally first for responsiveness
    const updated = reordered.map((s, i) => ({ ...s, slide_order: i }))
    setSlides(updated)

    // Persist both affected slides
    await Promise.all([
      patchSlide(updated[idx].id, { slide_order: updated[idx].slide_order }),
      patchSlide(updated[newIdx].id, { slide_order: updated[newIdx].slide_order }),
    ])
  }

  async function updateTitle(id: string, title: string) {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, title } : s))
    await patchSlide(id, { title })
  }

  async function toggleReadAloud(id: string, value: boolean) {
    await patchSlide(id, { read_aloud_enabled: value })
  }

  // ── PDF upload ─────────────────────────────────────────────────────────────

  async function uploadPdf(file: File) {
    if (file.type !== 'application/pdf') { alert('Only PDF files are supported.'); return }
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('course_id', String(courseId))
    fd.append('title', file.name.replace(/\.pdf$/i, ''))
    const res = await fetch('/api/slides/pdf-upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (json.slide) {
      setSlides(prev => [...prev, json.slide as SlideModule])
      setSelectedId(json.slide.id)
    }
    setUploading(false)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadPdf(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadPdf(file)
  }

  function getPdfUrl(path: string) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    return `${base}/storage/v1/object/public/slides/${path}`
  }

  // ── Toolbar ────────────────────────────────────────────────────────────────

  function ToolbarButton({ onClick, active, children, title }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    title: string
  }) {
    return (
      <button
        type="button"
        title={title}
        onClick={onClick}
        className="px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
        style={{
          background: active ? 'var(--accent)' : 'transparent',
          color: active ? 'var(--accent-fg)' : 'var(--text2)',
          border: '1px solid',
          borderColor: active ? 'var(--accent)' : 'var(--border)',
        }}
      >
        {children}
      </button>
    )
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
      {/* ── Left panel: slide list ─────────────────────────────────────────── */}
      <div
        className="w-64 shrink-0 flex flex-col rounded-xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text2)' }}>
            Slides
          </span>
          {saving && <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--text3)' }} />}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {slides.length === 0 && (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text3)' }}>
              No slides yet
            </p>
          )}
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              onClick={() => setSelectedId(slide.id)}
              className="group relative rounded-lg px-3 py-2.5 cursor-pointer transition-all"
              style={{
                background: selectedId === slide.id ? 'var(--bg2)' : 'transparent',
                border: '1px solid',
                borderColor: selectedId === slide.id ? 'var(--accent)' : 'transparent',
              }}
            >
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5" style={{ color: 'var(--text3)' }}>
                  {slide.slide_type === 'pdf'
                    ? <File className="w-3.5 h-3.5" />
                    : <FileText className="w-3.5 h-3.5" />}
                </span>
                <span
                  className="text-xs font-medium truncate flex-1 leading-snug"
                  style={{ color: selectedId === slide.id ? 'var(--text)' : 'var(--text2)' }}
                >
                  {slide.title}
                </span>
              </div>

              {/* Order controls + delete — show on hover or selected */}
              <div className="absolute right-1 top-1 hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={e => { e.stopPropagation(); moveSlide(slide.id, -1) }}
                  disabled={idx === 0}
                  className="p-0.5 rounded disabled:opacity-30 cursor-pointer"
                  style={{ color: 'var(--text3)' }}
                  title="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); moveSlide(slide.id, 1) }}
                  disabled={idx === slides.length - 1}
                  className="p-0.5 rounded disabled:opacity-30 cursor-pointer"
                  style={{ color: 'var(--text3)' }}
                  title="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deleteSlide(slide.id) }}
                  className="p-0.5 rounded cursor-pointer hover:text-red-400 transition-colors"
                  style={{ color: 'var(--text3)' }}
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add buttons */}
        <div className="p-2 border-t space-y-1.5" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => addSlide('tiptap')}
            disabled={adding}
            className="w-full flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer"
            style={{ background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)' }}
          >
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add Text Slide
          </button>
          <button
            onClick={() => addSlide('pdf')}
            disabled={uploading}
            className="w-full flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer"
            style={{ background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)' }}
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Add PDF Slide
          </button>
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={onFileChange} />
        </div>
      </div>

      {/* ── Right panel: editor ────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col rounded-xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--text3)' }}>
              Select a slide or create one to get started
            </p>
          </div>
        ) : (
          <>
            {/* Slide header */}
            <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
              <input
                type="text"
                value={selected.title}
                onChange={e => setSlides(prev => prev.map(s => s.id === selected.id ? { ...s, title: e.target.value } : s))}
                onBlur={e => updateTitle(selected.id, e.target.value)}
                className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
                style={{ color: 'var(--text)' }}
                placeholder="Slide title"
              />
              {/* Read aloud toggle */}
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--text3)' }} />
                <span className="text-xs" style={{ color: 'var(--text2)' }}>Read aloud</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={selected.read_aloud_enabled}
                  onClick={() => {
                    const next = !selected.read_aloud_enabled
                    setSlides(prev => prev.map(s => s.id === selected.id ? { ...s, read_aloud_enabled: next } : s))
                    toggleReadAloud(selected.id, next)
                  }}
                  className="relative w-9 h-5 rounded-full transition-colors cursor-pointer focus:outline-none"
                  style={{ background: selected.read_aloud_enabled ? 'var(--accent)' : 'var(--bg3)' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ transform: selected.read_aloud_enabled ? 'translateX(16px)' : 'translateX(0)' }}
                  />
                </button>
              </label>
            </div>

            {/* TipTap toolbar */}
            {selected.slide_type === 'tiptap' && editor && (
              <div className="px-3 py-2 border-b flex items-center gap-1 flex-wrap" style={{ borderColor: 'var(--border)' }}>
                <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>B</ToolbarButton>
                <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>I</ToolbarButton>
                <span className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
                <ToolbarButton title="H1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>H1</ToolbarButton>
                <ToolbarButton title="H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>H2</ToolbarButton>
                <ToolbarButton title="H3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>H3</ToolbarButton>
                <span className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
                <ToolbarButton title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>• List</ToolbarButton>
                <ToolbarButton title="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>1. List</ToolbarButton>
                <ToolbarButton title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>&ldquo;&rdquo;</ToolbarButton>
                <ToolbarButton title="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')}>{'</>'}</ToolbarButton>
              </div>
            )}

            {/* Editor body */}
            <div className="flex-1 overflow-y-auto">
              {selected.slide_type === 'tiptap' ? (
                <EditorContent editor={editor} className="h-full" />
              ) : (
                <div
                  className="h-full flex flex-col items-center justify-center gap-4 p-8"
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                >
                  {selected.pdf_path ? (
                    <div className="text-center space-y-3">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto"
                        style={{ background: 'var(--bg2)' }}
                      >
                        <File className="w-8 h-8" style={{ color: 'var(--accent)' }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {selected.pdf_file_name}
                      </p>
                      <a
                        href={getPdfUrl(selected.pdf_path)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm transition-colors"
                        style={{ color: 'var(--accent)' }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        View PDF
                      </a>
                      <div className="pt-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                          style={{ background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)' }}
                        >
                          Replace PDF
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed rounded-xl p-12 text-center transition-colors w-full max-w-md"
                      style={{
                        borderColor: dragOver ? 'var(--accent)' : 'var(--border)',
                        background: dragOver ? 'rgba(var(--accent), 0.05)' : 'transparent',
                      }}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text3)' }} />
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        Drop PDF here or click to upload
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text3)' }}>PDF files only</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="mt-4 text-xs font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors"
                        style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                      >
                        {uploading ? 'Uploading…' : 'Choose file'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
