import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'

export function AdminPageHeader({ eyebrow, title, description, actions }) {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <div className={`admin-page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl shadow-xs transition-colors duration-300 ${dark ? 'bg-[#141414] border-[#383027]' : 'bg-white border-[#e2e7df]'}`}>
      <div>
        {eyebrow ? (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${dark ? 'bg-[#222] text-[#C6A36B] border border-[#383027]' : 'bg-[#e8f0e5] text-[#173d32] border border-[#d6ded5]'}`}>
              {eyebrow}
            </span>
          </div>
        ) : null}
        <h1 className={`text-xl sm:text-2xl font-bold mt-1.5 transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
          {title}
        </h1>
        {description ? (
          <p className={`text-xs sm:text-sm mt-0.5 transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2.5 flex-wrap">{actions}</div> : null}
    </div>
  )
}

export function LoadingState({ label = 'Loading...' }) {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
      <Loader2 size={24} className="animate-spin" />
      <span className={`text-xs font-medium transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
        {label}
      </span>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <div className={`admin-card-hover p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all duration-300 ${dark ? 'bg-[#1a1a1a] border-[#383027] text-[#F5EBDD]' : 'bg-[#fee2e2] border-[#fecaca] text-[#dc2626]'}`} role="alert">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} />
        <span>{message}</span>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="font-semibold underline cursor-pointer inline-flex items-center gap-1 transition-colors duration-300"
        >
          <RefreshCw size={13} /> Retry
        </button>
      ) : null}
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <div className="admin-enter py-12 text-center max-w-md mx-auto">
      <h3 className={`text-sm font-semibold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
        {title}
      </h3>
      {description ? (
        <p className={`text-xs mt-1 transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function KpiCard({ label, value, hint, trend, icon: Icon }) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [animatedValue, setAnimatedValue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isVisible) {
          setIsVisible(true)
          setAnimatedValue(0)
          const start = performance.now()
          const duration = 1000
          const target = Number(value) || 0
          const frame = (now) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setAnimatedValue(Math.floor(target * eased))
            if (progress < 1) requestAnimationFrame(frame)
          }
          requestAnimationFrame(frame)
        }
      },
      { threshold: 0.1 },
    )
    const el = ref.current
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [value, isVisible])

  const displayValue = isVisible ? animatedValue : 0
  const trendColor = trend === 'up' ? (dark ? '#C6A36B' : '#15803d') : trend === 'down' ? (dark ? '#C6A36B' : '#dc2626') : null

  return (
    <div ref={ref} className={`admin-card-hover admin-glow-border rounded-2xl p-5 border shadow-xs transition-all duration-300 ${dark ? 'bg-[#141414] border-[#383027]' : 'bg-white border-[#e5eae3]'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`text-[11px] uppercase tracking-wider font-semibold transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : 'text-[#718078]'}`}>
          {label}
        </div>
        {Icon && (
          <Icon size={14} className={`shrink-0 transition-colors duration-300 ${dark ? 'text-[#C6A36B]' : 'text-[#173d32]'}`} />
        )}
      </div>
      <div className={`text-2xl font-bold admin-countup transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
        {typeof value === 'string' ? value : displayValue}
      </div>
      {trend && (
        <div className={`text-[10px] font-semibold mt-1.5 flex items-center gap-1 transition-colors duration-300 ${dark ? 'text-[#C6A36B]' : 'text-[#173d32]'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${trendColor ? `bg-${trendColor}` : ''}`} />
          {trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : '—'}
        </div>
      )}
      {hint ? (
        <div className={`text-[11px] mt-1 transition-colors duration-300 ${dark ? 'text-[#8a7a66]' : 'text-[#718078]'}`}>
          {hint}
        </div>
      ) : null}
    </div>
  )
}

export function Badge({ tone = 'neutral', children }) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const tones = {
    neutral: dark ? 'bg-[#222] text-[#B9AA98] border-[#383027]' : 'bg-[#f5f5f5] text-[#616161] border-[#e0e0e0]',
    success: dark ? 'bg-[#1a1a1a] text-[#C6A36B] border-[#383027]' : 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]',
    warn: dark ? 'bg-[#2a2218] text-[#F0DDB7] border-[#5c4a33]' : 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]',
    danger: dark ? 'bg-[#2a1a1a] text-[#F0DDB7] border-[#5c3333]' : 'bg-[#fee2e2] text-[#dc2626] border-[#fecaca]',
    info: dark ? 'bg-[#1a1a2e] text-[#7fd4a8] border-[#383027]' : 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors duration-300 ${tones[tone] || tones.neutral}`}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    paid: 'success', delivered: 'success', active: 'success', captured: 'success',
    processing: 'info', shipped: 'info', pending_payment: 'warn', created: 'warn', paused: 'warn',
    cancelled: 'neutral', failed: 'danger', refund_required: 'danger', out_of_stock: 'danger',
  }
  const label = String(status || '').replace(/_/g, ' ')
  return <Badge tone={map[status] || 'neutral'}>{label || '-'}</Badge>
}

export function Pagination({ page, totalPages, onPage }) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  if (!totalPages || totalPages <= 1) return null

  return (
    <div className={`admin-card-hover p-4 border-t flex items-center justify-between gap-3 text-xs text-[#718078] transition-all duration-300 ${dark ? 'bg-[#141414] border-[#383027] text-[#B9AA98]' : 'border-[#e5eae3]'}`}>
      <span>
        Page <span className="font-semibold"> {page}</span> of <span className="font-semibold"> {totalPages}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className={`px-3 py-1.5 rounded-xl border transition-all duration-300 disabled:opacity-40 cursor-pointer ${dark ? 'border-[#383027] text-white hover:bg-[#222]' : 'border-[#d6ded5] text-[#20342d] hover:bg-[#f6f4ec]'}`}
        >
          Prev
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className={`px-3 py-1.5 rounded-xl border transition-all duration-300 disabled:opacity-40 cursor-pointer ${dark ? 'border-[#383027] text-white hover:bg-[#222]' : 'border-[#d6ded5] text-[#20342d] hover:bg-[#f6f4ec]'}`}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="admin-enter rounded-2xl p-5 border shadow-xs transition-all duration-300 flex flex-col gap-3">
      <div className="h-4 w-24 admin-skeleton" />
      <div className="h-8 w-full admin-skeleton" />
      <div className="h-32 w-full admin-skeleton" />
      <div className="h-4 w-3/4 admin-skeleton" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="admin-enter h-64 rounded-2xl border p-5 shadow-xs flex flex-col">
      <div className="h-4 w-24 admin-skeleton mb-4" />
      <div className="flex-1 admin-skeleton" />
    </div>
  )
}
