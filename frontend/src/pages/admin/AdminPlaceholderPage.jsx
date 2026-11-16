import { ArrowRight, Boxes, CheckCircle2, Clock, Package } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AdminProductsPlaceholder() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#e5eae3] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#e8f0e5] text-[#173d32]">
              Primary Module
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#173d32] mt-1.5">
            Products & Catalogue Management
          </h2>
          <p className="text-xs sm:text-sm text-[#718078] mt-1">
            Manage your live supplements catalogue, edit stock and pricing, and upload product photos.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5eae3] p-8 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-[#e8f0e5] text-[#173d32] mx-auto flex items-center justify-center mb-4">
          <Package size={28} />
        </div>
        <h3 className="text-lg font-semibold text-[#173d32]">
          Product Catalogue Workspace Ready
        </h3>
        <p className="text-xs sm:text-sm text-[#718078] max-w-md mx-auto mt-2 leading-relaxed">
          The administrative API foundation, serializers, image upload handlers, and authentication guards are verified.
          The complete product management workflow will be mounted here in Step 4.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f6f4ec] text-[#173d32] text-xs font-medium border border-[#e2e7df]">
            <CheckCircle2 size={14} className="text-[#10b981]" />
            <span>Admin Endpoints Active</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f6f4ec] text-[#173d32] text-xs font-medium border border-[#e2e7df]">
            <CheckCircle2 size={14} className="text-[#10b981]" />
            <span>MultiPart Image Upload Ready</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f6f4ec] text-[#173d32] text-xs font-medium border border-[#e2e7df]">
            <CheckCircle2 size={14} className="text-[#10b981]" />
            <span>Stock & Price Synchronization Ready</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminModulePlaceholder({ title, description, icon: Icon = Boxes }) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#e8f0e5] text-[#173d32] mx-auto flex items-center justify-center mb-4">
        <Icon size={24} />
      </div>
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f6f4ec] text-[#718078] border border-[#e2e7df] mb-3">
        <Clock size={11} /> Module Planned
      </span>
      <h2 className="text-xl font-bold text-[#173d32]">{title}</h2>
      <p className="text-xs sm:text-sm text-[#718078] max-w-md mx-auto mt-2 leading-relaxed">
        {description}
      </p>
      <div className="mt-6">
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#173d32] hover:text-[#d4a96a] transition"
        >
          <span>Go to Products Catalogue</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}
