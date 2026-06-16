import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CATEGORY_ORDER = [
  'Compliance',
  'Product Knowledge',
  'Sales Skills',
  'Recruiting',
  'Operations',
  'Social Media',
  'Leadership',
  'Quick Skills',
]

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [coursesRes, enrollmentsRes] = await Promise.all([
      supabase
        .from('courses')
        .select('id, title, description, category, subcategory, difficulty, duration_minutes, is_featured, thumbnail, tags')
        .eq('catalog_visible', true)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('title', { ascending: true }),
      supabase
        .from('enrollments')
        .select('course_id, status')
        .eq('user_id', user.id),
    ])

    if (coursesRes.error) throw new Error(coursesRes.error.message)

    const enrollmentMap = new Map<number, string>(
      (enrollmentsRes.data ?? []).map(e => [e.course_id as number, e.status as string])
    )

    const courses = (coursesRes.data ?? []).map(c => ({
      id: c.id as number,
      title: c.title as string,
      description: c.description as string,
      category: c.category as string,
      subcategory: c.subcategory as string | null,
      difficulty: c.difficulty as string,
      duration_minutes: c.duration_minutes as number,
      is_featured: c.is_featured as boolean,
      thumbnail: c.thumbnail as string | null,
      tags: c.tags as string[] | null,
      enrolled: enrollmentMap.has(c.id as number),
      status: enrollmentMap.get(c.id as number) ?? null,
    }))

    // Collect all unique categories in the preferred order
    const presentCategories = new Set(courses.map(c => c.category))
    const categories = CATEGORY_ORDER.filter(cat => presentCategories.has(cat))
    // Append any categories not in the predefined order
    for (const cat of presentCategories) {
      if (!CATEGORY_ORDER.includes(cat)) categories.push(cat)
    }

    return NextResponse.json({ categories, courses })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
