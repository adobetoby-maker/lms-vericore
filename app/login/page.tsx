import { cookies } from 'next/headers'
import { getMessages, type Locale } from '@/lib/i18n/translations'
import LoginClient from './LoginClient'

const SITE_URL = 'https://lms-platform-7tqm6ioj7-adobetoby-5572s-projects.vercel.app'

export const metadata = {
  title: 'Sign In — LMS Portal | Learning Management System',
  description: 'Sign in to your LMS Portal account to access your training courses, compliance modules, and learning progress.',
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: `${SITE_URL}/login` },
  openGraph: {
    title: 'LMS Portal — Sign In',
    description: 'Access your training courses and compliance modules.',
    url: `${SITE_URL}/login`,
    siteName: 'LMS Portal',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LMS Portal — Sign In',
    description: 'Access your training courses and compliance modules.',
  },
}

export default async function LoginPage() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value ?? 'en') as Locale
  const messages = getMessages(locale)

  return <LoginClient messages={messages} locale={locale} />
}
