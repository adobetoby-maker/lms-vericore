import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createCipheriv, randomBytes, scryptSync } from 'crypto'

export const dynamic = 'force-dynamic'

// Cold vault: AES-256-GCM encrypted metadata backup.
// File paths are included so files can be re-fetched on-demand after decryption
// — no long-lived bearer URLs are embedded in the archive.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fail closed — no fallback key ever
  const secret = process.env.VAULT_SECRET
  if (!secret || secret.length < 32) {
    return NextResponse.json(
      { error: 'Vault not configured. Set VAULT_SECRET (min 32 chars) in environment variables.' },
      { status: 503 },
    )
  }

  const { data: docs } = await supabaseAdmin
    .from('documents')
    .select('id, title, description, category, file_name, file_size, file_path, visibility, requires_ack, created_at')
    .order('category').order('title')

  const { data: acks } = await supabaseAdmin
    .from('document_acks')
    .select('document_id, user_id, acked_at, profiles:user_id(first_name, last_name, email)')
    .order('acked_at', { ascending: false })

  const { data: access } = await supabaseAdmin
    .from('document_access')
    .select('document_id, team_id, is_required, teams:team_id(name)')

  // Include storage paths only — no pre-signed URLs.
  // Re-authenticate via the admin API to retrieve individual files after decryption.
  const payload = {
    exported_at: new Date().toISOString(),
    exported_by: user.id,
    note: 'File paths reference Supabase Storage bucket "documents". Use authenticated API to retrieve files.',
    documents: docs ?? [],
    acknowledgments: acks ?? [],
    access_rules: access ?? [],
  }

  const plaintext = JSON.stringify(payload, null, 2)

  // Derive a 32-byte key with scrypt (salt is fixed per vault — stored in payload header)
  // Using a random salt per-export means each export has a unique key derivation.
  const salt = randomBytes(16)
  const key = scryptSync(secret, salt, 32)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  // Pack: salt(16) + iv(12) + tag(16) + ciphertext
  const vaultBuffer = Buffer.concat([salt, iv, tag, encrypted])
  const filename = `lms-vault-${new Date().toISOString().slice(0, 10)}.vault`

  return new NextResponse(vaultBuffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(vaultBuffer.length),
    },
  })
}
