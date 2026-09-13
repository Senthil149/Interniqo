import { motion, AnimatePresence } from 'framer-motion'

/**
 * Animated form input component:
 * - Focus state: animated border/ring appearing smoothly in deep teal
 * - Error state: brief horizontal shake animation on validation error
 * - Error message: fades and slides in smoothly
 */
export default function AnimatedInput({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={id || name}
          className="block text-xs font-semibold uppercase tracking-wide text-slate-600"
        >
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
      )}

      <motion.div
        animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        <input
          id={id || name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`input-field ${
            error
              ? '!border-danger-500 !ring-2 !ring-danger-500/20'
              : 'border-warm-border focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20'
          } ${className}`}
          {...props}
        />
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs font-medium text-danger-600 flex items-center gap-1 mt-1"
          >
            <span>⚠️</span>
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
