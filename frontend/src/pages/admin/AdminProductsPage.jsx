import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Archive,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  Image as ImageIcon,
  Loader2,
  Package,
  PackagePlus,
  Pencil,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import {
  adminArchiveProduct,
  adminListProducts,
  adminTogglePublish,
  getErrorMessage,
  listCategories,
} from '../../services/apiBackend/index.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import ProductFormModal from './ProductFormModal.jsx'

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  })

  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [stockFilter, setStockFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  // Loading & error
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Archive dialog state
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [isArchiving, setIsArchiving] = useState(false)

  // Fetch categories once on mount
  useEffect(() => {
    listCategories()
      .then((cats) => setCategories(cats))
      .catch(() => {})
  }, [])

  // Fetch products when filters or pagination change
  useEffect(() => {
    let active = true

    adminListProducts({
      search,
      category: categoryFilter,
      stockStatus: stockFilter,
      isActive: statusFilter,
      page: currentPage,
      pageSize: 10,
    })
      .then((response) => {
        if (!active) return
        setProducts(response.results)
        setPagination({
          count: response.count,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
          hasNext: response.hasNext,
          hasPrevious: response.hasPrevious,
        })
        setError('')
      })
      .catch((err) => {
        if (!active) return
        setError(getErrorMessage(err, 'Failed to fetch catalogue products.'))
      })
      .finally(() => {
        if (!active) return
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [search, categoryFilter, stockFilter, statusFilter, currentPage, reloadTrigger])

  // Toast notification auto-dismiss
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const triggerRefresh = () => {
    setIsLoading(true)
    setReloadTrigger((prev) => prev + 1)
  }

  // Quick toggle publication status
  const handleTogglePublish = async (product) => {
    const nextState = !product.isActive
    try {
      const updated = await adminTogglePublish(product.id, nextState)
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: updated.isActive } : p)),
      )
      showToast(
        `"${product.name}" is now ${nextState ? 'published in marketplace' : 'unpublished'}.`,
        'success',
      )
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to update publication status.'), 'error')
    }
  }

  // Confirm product archiving
  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return
    setIsArchiving(true)
    try {
      await adminArchiveProduct(archiveTarget.id)
      showToast(`"${archiveTarget.name}" has been safely archived.`, 'success')
      setArchiveTarget(null)
      triggerRefresh()
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to archive product.'), 'error')
    } finally {
      setIsArchiving(false)
    }
  }

  const handleOpenCreate = () => {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleSaveSuccess = (savedProduct) => {
    showToast(
      selectedProduct
        ? `"${savedProduct.name}" updated successfully.`
        : `"${savedProduct.name}" created and added to catalogue.`,
      'success',
    )
    triggerRefresh()
  }

  const hasActiveFilters =
    search.trim() !== '' || categoryFilter !== 'All' || stockFilter !== 'all' || statusFilter !== 'all'

  const resetFilters = () => {
    setIsLoading(true)
    setSearch('')
    setCategoryFilter('All')
    setStockFilter('all')
    setStatusFilter('all')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-slideUp ${
            toast.type === 'error'
              ? 'bg-[#fee2e2] text-[#dc2626] border-[#fecaca]'
              : 'bg-[#173d32] text-white border-[#275c4d]'
          }`}
          role="status"
        >
          {toast.type === 'error' ? (
            <AlertCircle size={16} className="shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="text-[#10b981] shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-white/70 hover:text-white p-0.5 cursor-pointer"
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#e5eae3] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#e8f0e5] text-[#173d32]">
              Store Management
            </span>
            <span className="text-xs text-[#718078]">• {pagination.count} products total</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#173d32] mt-1.5">
            Product Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-[#718078] mt-0.5">
            Add new products, adjust inventory and pricing, upload photos, and control marketplace availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={triggerRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-[#d6ded5] text-[#718078] hover:text-[#173d32] hover:bg-[#f6f4ec] transition disabled:opacity-50 cursor-pointer"
            title="Refresh product catalogue"
            aria-label="Refresh catalogue"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#173d32] text-white hover:bg-[#11241e] active:bg-[#0d1d18] transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <PackagePlus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e5eae3] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#718078]">
              <Search size={15} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setIsLoading(true)
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search name, SKU, slug…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#d6ded5] text-xs text-[#20342d] focus:outline-none focus:border-[#173d32] focus:ring-1 focus:ring-[#173d32] transition"
            />
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setIsLoading(true)
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#d6ded5] text-xs text-[#20342d] bg-white focus:outline-none focus:border-[#173d32] focus:ring-1 focus:ring-[#173d32] transition"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock availability filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => {
                setIsLoading(true)
                setStockFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#d6ded5] text-xs text-[#20342d] bg-white focus:outline-none focus:border-[#173d32] focus:ring-1 focus:ring-[#173d32] transition"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock (&gt; 5)</option>
              <option value="low_stock">Low Stock (1–5)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>

          {/* Publication status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setIsLoading(true)
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#d6ded5] text-xs text-[#20342d] bg-white focus:outline-none focus:border-[#173d32] focus:ring-1 focus:ring-[#173d32] transition"
            >
              <option value="all">All Statuses</option>
              <option value="true">Published Only</option>
              <option value="false">Unpublished / Archived Only</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-[#f0f3ef] text-xs text-[#718078]">
            <span className="flex items-center gap-1.5">
              <Filter size={13} /> Active filters applied
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[#173d32] font-semibold hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#fee2e2] border border-[#fecaca] text-[#dc2626] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={triggerRefresh}
            className="font-semibold underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-[#e5eae3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#fbfaf6] border-b border-[#e5eae3] text-[#718078] uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Price / MRP</th>
                <th className="py-3 px-3">Stock Level</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f3ef]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#718078]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 size={24} className="animate-spin text-[#173d32]" />
                      <span className="text-xs font-medium">Loading catalogue data…</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#f6f4ec] text-[#718078] flex items-center justify-center mb-3">
                        <Package size={24} />
                      </div>
                      <h3 className="text-sm font-semibold text-[#173d32]">No products found</h3>
                      <p className="text-xs text-[#718078] mt-1">
                        {hasActiveFilters
                          ? 'Try adjusting your search keywords or filter settings.'
                          : 'Your catalogue currently has no items. Add your first product to get started.'}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-4 px-3.5 py-1.5 rounded-xl border border-[#d6ded5] text-xs font-medium text-[#173d32] hover:bg-[#f6f4ec] transition cursor-pointer"
                        >
                          Clear filters
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenCreate}
                          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#173d32] text-white hover:bg-[#11241e] transition cursor-pointer"
                        >
                          Add first product
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const hasImage = p.images && p.images.length > 0
                  const imageUrl = hasImage ? p.images[0].url : null

                  return (
                    <tr key={p.id} className="hover:bg-[#fcfbf7] transition-colors">
                      {/* Name & Photo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl border border-[#e2e7df] bg-[#f6f4ec] overflow-hidden shrink-0 flex items-center justify-center">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={18} className="text-[#a0b0a8]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-[#173d32] truncate">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-[#718078] truncate">
                              {p.form} • {p.servingSize || `${p.servingsPerPack} servings`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-[11px] font-semibold text-[#486358] bg-[#f6f4ec] px-2 py-0.5 rounded border border-[#e5eae3]">
                          {p.sku}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="text-xs font-medium text-[#20342d]">
                          {p.category || '—'}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-[#173d32]">
                          ₹{Number(p.price).toFixed(2)}
                        </div>
                        {p.mrp && Number(p.mrp) > Number(p.price) ? (
                          <div className="text-[10px] text-[#718078] line-through">
                            ₹{Number(p.mrp).toFixed(2)}
                          </div>
                        ) : null}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-3">
                        {p.stock === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]">
                            Out of stock (0)
                          </span>
                        ) : p.stock <= 5 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
                            Low: {p.stock} units
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]">
                            {p.stock} units
                          </span>
                        )}
                      </td>

                      {/* Publication Status */}
                      <td className="py-3.5 px-3">
                        {p.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f5e9] text-[#1b5e20] border border-[#c8e6c9]">
                            <Check size={11} /> Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f5f5f5] text-[#616161] border border-[#e0e0e0]">
                            Unpublished
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle publish button */}
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(p)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              p.isActive
                                ? 'text-[#718078] hover:text-[#b45309] hover:bg-[#fef3c7] border-[#e2e7df]'
                                : 'text-[#718078] hover:text-[#15803d] hover:bg-[#dcfce7] border-[#e2e7df]'
                            }`}
                            title={p.isActive ? 'Unpublish from store' : 'Publish to store'}
                            aria-label={p.isActive ? 'Unpublish product' : 'Publish product'}
                          >
                            {p.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg border border-[#e2e7df] text-[#718078] hover:text-[#173d32] hover:bg-[#e8f0e5] transition cursor-pointer"
                            title="Edit product details"
                            aria-label="Edit product"
                          >
                            <Pencil size={14} />
                          </button>

                          {/* Archive button */}
                          <button
                            type="button"
                            onClick={() => setArchiveTarget(p)}
                            className="p-1.5 rounded-lg border border-[#e2e7df] text-[#718078] hover:text-[#dc2626] hover:bg-[#fee2e2] transition cursor-pointer"
                            title="Archive product (soft delete)"
                            aria-label="Archive product"
                          >
                            <Archive size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#e5eae3] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#718078]">
            <div>
              Showing{' '}
              <span className="font-semibold text-[#173d32]">
                {(pagination.page - 1) * pagination.pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-[#173d32]">
                {Math.min(pagination.page * pagination.pageSize, pagination.count)}
              </span>{' '}
              of <span className="font-semibold text-[#173d32]">{pagination.count}</span> products
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true)
                  setCurrentPage((prev) => Math.max(1, prev - 1))
                }}
                disabled={!pagination.hasPrevious || isLoading}
                className="p-2 rounded-xl border border-[#d6ded5] text-[#20342d] hover:bg-[#f6f4ec] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="px-3 py-1 font-semibold text-[#173d32]">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true)
                  setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
                }}
                disabled={!pagination.hasNext || isLoading}
                className="p-2 rounded-xl border border-[#d6ded5] text-[#20342d] hover:bg-[#f6f4ec] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <ProductFormModal
          product={selectedProduct}
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {/* Confirmation Dialog for Archiving */}
      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        title="Archive Product"
        message={`Are you sure you want to archive "${archiveTarget?.name}"? It will be unpublished from the customer marketplace, but past order records will remain safely preserved.`}
        confirmLabel="Archive Product"
        isDanger={true}
        isLoading={isArchiving}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  )
}
