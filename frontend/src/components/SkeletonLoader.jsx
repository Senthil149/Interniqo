/**
 * Reusable Skeleton Loader Component
 * Replaces blank spinners with subtle animated shimmering placeholder structures.
 */
export default function SkeletonLoader({ variant = 'card', count = 1, className = '' }) {
  const items = Array.from({ length: count }, (_, i) => i)

  if (variant === 'metric') {
    return (
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {items.map((i) => (
          <div key={i} className="card-base animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-8 w-8 rounded-lg bg-slate-200" />
            </div>
            <div className="h-7 w-16 rounded bg-slate-200" />
            <div className="h-3 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'table-row') {
    return (
      <tbody className={className}>
        {items.map((i) => (
          <tr key={i} className="border-b border-slate-100">
            <td className="p-4">
              <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
            </td>
            <td className="p-4">
              <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
            </td>
            <td className="p-4">
              <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
            </td>
            <td className="p-4">
              <div className="h-4 w-16 rounded bg-slate-200 animate-pulse" />
            </td>
            <td className="p-4 text-right">
              <div className="ml-auto h-7 w-20 rounded-lg bg-slate-200 animate-pulse" />
            </td>
          </tr>
        ))}
      </tbody>
    )
  }

  if (variant === 'detail-header') {
    return (
      <div className={`card-base animate-pulse space-y-4 ${className}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 rounded-lg bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-5 w-20 rounded-full bg-slate-200" />
            </div>
          </div>
          <div className="h-10 w-28 rounded-xl bg-slate-200" />
        </div>
        <div className="flex gap-4 pt-2">
          <div className="h-4 w-28 rounded bg-slate-100" />
          <div className="h-4 w-28 rounded bg-slate-100" />
          <div className="h-4 w-28 rounded bg-slate-100" />
        </div>
      </div>
    )
  }

  // Default: 'card'
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((i) => (
        <div key={i} className="card-base animate-pulse space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 rounded bg-slate-200" />
              <div className="h-3 w-32 rounded bg-slate-100" />
            </div>
            <div className="h-6 w-16 rounded-full bg-slate-200" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-4/5 rounded bg-slate-100" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-7 w-20 rounded-lg bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  )
}
