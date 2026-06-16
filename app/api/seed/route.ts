import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { COMPLIANCE_TEMPLATES } from '@/lib/compliance-templates'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const isDev = process.env.NODE_ENV === 'development'
  const SEED_SECRET = process.env.SEED_SECRET
  const providedSecret = new URL(request.url).searchParams.get('secret')
  if (!isDev) {
    if (!SEED_SECRET || providedSecret !== SEED_SECRET) {
      return new Response('Not found', { status: 404 })
    }
  }

  const log: string[] = []

  const DEMO_STAFF = [
    { email: 'admin@ncmc-demo.com', password: 'Demo1234!', first: 'Sarah', last: 'Mitchell', is_admin: true, dept: 'Administration' },
    { email: 'rn1@ncmc-demo.com', password: 'Demo1234!', first: 'James', last: 'Torres', is_admin: false, dept: 'Emergency' },
    { email: 'rn2@ncmc-demo.com', password: 'Demo1234!', first: 'Emily', last: 'Chen', is_admin: false, dept: 'Med/Surg' },
    { email: 'cna1@ncmc-demo.com', password: 'Demo1234!', first: 'Marcus', last: 'Rivera', is_admin: false, dept: 'Long-Term Care' },
    { email: 'billing@ncmc-demo.com', password: 'Demo1234!', first: 'Linda', last: 'Park', is_admin: false, dept: 'Billing' },
  ]

  const HEALTHCARE_TEMPLATE_IDS = [
    'hipaa-privacy-security',
    'infection-control',
    'patient-rights-grievances',
    'workplace-safety-healthcare',
    'mandatory-reporter',
  ]

  const COURSE_VIDEOS: Record<string, { title: string; url: string; duration_seconds: number }[]> = {
    'hipaa-privacy-security': [
      { title: 'HIPAA Basics for Healthcare Workers', url: 'https://www.youtube.com/watch?v=SouvU7mQL2o', duration_seconds: 720 },
      { title: 'HHS: Understanding HIPAA Privacy', url: 'https://www.youtube.com/watch?v=e1N9H9GQKL0', duration_seconds: 540 },
    ],
    'infection-control': [
      { title: 'WHO: Hand Hygiene — Why, How and When?', url: 'https://www.youtube.com/watch?v=3PmVJQUCm4E', duration_seconds: 484 },
      { title: 'CDC: Donning and Doffing PPE', url: 'https://www.youtube.com/watch?v=ec-XwgH_TwE', duration_seconds: 360 },
    ],
    'patient-rights-grievances': [
      { title: 'Patient Rights and Responsibilities', url: 'https://www.youtube.com/watch?v=cV6tqXfqjKA', duration_seconds: 480 },
      { title: 'Informed Consent in Healthcare', url: 'https://www.youtube.com/watch?v=SLjZdhLzBX4', duration_seconds: 420 },
    ],
    'workplace-safety-healthcare': [
      { title: 'OSHA: Bloodborne Pathogens in Healthcare', url: 'https://www.youtube.com/watch?v=DGUdCVGPbr8', duration_seconds: 600 },
      { title: 'Safe Patient Handling and Mobility', url: 'https://www.youtube.com/watch?v=LlHKAXHfL0M', duration_seconds: 540 },
    ],
    'mandatory-reporter': [
      { title: 'Mandatory Reporting: What Healthcare Workers Need to Know', url: 'https://www.youtube.com/watch?v=5K8wRp8Yupw', duration_seconds: 480 },
      { title: 'Recognizing and Reporting Elder Abuse', url: 'https://www.youtube.com/watch?v=qBzH5HHbmio', duration_seconds: 420 },
    ],
  }

  try {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userMap: Record<string, string> = {}

    for (const staff of DEMO_STAFF) {
      const existing = existingUsers.users.find(u => u.email === staff.email)
      let userId: string
      if (existing) {
        userId = existing.id
        log.push(`User exists: ${staff.email}`)
      } else {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: staff.email, password: staff.password, email_confirm: true,
          user_metadata: { first_name: staff.first, last_name: staff.last },
        })
        if (error) throw new Error(`User ${staff.email}: ${error.message}`)
        userId = data.user.id
        log.push(`Created user: ${staff.email}`)
      }
      await supabaseAdmin.from('profiles').upsert({
        id: userId, first_name: staff.first, last_name: staff.last, is_admin: staff.is_admin,
      })
      userMap[staff.email] = userId
    }

    const { data: existingCourses } = await supabaseAdmin.from('courses').select('id, title')
    const courseIds: number[] = []

    if (existingCourses && existingCourses.length >= HEALTHCARE_TEMPLATE_IDS.length) {
      log.push(`${existingCourses.length} courses already seeded.`)
      courseIds.push(...existingCourses.map((c: { id: number }) => c.id))
    } else {
      for (const templateId of HEALTHCARE_TEMPLATE_IDS) {
        const template = COMPLIANCE_TEMPLATES.find(t => t.id === templateId)
        if (!template) { log.push(`Template not found: ${templateId}`); continue }

        const { data: course, error } = await supabaseAdmin
          .from('courses')
          .insert({ title: template.title, description: template.description, tags: template.tags, is_active: true })
          .select('id').single()
        if (error) throw new Error(`Course ${templateId}: ${error.message}`)

        const videos = COURSE_VIDEOS[templateId] || []
        if (videos.length) {
          await supabaseAdmin.from('videos').insert(
            videos.map((v, i) => ({ ...v, course_id: course.id, sort_order: i + 1, ytId: null }))
          )
        }
        await supabaseAdmin.from('questions').insert(
          template.questions.map(q => ({ ...q, course_id: course.id }))
        )
        courseIds.push(course.id)
        log.push(`Seeded course: ${template.title}`)
      }
    }

    // Enroll all non-admin staff in all courses with realistic completion states
    const learners = DEMO_STAFF.filter(s => !s.is_admin)
    const completionMatrix: Record<string, 'passed' | 'in_progress' | 'invited'> = {
      'rn1@ncmc-demo.com': 'passed',
      'rn2@ncmc-demo.com': 'passed',
      'cna1@ncmc-demo.com': 'in_progress',
      'billing@ncmc-demo.com': 'invited',
    }

    for (const learner of learners) {
      const uid = userMap[learner.email]
      if (!uid) continue
      const status = completionMatrix[learner.email] || 'invited'
      for (const courseId of courseIds) {
        await supabaseAdmin.from('enrollments').upsert({
          user_id: uid, course_id: courseId, status,
          ...(status === 'passed' ? { completed_at: new Date().toISOString(), video_watched: true } : {}),
        })
      }
      log.push(`Enrolled ${learner.email} (${status})`)
    }

    return NextResponse.json({ ok: true, log,
      demo: {
        admin: 'admin@ncmc-demo.com / Demo1234!',
        learner: 'rn1@ncmc-demo.com / Demo1234!',
        courses: courseIds.length,
      }
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err), log }, { status: 500 })
  }
}
