import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * Route-specific ambient blob presets.
 * Each preset configures 3-4 soft, blurred gradient shapes positioned at page corners and edges.
 * Colors:
 * - Deep Teal palette: #0f766e (primary-700), #14b8a6 (primary-500), #042f2e (primary-950)
 * - Warm Amber palette: #f59e0b (accent-500), #fbbf24 (accent-400), #d97706 (accent-600)
 *
 * Opacities are kept between 0.05 and 0.12 so they read as ambient atmospheric texture
 * behind content without competing with text or card readability.
 */
const ROUTE_PRESETS = {
  // Home Landing Page
  home: {
    blob1: {
      // Deep teal top-right corner
      className: 'bg-gradient-to-br from-primary-600/12 via-teal-500/8 to-transparent',
      style: { top: '-10%', right: '-6%', width: '560px', height: '560px' },
      blur: 'blur-[110px]',
      animate: { x: [0, 20, -15, 0], y: [0, -20, 15, 0] },
      duration: 18,
    },
    blob2: {
      // Warm amber bottom-left corner
      className: 'bg-gradient-to-tr from-accent-500/10 via-amber-400/8 to-transparent',
      style: { bottom: '-12%', left: '-8%', width: '520px', height: '500px' },
      blur: 'blur-[100px]',
      animate: { x: [0, -25, 20, 0], y: [0, 25, -20, 0] },
      duration: 22,
    },
    blob3: {
      // Subtle teal mid-right edge
      className: 'bg-primary-500/7',
      style: { top: '48%', right: '-10%', width: '380px', height: '420px' },
      blur: 'blur-[90px]',
      animate: { x: [0, -15, 15, 0], y: [0, 20, -15, 0] },
      duration: 16,
    },
    blob4: {
      // Warm amber top-left subtle accent
      className: 'bg-accent-400/6',
      style: { top: '8%', left: '-8%', width: '320px', height: '320px' },
      blur: 'blur-[80px]',
      animate: { x: [0, 15, -10, 0], y: [0, -15, 10, 0] },
      duration: 20,
    },
  },

  // Auth pages (Login, Register, Forgot Password, Reset Password, Verify Email)
  auth: {
    blob1: {
      // Prominent deep-teal top-left diagonal framing
      className: 'bg-gradient-to-br from-primary-700/14 via-teal-600/9 to-transparent',
      style: { top: '-14%', left: '-10%', width: '600px', height: '600px' },
      blur: 'blur-[110px]',
      animate: { x: [0, 25, -20, 0], y: [0, -20, 25, 0] },
      duration: 20,
    },
    blob2: {
      // Warm amber bottom-right diagonal framing
      className: 'bg-gradient-to-tl from-accent-600/12 via-amber-400/9 to-transparent',
      style: { bottom: '-14%', right: '-8%', width: '540px', height: '540px' },
      blur: 'blur-[100px]',
      animate: { x: [0, -20, 25, 0], y: [0, 25, -20, 0] },
      duration: 24,
    },
    blob3: {
      // Soft amber glow near upper right
      className: 'bg-accent-500/6',
      style: { top: '15%', right: '-6%', width: '340px', height: '340px' },
      blur: 'blur-[85px]',
      animate: { x: [0, -15, 10, 0], y: [0, 15, -10, 0] },
      duration: 17,
    },
    blob4: {
      // Soft teal bottom-left edge
      className: 'bg-primary-500/6',
      style: { bottom: '10%', left: '-4%', width: '300px', height: '300px' },
      blur: 'blur-[80px]',
      animate: { x: [0, 10, -15, 0], y: [0, -10, 15, 0] },
      duration: 19,
    },
  },

  // Generic and Student/Company Dashboards
  dashboard: {
    blob1: {
      // Wide organic deep-teal spread across top-left
      className: 'bg-gradient-to-br from-primary-600/12 via-teal-400/7 to-transparent',
      style: { top: '-12%', left: '-6%', width: '680px', height: '460px' },
      blur: 'blur-[115px]',
      animate: { x: [0, 30, -20, 0], y: [0, -15, 20, 0] },
      duration: 22,
    },
    blob2: {
      // Warm amber glow in mid-right perimeter
      className: 'bg-gradient-to-bl from-accent-500/10 via-amber-300/7 to-transparent',
      style: { top: '35%', right: '-10%', width: '480px', height: '480px' },
      blur: 'blur-[100px]',
      animate: { x: [0, -20, 20, 0], y: [0, 25, -20, 0] },
      duration: 19,
    },
    blob3: {
      // Deep teal bottom-left
      className: 'bg-primary-700/8',
      style: { bottom: '-10%', left: '8%', width: '440px', height: '380px' },
      blur: 'blur-[90px]',
      animate: { x: [0, 15, -20, 0], y: [0, -20, 15, 0] },
      duration: 21,
    },
    blob4: {
      // Soft warm amber bottom-right corner
      className: 'bg-accent-400/6',
      style: { bottom: '-8%', right: '-4%', width: '340px', height: '340px' },
      blur: 'blur-[80px]',
      animate: { x: [0, -10, 15, 0], y: [0, 15, -10, 0] },
      duration: 17,
    },
  },

  // Student Recommendations Page
  recommendations: {
    blob1: {
      // High-energy deep-teal in top-right corner
      className: 'bg-gradient-to-bl from-primary-600/13 via-teal-500/8 to-transparent',
      style: { top: '-12%', right: '-8%', width: '580px', height: '540px' },
      blur: 'blur-[110px]',
      animate: { x: [0, -25, 20, 0], y: [0, 20, -20, 0] },
      duration: 20,
    },
    blob2: {
      // Broad warm-amber aura behind left-side filters & rankings
      className: 'bg-gradient-to-r from-accent-500/11 via-amber-400/8 to-transparent',
      style: { top: '28%', left: '-12%', width: '540px', height: '520px' },
      blur: 'blur-[105px]',
      animate: { x: [0, 20, -25, 0], y: [0, -25, 20, 0] },
      duration: 23,
    },
    blob3: {
      // Deep teal bottom-right margin
      className: 'bg-primary-500/8',
      style: { bottom: '-10%', right: '12%', width: '460px', height: '380px' },
      blur: 'blur-[95px]',
      animate: { x: [0, 15, -15, 0], y: [0, -15, 20, 0] },
      duration: 18,
    },
    blob4: {
      // Warm amber bottom-left corner accent
      className: 'bg-accent-400/7',
      style: { bottom: '-6%', left: '-5%', width: '360px', height: '360px' },
      blur: 'blur-[85px]',
      animate: { x: [0, -15, 10, 0], y: [0, 15, -15, 0] },
      duration: 19,
    },
  },

  // Student Internship Search & Browse
  search: {
    blob1: {
      // Deep teal header edge spanning top-center-left
      className: 'bg-gradient-to-r from-primary-600/11 via-teal-400/7 to-transparent',
      style: { top: '-15%', left: '5%', width: '640px', height: '400px' },
      blur: 'blur-[115px]',
      animate: { x: [0, 20, -20, 0], y: [0, 15, -20, 0] },
      duration: 21,
    },
    blob2: {
      // Warm amber top-right corner
      className: 'bg-gradient-to-l from-accent-500/10 via-amber-400/7 to-transparent',
      style: { top: '4%', right: '-10%', width: '500px', height: '500px' },
      blur: 'blur-[100px]',
      animate: { x: [0, -25, 20, 0], y: [0, -20, 25, 0] },
      duration: 24,
    },
    blob3: {
      // Deep teal beside sticky filters on left
      className: 'bg-primary-700/8',
      style: { top: '52%', left: '-10%', width: '460px', height: '460px' },
      blur: 'blur-[95px]',
      animate: { x: [0, 15, -20, 0], y: [0, -20, 15, 0] },
      duration: 19,
    },
    blob4: {
      // Warm amber bottom-right corner
      className: 'bg-accent-400/6',
      style: { bottom: '-8%', right: '-6%', width: '380px', height: '380px' },
      blur: 'blur-[85px]',
      animate: { x: [0, -15, 15, 0], y: [0, 20, -15, 0] },
      duration: 18,
    },
  },

  // Applications (Student & Company)
  applications: {
    blob1: {
      // Warm amber top-left corner
      className: 'bg-gradient-to-br from-accent-500/11 via-amber-400/8 to-transparent',
      style: { top: '-10%', left: '-8%', width: '520px', height: '500px' },
      blur: 'blur-[105px]',
      animate: { x: [0, 20, -20, 0], y: [0, -20, 20, 0] },
      duration: 20,
    },
    blob2: {
      // Deep teal bottom-right corner
      className: 'bg-gradient-to-tl from-primary-600/12 via-teal-500/8 to-transparent',
      style: { bottom: '-14%', right: '-10%', width: '620px', height: '520px' },
      blur: 'blur-[110px]',
      animate: { x: [0, -25, 20, 0], y: [0, 25, -20, 0] },
      duration: 23,
    },
    blob3: {
      // Soft teal mid-left edge
      className: 'bg-primary-500/7',
      style: { top: '45%', left: '-6%', width: '360px', height: '360px' },
      blur: 'blur-[90px]',
      animate: { x: [0, -15, 15, 0], y: [0, 15, -15, 0] },
      duration: 17,
    },
    blob4: {
      // Warm amber top-right corner accent
      className: 'bg-accent-400/6',
      style: { top: '10%', right: '-6%', width: '320px', height: '320px' },
      blur: 'blur-[80px]',
      animate: { x: [0, 10, -15, 0], y: [0, -15, 10, 0] },
      duration: 19,
    },
  },

  // Student Resume Upload & AI Extraction
  resume: {
    blob1: {
      // Deep teal top-right corner
      className: 'bg-gradient-to-bl from-primary-600/13 via-teal-500/8 to-transparent',
      style: { top: '-12%', right: '-8%', width: '560px', height: '560px' },
      blur: 'blur-[110px]',
      animate: { x: [0, -20, 25, 0], y: [0, 25, -20, 0] },
      duration: 22,
    },
    blob2: {
      // Warm amber bottom-left corner
      className: 'bg-gradient-to-tr from-accent-500/11 via-amber-400/8 to-transparent',
      style: { bottom: '-12%', left: '-8%', width: '540px', height: '520px' },
      blur: 'blur-[105px]',
      animate: { x: [0, 25, -20, 0], y: [0, -20, 25, 0] },
      duration: 21,
    },
    blob3: {
      // Soft teal top-left aura
      className: 'bg-primary-500/6',
      style: { top: '6%', left: '2%', width: '380px', height: '300px' },
      blur: 'blur-[90px]',
      animate: { x: [0, 15, -15, 0], y: [0, -15, 15, 0] },
      duration: 18,
    },
    blob4: {
      // Warm amber mid-right highlight
      className: 'bg-accent-400/6',
      style: { top: '48%', right: '-5%', width: '320px', height: '340px' },
      blur: 'blur-[80px]',
      animate: { x: [0, -10, 15, 0], y: [0, 15, -10, 0] },
      duration: 20,
    },
  },

  // Credential Verification (Public)
  credential: {
    blob1: {
      // Cryptographic seal deep-teal in top-left
      className: 'bg-gradient-to-br from-primary-700/13 via-teal-500/8 to-transparent',
      style: { top: '-10%', left: '-6%', width: '600px', height: '480px' },
      blur: 'blur-[115px]',
      animate: { x: [0, 20, -20, 0], y: [0, -20, 20, 0] },
      duration: 20,
    },
    blob2: {
      // Warm amber top-right corner
      className: 'bg-gradient-to-bl from-accent-500/11 via-amber-400/8 to-transparent',
      style: { top: '-8%', right: '-6%', width: '480px', height: '480px' },
      blur: 'blur-[100px]',
      animate: { x: [0, -20, 20, 0], y: [0, 20, -20, 0] },
      duration: 23,
    },
    blob3: {
      // Deep teal bottom-center-right foundation
      className: 'bg-primary-600/8',
      style: { bottom: '-12%', right: '12%', width: '500px', height: '380px' },
      blur: 'blur-[95px]',
      animate: { x: [0, 15, -15, 0], y: [0, -15, 15, 0] },
      duration: 19,
    },
    blob4: {
      // Warm amber bottom-left corner
      className: 'bg-accent-400/7',
      style: { bottom: '-10%', left: '-5%', width: '380px', height: '380px' },
      blur: 'blur-[85px]',
      animate: { x: [0, -15, 15, 0], y: [0, 15, -15, 0] },
      duration: 18,
    },
  },

  // Admin Dashboard & Console
  admin: {
    blob1: {
      // Deep teal top-right corner
      className: 'bg-gradient-to-bl from-primary-600/11 via-teal-500/7 to-transparent',
      style: { top: '-14%', right: '-8%', width: '600px', height: '500px' },
      blur: 'blur-[110px]',
      animate: { x: [0, -25, 20, 0], y: [0, 20, -25, 0] },
      duration: 24,
    },
    blob2: {
      // Warm amber mid-left edge
      className: 'bg-gradient-to-r from-accent-500/9 via-amber-400/6 to-transparent',
      style: { top: '30%', left: '-12%', width: '500px', height: '500px' },
      blur: 'blur-[105px]',
      animate: { x: [0, 20, -25, 0], y: [0, -25, 20, 0] },
      duration: 22,
    },
    blob3: {
      // Soft deep-teal bottom-right margin
      className: 'bg-primary-700/7',
      style: { bottom: '-10%', right: '8%', width: '540px', height: '420px' },
      blur: 'blur-[100px]',
      animate: { x: [0, 15, -15, 0], y: [0, -15, 20, 0] },
      duration: 20,
    },
    blob4: {
      // Warm amber bottom-left corner
      className: 'bg-accent-400/5',
      style: { bottom: '-8%', left: '-6%', width: '380px', height: '380px' },
      blur: 'blur-[85px]',
      animate: { x: [0, -15, 15, 0], y: [0, 20, -15, 0] },
      duration: 18,
    },
  },

  // Company management (Listings, Post, Edit, Profile)
  company: {
    blob1: {
      // Deep teal top-left corner
      className: 'bg-gradient-to-br from-primary-600/12 via-teal-400/8 to-transparent',
      style: { top: '-12%', left: '-8%', width: '580px', height: '460px' },
      blur: 'blur-[110px]',
      animate: { x: [0, 25, -20, 0], y: [0, -20, 20, 0] },
      duration: 21,
    },
    blob2: {
      // Warm amber upper-right edge
      className: 'bg-gradient-to-l from-accent-500/10 via-amber-300/7 to-transparent',
      style: { top: '15%', right: '-8%', width: '500px', height: '500px' },
      blur: 'blur-[100px]',
      animate: { x: [0, -20, 25, 0], y: [0, 25, -20, 0] },
      duration: 23,
    },
    blob3: {
      // Deep teal bottom-left edge
      className: 'bg-primary-500/7',
      style: { bottom: '-10%', left: '6%', width: '440px', height: '380px' },
      blur: 'blur-[90px]',
      animate: { x: [0, 15, -15, 0], y: [0, -15, 15, 0] },
      duration: 19,
    },
    blob4: {
      // Warm amber bottom-right corner
      className: 'bg-accent-400/6',
      style: { bottom: '-6%', right: '-4%', width: '340px', height: '340px' },
      blur: 'blur-[80px]',
      animate: { x: [0, -10, 15, 0], y: [0, 15, -10, 0] },
      duration: 17,
    },
  },

  // Detail view (/internships/:id)
  detail: {
    blob1: {
      // Warm amber top-left
      className: 'bg-gradient-to-br from-accent-500/10 via-amber-400/7 to-transparent',
      style: { top: '-12%', left: '-8%', width: '520px', height: '520px' },
      blur: 'blur-[105px]',
      animate: { x: [0, 20, -20, 0], y: [0, -20, 20, 0] },
      duration: 20,
    },
    blob2: {
      // Deep teal bottom-right corner
      className: 'bg-gradient-to-tl from-primary-600/12 via-teal-500/8 to-transparent',
      style: { bottom: '-14%', right: '-8%', width: '600px', height: '560px' },
      blur: 'blur-[110px]',
      animate: { x: [0, -25, 20, 0], y: [0, 20, -25, 0] },
      duration: 24,
    },
    blob3: {
      // Subtle teal top-right aura
      className: 'bg-primary-500/6',
      style: { top: '10%', right: '-4%', width: '380px', height: '380px' },
      blur: 'blur-[90px]',
      animate: { x: [0, -15, 15, 0], y: [0, 15, -15, 0] },
      duration: 18,
    },
    blob4: {
      // Soft amber bottom-left accent
      className: 'bg-accent-400/6',
      style: { bottom: '-8%', left: '4%', width: '340px', height: '340px' },
      blur: 'blur-[80px]',
      animate: { x: [0, 10, -10, 0], y: [0, -10, 15, 0] },
      duration: 19,
    },
  },
}

/**
 * Determine the route category based on the current pathname.
 */
function getRouteKey(pathname) {
  if (pathname === '/') return 'home'
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email')
  ) {
    return 'auth'
  }
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname.startsWith('/student/recommendations')) return 'recommendations'
  if (pathname.startsWith('/student/internships')) return 'search'
  if (pathname.startsWith('/student/applications') || pathname.startsWith('/company/applications')) {
    return 'applications'
  }
  if (pathname.startsWith('/student/resume')) return 'resume'
  if (pathname.startsWith('/verify-credential')) return 'credential'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/company')) return 'company'
  if (pathname.startsWith('/internships/')) return 'detail'
  return 'home'
}

export default function AmbientBackground() {
  const location = useLocation()
  const routeKey = getRouteKey(location.pathname)
  const preset = ROUTE_PRESETS[routeKey] || ROUTE_PRESETS.home

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0"
      style={{ contain: 'strict' }}
    >
      {/* Blob 1 (Deep Teal Corner/Edge) */}
      <motion.div
        key={`blob1-${routeKey}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          ...preset.blob1.style,
          x: preset.blob1.animate.x,
          y: preset.blob1.animate.y,
        }}
        transition={{
          opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          x: { repeat: Infinity, duration: preset.blob1.duration, ease: 'easeInOut' },
          y: { repeat: Infinity, duration: preset.blob1.duration, ease: 'easeInOut' },
        }}
        className={`absolute rounded-full will-change-transform ${preset.blob1.className} ${preset.blob1.blur}`}
      />

      {/* Blob 2 (Warm Amber Corner/Edge) */}
      <motion.div
        key={`blob2-${routeKey}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          ...preset.blob2.style,
          x: preset.blob2.animate.x,
          y: preset.blob2.animate.y,
        }}
        transition={{
          opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          x: { repeat: Infinity, duration: preset.blob2.duration, ease: 'easeInOut' },
          y: { repeat: Infinity, duration: preset.blob2.duration, ease: 'easeInOut' },
        }}
        className={`absolute rounded-full will-change-transform ${preset.blob2.className} ${preset.blob2.blur}`}
      />

      {/* Blob 3 (Perimeter Accent) */}
      <motion.div
        key={`blob3-${routeKey}`}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{
          opacity: 1,
          scale: 1,
          ...preset.blob3.style,
          x: preset.blob3.animate.x,
          y: preset.blob3.animate.y,
        }}
        transition={{
          opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          x: { repeat: Infinity, duration: preset.blob3.duration, ease: 'easeInOut' },
          y: { repeat: Infinity, duration: preset.blob3.duration, ease: 'easeInOut' },
        }}
        className={`absolute rounded-full will-change-transform ${preset.blob3.className} ${preset.blob3.blur}`}
      />

      {/* Blob 4 (Subtle Ambient Aura) */}
      {preset.blob4 && (
        <motion.div
          key={`blob4-${routeKey}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            ...preset.blob4.style,
            x: preset.blob4.animate.x,
            y: preset.blob4.animate.y,
          }}
          transition={{
            opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
            scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
            x: { repeat: Infinity, duration: preset.blob4.duration, ease: 'easeInOut' },
            y: { repeat: Infinity, duration: preset.blob4.duration, ease: 'easeInOut' },
          }}
          className={`absolute rounded-full will-change-transform ${preset.blob4.className} ${preset.blob4.blur}`}
        />
      )}
    </div>
  )
}
