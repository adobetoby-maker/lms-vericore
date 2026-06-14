import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const DEMO_DOCS = [
  // HR
  { title: 'Employee Handbook 2026', description: 'Comprehensive guide covering company policies, benefits, PTO, code of conduct, and employee rights.', category: 'HR', requires_ack: true, visibility: 'all' },
  { title: 'Benefits Summary & Enrollment Guide', description: 'Overview of health, dental, vision, 401(k), and supplemental insurance options.', category: 'HR', requires_ack: true, visibility: 'all' },
  { title: 'PTO & Leave Policy', description: 'Paid time off accrual, sick leave, FMLA, and bereavement policy details.', category: 'HR', requires_ack: false, visibility: 'all' },
  { title: 'Anti-Harassment & Workplace Conduct Policy', description: 'Zero-tolerance policy on harassment, discrimination, and workplace misconduct with reporting procedures.', category: 'HR', requires_ack: true, visibility: 'all' },
  { title: 'Remote Work & Flexible Schedule Agreement', description: 'Guidelines for hybrid/remote work arrangements, expectations, and equipment policy.', category: 'HR', requires_ack: false, visibility: 'all' },

  // Compliance
  { title: 'HIPAA Privacy & Security Training Supplement', description: 'Quick-reference guide to protected health information (PHI) handling and breach reporting.', category: 'Compliance', requires_ack: true, visibility: 'all' },
  { title: 'OSHA Safety Standards Overview', description: 'General workplace safety requirements, hazard communication, and emergency procedures.', category: 'Compliance', requires_ack: true, visibility: 'all' },
  { title: 'Annual Compliance Certification — 2026', description: 'Required annual attestation that staff have reviewed and understood all compliance policies.', category: 'Compliance', requires_ack: true, visibility: 'all' },
  { title: 'FTC Income Disclosure Statement', description: 'Legally required disclosure of typical distributor earnings and compensation ranges.', category: 'Compliance', requires_ack: true, visibility: 'all' },
  { title: 'Product Claims Guidelines', description: 'What representatives may and may not say about products. Covers health claims, testimonials, and social media rules.', category: 'Compliance', requires_ack: true, visibility: 'all' },

  // Operations
  { title: 'Standard Operating Procedures Manual', description: 'Step-by-step SOPs for daily operations, opening/closing procedures, and escalation paths.', category: 'Operations', requires_ack: false, visibility: 'all' },
  { title: 'New Hire Onboarding Checklist', description: 'Day 1–90 onboarding milestones, system access requests, and training schedule.', category: 'Operations', requires_ack: false, visibility: 'all' },
  { title: 'Emergency Response & Evacuation Plan', description: 'Emergency contacts, evacuation routes, assembly points, and crisis communication protocol.', category: 'Safety', requires_ack: true, visibility: 'all' },
  { title: 'Equipment & Technology Acceptable Use Policy', description: 'Rules for company device use, software installation, data handling, and personal use guidelines.', category: 'Operations', requires_ack: true, visibility: 'all' },

  // Leadership / Confidential
  { title: 'Q1 2026 Board Meeting Minutes', description: 'Summary of board decisions, strategic priorities, and key resolutions from Q1 2026.', category: 'Leadership', requires_ack: false, visibility: 'admin_only' },
  { title: '2026 Annual Strategic Plan', description: 'Company vision, OKRs, market expansion targets, and budget allocation for fiscal year 2026.', category: 'Leadership', requires_ack: false, visibility: 'admin_only' },
  { title: 'Executive Compensation Summary', description: 'Leadership team compensation structure, equity schedule, and bonus criteria.', category: 'Leadership', requires_ack: false, visibility: 'admin_only' },

  // Clinical / Product
  { title: 'Product Catalogue — 2026 Full Line', description: 'Complete product descriptions, ingredients, usage instructions, and contraindications.', category: 'Product', requires_ack: false, visibility: 'all' },
  { title: 'Distributor Agreement & Terms', description: 'Independent distributor agreement outlining rights, responsibilities, and termination clauses.', category: 'Compliance', requires_ack: true, visibility: 'all' },
  { title: 'Compensation Plan — Full Overview', description: 'Detailed breakdown of rank structure, commission rates, bonuses, and fast-start program.', category: 'Product', requires_ack: false, visibility: 'all' },
]

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Check if demo docs already exist
  const { count } = await supabaseAdmin
    .from('documents').select('id', { count: 'exact', head: true })
  if ((count ?? 0) > 0) return NextResponse.json({ error: 'Documents already exist. Clear library first.' }, { status: 409 })

  const rows = DEMO_DOCS.map(d => ({
    ...d,
    file_path: `demo/${d.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
    file_name: `${d.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
    file_size: null,
    uploaded_by: user.id,
  }))

  const { data, error } = await supabaseAdmin
    .from('documents').insert(rows).select('id, title')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, count: data?.length ?? 0 })
}
