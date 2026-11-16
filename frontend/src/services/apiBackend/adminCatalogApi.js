/**
 * Section: Admin Product Catalogue
 * Pages: Standalone Admin Portal (/admin/products)
 * Authentication: Enforced on all endpoints (requires JWT + role='admin')
 */
import { apiClient, compact, money, normalizePage } from './core.js'

/**
 * Backend admin product shape -> normalized frontend object.
 */
export function normalizeAdminProduct(p) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    category: p.category?.name || '',
    categorySlug: p.category?.slug || '',
    categoryId: p.category_id || p.category?.id || null,
    shortDescription: p.short_description || '',
    description: p.description || '',
    benefits: Array.isArray(p.benefits) ? p.benefits : [],
    usageDirections: p.usage_directions || '',
    warnings: p.warnings || '',
    form: p.form || 'capsule',
    servingSize: p.serving_size || '',
    servingsPerPack: p.servings_per_pack || 30,
    price: money(p.price),
    mrp: money(p.mrp),
    discountPercent: p.discount_percent || 0,
    stock: p.stock ?? 0,
    inStock: Boolean(p.in_stock),
    lowStock: Boolean(p.low_stock),
    isActive: Boolean(p.is_active),
    isFeatured: Boolean(p.is_featured),
    isVegan: Boolean(p.is_vegan),
    isVegetarian: Boolean(p.is_vegetarian),
    requiresDoctorApproval: Boolean(p.requires_doctor_approval),
    images: (p.images || []).map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.alt_text,
      sortOrder: img.sort_order,
      createdAt: img.created_at,
    })),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }
}

/**
 * Serializes frontend camelCase form data to backend snake_case format.
 */
function serializeProductPayload(payload) {
  return compact({
    name: payload.name?.trim(),
    slug: payload.slug?.trim(),
    sku: payload.sku?.trim(),
    category_id: payload.categoryId ?? payload.category_id,
    short_description: payload.shortDescription ?? payload.short_description,
    description: payload.description,
    benefits: payload.benefits,
    usage_directions: payload.usageDirections ?? payload.usage_directions,
    warnings: payload.warnings,
    form: payload.form,
    serving_size: payload.servingSize ?? payload.serving_size,
    servings_per_pack: payload.servingsPerPack ?? payload.servings_per_pack,
    price: payload.price !== undefined && payload.price !== null && payload.price !== '' ? String(payload.price) : undefined,
    mrp: payload.mrp !== undefined && payload.mrp !== null && payload.mrp !== '' ? String(payload.mrp) : undefined,
    stock: payload.stock !== undefined && payload.stock !== null && payload.stock !== '' ? Number(payload.stock) : undefined,
    is_active: payload.isActive ?? payload.is_active,
    is_featured: payload.isFeatured ?? payload.is_featured,
    is_vegan: payload.isVegan ?? payload.is_vegan,
    is_vegetarian: payload.isVegetarian ?? payload.is_vegetarian,
    requires_doctor_approval: payload.requiresDoctorApproval ?? payload.requires_doctor_approval,
  })
}

/**
 * Purpose: list and filter products across all states for admin management.
 * Endpoint: GET /admin/products/
 * Params: { search, category, isActive, stockStatus, ordering, page, pageSize }
 * Returns: Promise<{ count, page, pageSize, totalPages, hasNext, hasPrevious, results: AdminProduct[] }>
 */
export async function adminListProducts({
  search,
  category,
  isActive,
  stockStatus,
  ordering,
  page = 1,
  pageSize = 20,
} = {}) {
  const params = compact({
    q: search?.trim(),
    category: category && category !== 'All' ? category : undefined,
    is_active: isActive !== undefined && isActive !== 'all' ? isActive : undefined,
    stock_status: stockStatus && stockStatus !== 'all' ? stockStatus : undefined,
    ordering,
    page,
    page_size: pageSize,
  })

  const { data } = await apiClient.get('/admin/products/', { params })
  return normalizePage(data, normalizeAdminProduct)
}

/**
 * Purpose: get single product full details by ID.
 * Endpoint: GET /admin/products/{id}/
 * Params: id (number | string)
 * Returns: Promise<AdminProduct>
 */
export async function adminGetProduct(id) {
  const { data } = await apiClient.get(`/admin/products/${encodeURIComponent(id)}/`)
  return normalizeAdminProduct(data)
}

/**
 * Purpose: create a new product.
 * Endpoint: POST /admin/products/
 * Params: payload: object (camelCase or snake_case)
 * Returns: Promise<AdminProduct>
 */
export async function adminCreateProduct(payload) {
  const body = serializeProductPayload(payload)
  const { data } = await apiClient.post('/admin/products/', body)
  return normalizeAdminProduct(data)
}

/**
 * Purpose: update an existing product.
 * Endpoint: PATCH /admin/products/{id}/
 * Params: id: number | string, payload: object
 * Returns: Promise<AdminProduct>
 */
export async function adminUpdateProduct(id, payload) {
  const body = serializeProductPayload(payload)
  const { data } = await apiClient.patch(`/admin/products/${encodeURIComponent(id)}/`, body)
  return normalizeAdminProduct(data)
}

/**
 * Purpose: upload or replace a product image via multipart/form-data.
 * Endpoint: POST /admin/products/{id}/images/
 * Params: id: number | string, file: File | Blob, options: { altText?: string, sortOrder?: number, replace?: boolean }
 * Returns: Promise<AdminProduct>
 */
export async function adminUploadProductImage(id, file, { altText = '', sortOrder = 0, replace = false } = {}) {
  const formData = new FormData()
  formData.append('image', file)
  if (altText) formData.append('alt_text', altText)
  if (sortOrder !== undefined && sortOrder !== null) formData.append('sort_order', String(sortOrder))
  if (replace) formData.append('replace', 'true')

  const { data } = await apiClient.post(
    `/admin/products/${encodeURIComponent(id)}/images/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
  return normalizeAdminProduct(data)
}

/**
 * Purpose: delete a product photo.
 * Endpoint: DELETE /admin/products/{id}/images/{imageId}/
 * Params: id: number | string, imageId: number | string
 * Returns: Promise<void>
 */
export async function adminDeleteProductImage(id, imageId) {
  await apiClient.delete(
    `/admin/products/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}/`,
  )
}

/**
 * Purpose: toggle publication status (publish / unpublish / soft archive).
 * Endpoint: PATCH /admin/products/{id}/status/
 * Params: id: number | string, isActive: boolean
 * Returns: Promise<AdminProduct>
 */
export async function adminTogglePublish(id, isActive) {
  const { data } = await apiClient.patch(
    `/admin/products/${encodeURIComponent(id)}/status/`,
    { is_active: Boolean(isActive) },
  )
  return normalizeAdminProduct(data)
}

/**
 * Purpose: archive a product safely (soft-delete, sets is_active=false).
 * Endpoint: DELETE /admin/products/{id}/
 * Params: id: number | string
 * Returns: Promise<void>
 */
export async function adminArchiveProduct(id) {
  await apiClient.delete(`/admin/products/${encodeURIComponent(id)}/`)
}
