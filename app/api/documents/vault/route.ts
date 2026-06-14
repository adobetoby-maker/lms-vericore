import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createCipheriv, randomBytes, createHash } from 'crypto'

export const dynamic = 'force-dynamic'

// Cold vault: encrypted JSON download of all doc metadata + ack records + signed URLs
// Encrypted with AES-256-GCM using VAULT_SECRET env var (or fallback)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Gather all docs
  const { data: docs } = await supabaseAdmin
    .from('documents')
    .select('id, title, description, category, file_name, file_size, visibility, requires_ack, created_at')
    .order('category').order('title')

  // Gather all ack records
  const { data: acks } = await supabaseAdmin
    .from('document_acks')
    .select('document_id, user_id, acked_at, profiles:user_id(first_name, last_name, email)')
    .order('acked_at', { ascending: false })

  // Gather document access rules
  const { data: access } = await supabaseAdmin
    .from('document_access')
    .select('document_id, team_id, is_required, teams:team_id(name)')

  // Generate short-lived signed URLs for each document
  const signedUrls: Record<string, string> = {}
  for (const doc of docs ?? []) {
    const d = doc as { id: string; file_path?: string }
    if (d.file_path) {
      const { data: signed } = await supabaseAdmin.storage
        .from('documents')
        .createSignedUrl(d.file_path, 60 * 60 * 24 * 7) // 7 days
      if (signed?.signedUrl) signedUrls[d.id] = signed.signedUrl
    }
  }

  const payload = {
    exported_at: new Date().toISOString(),
    exported_by: user.id,
    documents: docs ?? [],
    acknowledgments: acks ?? [],
    access_rules: access ?? [],
    signed_download_urls: signedUrls,
  }

  const plaintext = JSON.stringify(payload, null, 2)

  // AES-256-GCM encryption
  const secret = process.env.VAULT_SECRET ?? 'lms-vault-default-secret-change-me'
  const key = createHash('sha256').update(secret).digest()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  // Pack: iv(12) + tag(16) + ciphertext
  const vaultBuffer = Buffer.concat([iv, tag, encrypted])
  const filename = `lms-vault-${new Date().toISOString().slice(0, 10)}.vault`

  return new NextResponse(vaultBuffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(vaultBuffer.length),
    },
  })
}
