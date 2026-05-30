import en from '@/messages/en.json'
import es from '@/messages/es.json'

export type Locale = 'en' | 'es'
export type Messages = typeof en

const messages: Record<Locale, Messages> = { en, es }

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages.en
}

// Flatten dot-notation keys: "login.welcome" → messages.login.welcome
export function t(messages: Messages, key: string, vars?: Record<string, string | number>): string {
  const parts = key.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let val: any = messages
  for (const part of parts) {
    val = val?.[part]
    if (val === undefined) return key
  }
  let str = String(val)
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v))
    }
  }
  return str
}
