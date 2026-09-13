import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const MotionLinkComponent = motion.create(Link)

/**
 * Reusable animated button with felt tactile feedback:
 * - whileTap: instantly scales to 0.95
 * - whileHover: lifts up 2px with an expanding shadow
 * - variant='primary' | 'accent' | 'secondary' | 'danger'
 * - pulse: adds idle continuous shimmer / pulse glow for primary CTAs
 */
export function MotionButton({
  children,
  className = '',
  variant = 'primary',
  pulse = false,
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'accent'
      ? 'btn-accent'
      : variant === 'secondary'
      ? 'btn-secondary'
      : variant === 'danger'
      ? 'rounded-xl bg-danger-600 hover:bg-danger-700 text-white font-semibold px-4 py-2 text-xs shadow-xs transition cursor-pointer'
      : ''

  const pulseClass =
    pulse && variant === 'primary'
      ? 'animate-cta-pulse'
      : pulse && variant === 'accent'
      ? 'animate-amber-pulse'
      : ''

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { y: -2, transition: { duration: 0.15 } }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      className={`${variantClass} ${pulseClass} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export function MotionLink({
  children,
  to,
  className = '',
  variant = 'primary',
  pulse = false,
  ...props
}) {
  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'accent'
      ? 'btn-accent'
      : variant === 'secondary'
      ? 'btn-secondary'
      : ''

  const pulseClass =
    pulse && variant === 'primary'
      ? 'animate-cta-pulse'
      : pulse && variant === 'accent'
      ? 'animate-amber-pulse'
      : ''

  return (
    <MotionLinkComponent
      to={to}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.95 }}
      className={`${variantClass} ${pulseClass} ${className}`}
      {...props}
    >
      {children}
    </MotionLinkComponent>
  )
}

export default MotionButton
