import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'

export function AdminPageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#e5eae3] shadow-xs">
      <div>
        {eyebrow ? <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#e8f0e5] text-[#173d32]">{eyebrow}</span></div> : null}
        <h1 className="text-xl sm:text-2xl font-bold text-[#173d32] mt-1.5">{title}</h1>
        {description ? <p className="text-xs sm:text-sm text-[#718078] mt-0.5">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2.5 flex-wrap">{actions}</div> : null}
    </div>
  )
}

export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="py-12 text-center text-[#718078] flex flex-col items-center justify-center gap-2">
      <Loader2 size={24} className="animate-spin text-[#173d32]" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="p-4 rounded-2xl bg-[#fee2e2] border border-[#fecaca] text-[#dc2626] text-xs flex items-center justify-between gap-3" role="alert">
      <div className="flex items-center gap-2"><AlertCircle size={16} /><span>{message}</span></div>
      {onRetry ? <button type="button" onClick={onRetry} className="font-semibold underline cursor-pointer inline-flex items-center gap-1"><RefreshCw size={13} />Retry</button> : null}
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="py-12 text-center max-w-md mx-auto">
      <h3 className="text-sm font-semibold text-[#173d32]">{title}</h3>
      {description ? <p className="text-xs text-[#718078] mt-1">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function KpiCard({ label, value, hint }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5eae3] p-4 shadow-xs">
      <div className="text-[11px] uppercase tracking-wider text-[#718078] font-semibold">{label}</div>
      <div className="text-2xl font-bold text-[#173d32] mt-1">{value}</div>
      {hint ? <div className="text-[11px] text-[#718078] mt-1">{hint}</div> : null}
    </div>
  )
}

export function Badge({ tone = 'neutral', children }) {
  const tones = {
    neutral: 'bg-[#f5f5f5] text-[#616161] border-[#e0e0e0]',
    success: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]',
    warn: 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]',
    danger: 'bg-[#fee2e2] text-[#dc2626] border-[#fecaca]',
    info: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]',
  }
  return <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ' + (tones[tone] || tones.neutral)}>{children}</span>
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
  if (!totalPages || totalPages <= 1) return null
  return (
    <div className="p-4 border-t border-[#e5eae3] flex items-center justify-between gap-3 text-xs text-[#718078]">
      <span>Page <span className="font-semibold text-[#173d32]">{page}</span> of <span className="font-semibold text-[#173d32]">{totalPages}</span></span>
      <div className="flex items-center gap-1.5">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="px-3 py-1.5 rounded-xl border border-[#d6ded5] disabled:opacity-40 cursor-pointer">Prev</button>
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="px-3 py-1.5 rounded-xl border border-[#d6ded5] disabled:opacity-40 cursor-pointer">Next</button>
      </div>
    </div>
  )
}
