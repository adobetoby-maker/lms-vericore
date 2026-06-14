import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

const SEEN_KEY = 'lmscore_tour_seen_v1'

function isMobile(): boolean {
  return typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 767px)').matches
}

function buildSteps(): DriveStep[] {
  const mobile = isMobile()

  return [
    // ── 0. Welcome modal ─────────────────────────────────────────────
    {
      popover: {
        title: 'Welcome to LMS Core 👋',
        description:
          "Let's take 60 seconds to show you where everything lives. " +
          "You can exit anytime — and replay this from the menu whenever you want.",
      },
    },

    // ── 1. Course list ────────────────────────────────────────────────
    {
      element: '[data-tour="course-list"]',
      popover: {
        title: 'Your courses land here 📚',
        description:
          "When your manager invites you to a training, it shows up right here. " +
          "Tap any card to start — the system tracks your progress automatically " +
          "so your compliance record updates in real time.",
        side: 'top',
        align: 'start',
      },
    },

    // ── 2. A single course card ───────────────────────────────────────
    {
      element: '[data-tour="course-card-first"]',
      popover: {
        title: 'Watch, then pass the quiz ✓',
        description:
          "Each course has a short video and a knowledge check. " +
          "You need both to earn your certificate — " +
          "so your team stays audit-ready without chasing paperwork.",
        side: mobile ? 'top' : 'bottom',
        align: 'start',
      },
    },

    // ── 3. Documents link ─────────────────────────────────────────────
    {
      element: mobile ? '[data-tour="mobile-menu"]' : '[data-tour="nav-documents"]',
      popover: {
        title: 'Policies live in Documents 📄',
        description: mobile
          ? "Tap the menu icon then Documents to find your company's policies and procedures. " +
            "They're always one tap away when a patient or inspector asks."
          : "Your company's policies and procedures live here. " +
            "They're always one click away when a patient or inspector asks.",
        side: mobile ? 'bottom' : 'right',
        align: 'start',
      },
    },

    // ── 4. Surveys link ───────────────────────────────────────────────
    {
      element: mobile ? '[data-tour="mobile-menu"]' : '[data-tour="nav-surveys"]',
      popover: {
        title: 'Surveys keep leadership in the loop 📊',
        description: mobile
          ? "Tap the menu icon then Surveys to complete any staff assessments your team sends. " +
            "It takes two minutes and gives leadership real data to act on."
          : "Complete staff assessments here. " +
            "It takes two minutes and gives leadership real data — " +
            "so decisions get made on facts, not guesswork.",
        side: mobile ? 'bottom' : 'right',
        align: 'start',
      },
    },

    // ── 5. Done modal ─────────────────────────────────────────────────
    {
      popover: {
        title: "You're all set 🎉",
        description:
          "Start with your first course — tap any card to begin. " +
          "You can replay this tour anytime from \"Take a tour\" in the top menu.",
      },
    },
  ]
}

function build() {
  return driver({
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Done ✓',
    popoverClass: 'product-tour',
    overlayColor: '#0a0a18',
    overlayOpacity: 0.65,
    steps: buildSteps(),
    onDestroyed: () => {
      localStorage.setItem(SEEN_KEY, '1')
    },
  })
}

export function startTour(): void {
  build().drive()
}

export function maybeAutoStartTour(): void {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(SEEN_KEY)) return
  localStorage.setItem(SEEN_KEY, '1')
  window.setTimeout(() => build().drive(), 600)
}

export function clearTourSeen(): void {
  localStorage.removeItem(SEEN_KEY)
}
