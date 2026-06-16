'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

interface Course {
  id: number
  title: string
  description: string
  category: string
  subcategory: string | null
  difficulty: string
  duration_minutes: number
  is_featured: boolean
  thumbnail: string | null
  tags: string[] | null
  enrolled: boolean
  status: string | null
}

interface CatalogData {
  categories: string[]
  courses: Course[]
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: 'rgba(34,197,94,0.15)',  text: '#16a34a' },
  Intermediate: { bg: 'rgba(245,158,11,0.15)', text: '#d97706' },
  Advanced:     { bg: 'rgba(239,68,68,0.15)',  text: '#dc2626' },
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = DIFFICULTY_COLORS[difficulty] ?? { bg: 'var(--bg3)', text: 'var(--text2)' }
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: colors.bg, color: colors.text }}
    >
      {difficulty}
    </span>
  )
}

function CourseCard({
  course,
  onEnroll,
  enrolling,
}: {
  course: Course
  onEnroll: (id: number) => void
  enrolling: boolean
}) {
  return (
    <div
      className="rounded-xl flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
      style={{
        background: 'var(--card)',
        border: `1px solid ${course.is_featured ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      {/* Header */}
      <div
        className="p-5 flex items-start gap-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl"
          style={{ background: 'var(--bg3)' }}
        >
          {course.thumbnail ?? '📚'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2 flex-wrap mb-1">
            {course.is_featured && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                Featured
              </span>
            )}
          </div>
          <h3 className="font-semibold text-sm leading-snug" style={{ color: 'var(--text)' }}>
            {course.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text3)' }}>
              {course.category}
            </span>
            {course.subcategory && (
              <>
                <span className="text-xs" style={{ color: 'var(--text3)' }}>·</span>
                <span className="text-xs" style={{ color: 'var(--text3)' }}>
                  {course.subcategory}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <p
          className="text-sm leading-relaxed mb-4 flex-1"
          style={{
            color: 'var(--text2)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {course.description}
        </p>

        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <DifficultyBadge difficulty={course.difficulty} />
            <span className="text-xs" style={{ color: 'var(--text3)' }}>
              {course.duration_minutes} min
            </span>
          </div>
        </div>

        {/* CTA */}
        {course.enrolled ? (
          <Link
            href={`/course/${course.id}`}
            className="block text-center text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            Continue →
          </Link>
        ) : (
          <button
            onClick={() => onEnroll(course.id)}
            disabled={enrolling}
            className="w-full text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            {enrolling ? 'Enrolling…' : 'Enroll'}
          </button>
        )}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl overflow-hidden animate-pulse"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="p-5 flex items-start gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-14 h-14 rounded-xl flex-shrink-0" style={{ background: 'var(--bg3)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded w-3/4" style={{ background: 'var(--bg3)' }} />
          <div className="h-3 rounded w-1/2" style={{ background: 'var(--bg3)' }} />
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="h-3 rounded w-full" style={{ background: 'var(--bg3)' }} />
        <div className="h-3 rounded w-5/6" style={{ background: 'var(--bg3)' }} />
        <div className="h-8 rounded mt-4" style={{ background: 'var(--bg3)' }} />
      </div>
    </div>
  )
}

export default function CatalogClient() {
  const [data, setData] = useState<CatalogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [enrollingIds, setEnrollingIds] = useState<Set<number>>(new Set())
  const [seeding, setSeeding] = useState(false)

  const fetchCatalog = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/catalog')
      if (!res.ok) throw new Error('Failed to load catalog')
      const json = await res.json() as CatalogData
      setData(json)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchCatalog() }, [])

  const handleEnroll = async (courseId: number) => {
    setEnrollingIds(prev => new Set(prev).add(courseId))
    try {
      const res = await fetch('/api/catalog/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      })
      if (!res.ok) throw new Error('Enrollment failed')
      // Optimistic update
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          courses: prev.courses.map(c =>
            c.id === courseId ? { ...c, enrolled: true, status: 'in_progress' } : c
          ),
        }
      })
    } catch {
      // silent — user can retry
    } finally {
      setEnrollingIds(prev => {
        const next = new Set(prev)
        next.delete(courseId)
        return next
      })
    }
  }

  const handleSeedDemo = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/courses/seed-mlm', { method: 'POST' })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        throw new Error(json.error ?? 'Seed failed')
      }
      await fetchCatalog()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Seed failed')
    } finally {
      setSeeding(false)
    }
  }

  const allCategories = ['All', ...(data?.categories ?? [])]

  const filtered = useMemo(() => {
    if (!data) return []
    const q = search.toLowerCase().trim()
    return data.courses.filter(c => {
      const matchCat = activeCategory === 'All' || c.category === activeCategory
      const matchSearch = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [data, search, activeCategory])

  const featured = useMemo(() => filtered.filter(c => c.is_featured), [filtered])
  const nonFeatured = useMemo(() => filtered.filter(c => !c.is_featured), [filtered])
  const hasCatalog = (data?.courses.length ?? 0) > 0

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          Course Catalog
        </h1>
        <p className="text-base" style={{ color: 'var(--text2)' }}>
          Browse and enroll in courses
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search courses…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:max-w-sm px-4 py-2 rounded-lg text-sm outline-none"
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
      </div>

      {/* Category tabs */}
      {hasCatalog && (
        <div className="flex flex-wrap gap-2 mb-8">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="text-sm px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer"
              style={
                activeCategory === cat
                  ? { background: 'var(--accent)', color: 'var(--accent-fg)' }
                  : { background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mb-6 px-4 py-3 rounded-lg text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state — no catalog courses yet */}
      {!loading && !error && !hasCatalog && (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
            No courses yet
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>
            Load the demo MLM course library to get started.
          </p>
          <button
            onClick={handleSeedDemo}
            disabled={seeding}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            {seeding ? 'Loading…' : 'Load Demo Courses'}
          </button>
        </div>
      )}

      {/* Featured strip */}
      {!loading && !error && hasCatalog && featured.length > 0 && (
        <section className="mb-10">
          <div
            className="rounded-xl p-1 mb-4"
            style={{ background: 'var(--accent)', display: 'inline-block' }}
          >
            <span className="text-xs font-bold px-3 py-1" style={{ color: 'var(--accent-fg)' }}>
              Required for All Distributors
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onEnroll={handleEnroll}
                enrolling={enrollingIds.has(course.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* All other courses */}
      {!loading && !error && hasCatalog && nonFeatured.length > 0 && (
        <section>
          {featured.length > 0 && (
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              All Courses
            </h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {nonFeatured.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onEnroll={handleEnroll}
                enrolling={enrollingIds.has(course.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* No results from filter */}
      {!loading && !error && hasCatalog && filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: 'var(--text2)' }}>
            No courses match your search.{' '}
            <button
              onClick={() => { setSearch(''); setActiveCategory('All') }}
              className="underline cursor-pointer"
              style={{ color: 'var(--accent)' }}
            >
              Clear filters
            </button>
          </p>
        </div>
      )}
    </main>
  )
}
