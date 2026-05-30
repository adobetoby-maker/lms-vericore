import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { THEMES } from "@/lib/themes";
import { cookies } from "next/headers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = 'https://lms-platform-one-blond.vercel.app'

export const metadata: Metadata = {
  title: { default: 'LMS Portal', template: '%s — LMS Portal' },
  description: 'Modern learning management system for teams and compliance training.',
  metadataBase: new URL(SITE_URL),
  robots: { index: false, follow: false },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LMS Portal',
  applicationCategory: 'EducationApplication',
  description: 'Learning management system for team training and compliance.',
  url: SITE_URL,
}

// CSS vars for each theme — output inline so there's zero flash on any page load
function themeVarsCss(themeId: string): string {
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0]
  return Object.entries(theme.vars).map(([k, v]) => `${k}:${v}`).join(';')
}

// Background + border overrides injected server-side so hardcoded Tailwind classes
// respond to the theme before any JS runs
const BG_OVERRIDES = `
  .bg-\\[#0a0a18\\]{background:var(--bg)!important}
  .bg-\\[#1a1a2e\\]{background:var(--bg2)!important}
  .bg-\\[#252545\\]{background:var(--bg3)!important}
  .border-\\[#2a2a4a\\]{border-color:var(--border)!important}
  .border-\\[#1a1a2e\\]{border-color:var(--border)!important}
  .divide-\\[#2a2a4a\\]>:not(:first-child),.divide-\\[#2a2a4a\\]\\/50>:not(:first-child){border-color:var(--border)!important}
`

const LIGHT_TEXT_OVERRIDES = `
  .text-white{color:var(--text)!important}
  .text-slate-100,.text-slate-200,.text-slate-300{color:var(--text2)!important}
  .text-slate-400,.text-slate-500,.text-slate-600{color:var(--text3)!important}
  .placeholder-slate-500::placeholder,.placeholder-slate-600::placeholder{color:var(--text3)!important}
  button.text-white{color:#fff!important}
  [class*="bg-indigo-"].text-white,[class*="bg-indigo-"] .text-white,
  [class*="bg-emerald-"].text-white,[class*="bg-emerald-"] .text-white,
  [class*="bg-red-"].text-white,[class*="bg-red-"] .text-white,
  [class*="bg-amber-"].text-white,[class*="bg-amber-"] .text-white,
  [class*="bg-sky-"].text-white,[class*="bg-sky-"] .text-white{color:#fff!important}
`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value ?? 'en'
  const validLocale = ['en', 'es'].includes(locale) ? locale : 'en'

  const themeId = cookieStore.get('lms-theme')?.value ?? 'vericore'
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0]
  const isLight = theme.mode === 'light'
  const cssVars = themeVarsCss(theme.id)

  return (
    <html
      lang={validLocale}
      data-theme={theme.id}
      data-mode={theme.mode}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Inject theme CSS vars + overrides before any JS — eliminates flash */}
        <style dangerouslySetInnerHTML={{ __html:
          `:root{${cssVars}}` +
          BG_OVERRIDES +
          (isLight ? LIGHT_TEXT_OVERRIDES : '')
        }} />
        <link rel="canonical" href={`${SITE_URL}/login`} />
        {/* Safe: jsonLd is a hardcoded compile-time constant — no user input, no XSS risk */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-theme text-theme">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
