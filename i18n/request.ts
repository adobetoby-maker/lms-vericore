import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value ?? 'en') as 'en' | 'es'
  const validLocale = ['en', 'es'].includes(locale) ? locale : 'en'

  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default,
  }
})
