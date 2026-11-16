import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#e5eae3] shadow-2xl overflow-hidden p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDanger
                  ? 'bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]'
                  : 'bg-[#e8f0e5] text-[#173d32] border border-[#d6ded5]'
              }`}
            >
              <AlertTriangle size={20} />
            </div>
            <h2 id="confirm-dialog-title" className="text-base font-bold text-[#173d32]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="text-[#718078] hover:text-[#173d32] transition p-1"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#718078] mt-3 leading-relaxed">
          {message}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#718078] hover:text-[#173d32] hover:bg-[#f6f4ec] transition border border-[#e2e7df] cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition flex items-center gap-2 cursor-pointer shadow-sm ${
              isDanger
                ? 'bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b]'
                : 'bg-[#173d32] hover:bg-[#11241e] active:bg-[#0d1d18]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? <span>Processing…</span> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
