import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Slim animated top progress bar (YouTube style).
 * Triggers on route change with a fluid sliding motion in teal/amber.
 */
export default function TopProgressBar() {
  const location = useLocation()
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    setAnimating(true)
    const timer = setTimeout(() => {
      setAnimating(false)
    }, 550)

    return () => clearTimeout(timer)
  }, [location.pathname, location.search])

  return (
    <AnimatePresence>
      {animating && (
        <motion.div
          key="top-progress-bar"
          initial={{ scaleX: 0, opacity: 1, transformOrigin: '0% 50%' }}
          animate={{ scaleX: [0, 0.7, 1], opacity: [1, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.55,
            times: [0, 0.65, 1],
            ease: [0.16, 1, 0.3, 1],
          }}
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 via-accent-500 to-primary-700 z-50 pointer-events-none shadow-xs shadow-primary-600/30"
        />
      )}
    </AnimatePresence>
  )
}
