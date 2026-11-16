import { useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import {
  adminCreateProduct,
  adminDeleteProductImage,
  adminUpdateProduct,
  adminUploadProductImage,
  getFieldErrors,
  getErrorMessage,
} from '../../services/apiBackend/index.js'

const FORM_FACTORS = [
  { value: 'capsule', label: 'Capsule' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'softgel', label: 'Softgel' },
  { value: 'gummy', label: 'Gummy' },
  { value: 'powder', label: 'Powder' },
  { value: 'liquid', label: 'Liquid' },
]

function getInitialProductData(product, categories) {
  if (product) {
    return {
      name: product.name || '',
      sku: product.sku || '',
      categoryId: product.categoryId || categories[0]?.id || '',
      form: product.form || 'capsule',
      price: product.price !== null && product.price !== undefined ? String(product.price) : '',
      mrp: product.mrp !== null && product.mrp !== undefined ? String(product.mrp) : '',
      stock: product.stock ?? 0,
      servingSize: product.servingSize || '',
      servingsPerPack: product.servingsPerPack || 30,
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      isActive: Boolean(product.isActive),
      isFeatured: Boolean(product.isFeatured),
      isVegan: Boolean(product.isVegan),
      isVegetarian: product.isVegetarian ?? true,
      requiresDoctorApproval: Boolean(product.requiresDoctorApproval),
    }
  }
  return {
    name: '',
    sku: '',
    categoryId: categories[0]?.id || '',
    form: 'capsule',
    price: '',
    mrp: '',
    stock: 0,
    servingSize: '',
    servingsPerPack: 30,
    shortDescription: '',
    description: '',
    isActive: true,
    isFeatured: false,
    isVegan: false,
    isVegetarian: true,
    requiresDoctorApproval: false,
  }
}

export default function ProductFormModal({
  product = null,
  categories = [],
  onClose,
  onSaveSuccess,
}) {
  const isEditing = Boolean(product?.id)

  const [formData, setFormData] = useState(() => getInitialProductData(product, categories))

  // Image upload state
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [existingImages, setExistingImages] = useState(() => product?.images || [])
  const [deletingImageId, setDeletingImageId] = useState(null)

  // Status & error state
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (5 MB max)
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, image: 'Image file must be 5 MB or smaller.' }))
      return
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setFieldErrors((prev) => ({ ...prev, image: 'Only JPEG, PNG and WebP files are supported.' }))
      return
    }

    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.image
      return next
    })

    setSelectedFile(file)
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
  }

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteExistingImage = async (imageId) => {
    if (!product?.id) return
    setDeletingImageId(imageId)
    try {
      await adminDeleteProductImage(product.id, imageId)
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
    } catch (err) {
      setGeneralError(getErrorMessage(err, 'Failed to remove image.'))
    } finally {
      setDeletingImageId(null)
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.name.trim()) errors.name = 'Product name is required.'
    if (!formData.sku.trim()) errors.sku = 'SKU is required.'
    if (!formData.categoryId) errors.categoryId = 'Category selection is required.'

    const numPrice = Number(formData.price)
    const numMrp = Number(formData.mrp)

    if (!formData.price || isNaN(numPrice) || numPrice <= 0) {
      errors.price = 'Enter a valid selling price greater than 0.'
    }
    if (!formData.mrp || isNaN(numMrp) || numMrp <= 0) {
      errors.mrp = 'Enter a valid MRP (original price) greater than 0.'
    }
    if (numMrp < numPrice) {
      errors.mrp = 'MRP must be greater than or equal to the selling price.'
    }

    const numStock = Number(formData.stock)
    if (formData.stock === '' || isNaN(numStock) || numStock < 0) {
      errors.stock = 'Stock must be a valid non-negative integer.'
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')

    const clientErrors = validateForm()
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }

    setIsSubmitting(true)

    try {
      let savedProduct
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        categoryId: Number(formData.categoryId),
        form: formData.form,
        price: Number(formData.price).toFixed(2),
        mrp: Number(formData.mrp).toFixed(2),
        stock: Math.max(0, parseInt(formData.stock, 10)),
        servingSize: formData.servingSize.trim(),
        servingsPerPack: parseInt(formData.servingsPerPack, 10) || 30,
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        isVegan: formData.isVegan,
        isVegetarian: formData.isVegetarian,
        requiresDoctorApproval: formData.requiresDoctorApproval,
      }

      if (isEditing) {
        savedProduct = await adminUpdateProduct(product.id, payload)
      } else {
        savedProduct = await adminCreateProduct(payload)
      }

      // Upload image if a new one was selected
      if (selectedFile && savedProduct?.id) {
        const replace = isEditing ? replaceExisting : true
        savedProduct = await adminUploadProductImage(savedProduct.id, selectedFile, {
          altText: savedProduct.name,
          replace,
        })
      }

      onSaveSuccess(savedProduct)
      onClose()
    } catch (err) {
      const serverFieldErrors = getFieldErrors(err)
      if (Object.keys(serverFieldErrors).length > 0) {
        setFieldErrors(serverFieldErrors)
      }
      setGeneralError(
        getErrorMessage(
          err,
          'Unable to save product. Please correct the highlighted errors.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate live discount percentage for visual feedback
  const discountPercent =
    formData.mrp && formData.price && Number(formData.mrp) > Number(formData.price)
      ? Math.round(((Number(formData.mrp) - Number(formData.price)) / Number(formData.mrp)) * 100)
      : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-[#e5eae3] shadow-2xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e5eae3] flex items-center justify-between bg-[#fbfaf6]">
          <div>
            <h2 id="product-modal-title" className="text-lg font-bold text-[#173d32]">
              {isEditing ? `Edit Product: ${product.name}` : 'Add New Product to Catalogue'}
            </h2>
            <p className="text-xs text-[#718078] mt-0.5">
              Changes update immediately in both the Admin Portal and Customer Marketplace.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-[#718078] hover:text-[#173d32] hover:bg-[#e8f0e5] transition"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {generalError && (
            <div
              className="p-3.5 rounded-xl bg-[#fee2e2] border border-[#fecaca] text-[#dc2626] text-xs flex items-start gap-2.5"
              role="alert"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#173d32] border-b border-[#e5eae3] pb-1.5">
              Product Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#20342d] mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g. Daily Multivitamin with Zinc"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm text-[#20342d] focus:outline-none focus:ring-1 transition ${
                    fieldErrors.name
                      ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]'
                      : 'border-[#d6ded5] focus:border-[#173d32] focus:ring-[#173d32]'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-[#dc2626] mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20342d] mb-1">
                  Stock Keeping Unit (SKU) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="e.g. NA-MULTI-VITA"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm uppercase text-[#20342d] focus:outline-none focus:ring-1 transition ${
                    fieldErrors.sku
                      ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]'
                      : 'border-[#d6ded5] focus:border-[#173d32] focus:ring-[#173d32]'
                  }`}
                />
                {fieldErrors.sku && (
                  <p className="text-[11px] text-[#dc2626] mt-1">{fieldErrors.sku}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20342d] mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm text-[#20342d] bg-white focus:outline-none focus:ring-1 transition ${
                    fieldErrors.categoryId
                      ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]'
                      : 'border-[#d6ded5] focus:border-[#173d32] focus:ring-[#173d32]'
                  }`}
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.categoryId && (
                  <p className="text-[11px] text-[#dc2626] mt-1">{fieldErrors.categoryId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20342d] mb-1">
                  Supplement Form Factor
                </label>
                <select
                  value={formData.form}
                  onChange={(e) => handleInputChange('form', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d6ded5] text-sm text-[#20342d] bg-white focus:outline-none focus:border-[#173d32] focus:ring-1 focus:ring-[#173d32] transition"
                >
                  {FORM_FACTORS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20342d] mb-1">
                  Serving Size / Frequency
                </label>
                <input
                  type="text"
                  value={formData.servingSize}
                  onChange={(e) => handleInputChange('servingSize', e.target.value)}
                  placeholder="e.g. 1 capsule daily after food"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d6ded5] text-sm text-[#20342d] focus:outline-none focus:border-[#173d32] focus:ring-1 focus:ring-[#173d32] transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Inventory */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#173d32] border-b border-[#e5eae3] pb-1.5 flex items-center justify-between">
              <span>Pricing & Stock Availability</span>
              {discountPercent > 0 && (
                <span className="text-[11px] font-semibold text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                  Customer gets {discountPercent}% off
                </span>
              )}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#20342d] mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="399.00"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm text-[#20342d] focus:outline-none focus:ring-1 transition ${
                    fieldErrors.price
                      ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]'
                      : 'border-[#d6ded5] focus:border-[#173d32] focus:ring-[#173d32]'
                  }`}
                />
                {fieldErrors.price && (
                  <p className="text-[11px] text-[#dc2626] mt-1">{fieldErrors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20342d] mb-1">
                  Original Price / MRP (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.mrp}
                  onChange={(e) => handleInputChange('mrp', e.target.value)}
                  placeholder="499.00"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm text-[#20342d] focus:outline-none focus:ring-1 transition ${
                    fieldErrors.mrp
                      ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]'
                      : 'border-[#d6ded5] focus:border-[#173d32] focus:ring-[#173d32]'
                  }`}
                />
                {fieldErrors.mrp && (
                  <p className="text-[11px] text-[#dc2626] mt-1">{fieldErrors.mrp}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20342d] mb-1">
                  Available Stock (Units) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  placeholder="100"
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm text-[#20342d] focus:outline-none focus:ring-1 transition ${
                    fieldErrors.stock
                      ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]'
                      : 'border-[#d6ded5] focus:border-[#173d32] focus:ring-[#173d32]'
                  }`}
                />
                {fieldErrors.stock && (
                  <p className="text-[11px] text-[#dc2626] mt-1">{fieldErrors.stock}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Product Photo Upload & Replacement */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#173d32] border-b border-[#e5eae3] pb-1.5">
              Product Photography
            </h3>

            {/* Existing images list */}
            {existingImages.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-[#718078]">Current Active Images:</span>
                <div className="flex flex-wrap gap-3">
                  {existingImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative w-20 h-20 rounded-xl border border-[#d6ded5] overflow-hidden group bg-[#f6f4ec]"
                    >
                      <img
                        src={img.url}
                        alt={img.altText || formData.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingImage(img.id)}
                        disabled={deletingImageId === img.id}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                        title="Delete image"
                        aria-label="Delete image"
                      >
                        {deletingImageId === img.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} className="text-[#f87171]" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload new photo input */}
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="product-photo-upload"
              />

              {!previewUrl ? (
                <label
                  htmlFor="product-photo-upload"
                  className="border-2 border-dashed border-[#d6ded5] hover:border-[#173d32] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-[#fbfaf6] hover:bg-[#f6f4ec] transition group text-center"
                >
                  <UploadCloud size={24} className="text-[#718078] group-hover:text-[#173d32] mb-1.5 transition" />
                  <span className="text-xs font-semibold text-[#173d32]">
                    {isEditing ? 'Upload a replacement or additional photo' : 'Choose a product photo to upload'}
                  </span>
                  <span className="text-[11px] text-[#718078] mt-0.5">
                    Supports PNG, JPG, or WebP up to 5 MB
                  </span>
                </label>
              ) : (
                <div className="p-3 bg-[#f6f4ec] rounded-xl border border-[#e2e7df] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={previewUrl}
                      alt="New preview"
                      className="w-14 h-14 object-cover rounded-lg border border-[#d6ded5]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#173d32]">{selectedFile?.name}</div>
                      <div className="text-[11px] text-[#718078]">
                        {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveSelectedFile}
                    className="p-1.5 text-[#718078] hover:text-[#dc2626] rounded-lg transition cursor-pointer"
                    title="Remove selected file"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {isEditing && selectedFile && existingImages.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="rounded text-[#173d32] focus:ring-[#173d32]"
                  />
                  <span className="text-xs text-[#20342d]">
                    Replace existing primary photo with this new upload
                  </span>
                </label>
              )}

              {fieldErrors.image && (
                <p className="text-[11px] text-[#dc2626]">{fieldErrors.image}</p>
              )}
            </div>
          </div>

          {/* Section 4: Descriptions */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#173d32] border-b border-[#e5eae3] pb-1.5">
              Product Copy & Information
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#20342d] mb-1">
                Short Description (Card Summary)
              </label>
              <input
                type="text"
                maxLength={240}
                value={formData.shortDescription}
                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                placeholder="Brief benefit statement visible in catalogue listings"
                className="w-full px-3.5 py-2 rounded-xl border border-[#d6ded5] text-sm text-[#20342d] focus:outline-none focus:border-[#173d32] focus:ring-1 focus:ring-[#173d32] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#20342d] mb-1">
                Detailed Product Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Comprehensive nutritional information, research, and usage guidelines"
                className="w-full px-3.5 py-2 rounded-xl border border-[#d6ded5] text-sm text-[#20342d] focus:outline-none focus:border-[#173d32] focus:ring-1 focus:ring-[#173d32] transition"
              />
            </div>
          </div>

          {/* Section 5: Status & Attributes */}
          <div className="space-y-3 pt-2 border-t border-[#e5eae3]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#173d32]">
              Publication & Attributes
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#e2e7df] bg-[#fbfaf6] cursor-pointer hover:bg-[#f6f4ec] transition">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded text-[#173d32] focus:ring-[#173d32]"
                />
                <span className="text-xs font-medium text-[#20342d]">Published (Live)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#e2e7df] bg-[#fbfaf6] cursor-pointer hover:bg-[#f6f4ec] transition">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="rounded text-[#173d32] focus:ring-[#173d32]"
                />
                <span className="text-xs font-medium text-[#20342d]">Featured Product</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#e2e7df] bg-[#fbfaf6] cursor-pointer hover:bg-[#f6f4ec] transition">
                <input
                  type="checkbox"
                  checked={formData.isVegan}
                  onChange={(e) => handleInputChange('isVegan', e.target.checked)}
                  className="rounded text-[#173d32] focus:ring-[#173d32]"
                />
                <span className="text-xs font-medium text-[#20342d]">100% Vegan</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#e2e7df] bg-[#fbfaf6] cursor-pointer hover:bg-[#f6f4ec] transition">
                <input
                  type="checkbox"
                  checked={formData.isVegetarian}
                  onChange={(e) => handleInputChange('isVegetarian', e.target.checked)}
                  className="rounded text-[#173d32] focus:ring-[#173d32]"
                />
                <span className="text-xs font-medium text-[#20342d]">Vegetarian</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#e2e7df] bg-[#fbfaf6] cursor-pointer hover:bg-[#f6f4ec] transition">
                <input
                  type="checkbox"
                  checked={formData.requiresDoctorApproval}
                  onChange={(e) => handleInputChange('requiresDoctorApproval', e.target.checked)}
                  className="rounded text-[#173d32] focus:ring-[#173d32]"
                />
                <span className="text-xs font-medium text-[#20342d]">Clinical Approval</span>
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-[#e5eae3] flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#718078] hover:text-[#173d32] hover:bg-[#f6f4ec] transition border border-[#e2e7df] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#173d32] text-white hover:bg-[#11241e] active:bg-[#0d1d18] transition flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving product…</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>{isEditing ? 'Save Changes' : 'Create Product'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
