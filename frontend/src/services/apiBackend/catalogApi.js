/**
 * Section: Product catalogue
 * Pages: ProductsPage, ProductDetailsPage, MarketplacePage, home/Products.jsx.
 * Public: no login needed (requests skip the Authorization header).
 */
import { apiClient, compact, money, normalizePage } from './core.js'

/**
 * Backend product -> the shape the pages use. List results fill the first group; the detail
 * endpoint also fills the "detail only" fields (undefined in lists).
 */
export function normalizeProduct(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.short_description,
    category: p.category?.name || '',
    categorySlug: p.category?.slug || '',
    form: p.form,
    servingSize: p.serving_size,
    price: money(p.price),
    mrp: money(p.mrp),
    discountPercent: p.discount_percent,
    stock: typeof p.stock === 'number' ? p.stock : null,
    inStock: p.in_stock,
    lowStock: p.low_stock,
    isVegan: p.is_vegan,
    isVegetarian: p.is_vegetarian,
    isFeatured: p.is_featured,
    image: p.image?.url || null,
    imageAlt: p.image?.alt_text || p.name,
    // detail only
    sku: p.sku,
    longDescription: p.description,
    benefits: p.benefits,
    usageDirections: p.usage_directions,
    warnings: p.warnings,
    servingsPerPack: p.servings_per_pack,
    requiresDoctorApproval: p.requires_doctor_approval,
    images: p.images?.map((i) => ({ url: i.url, alt: i.alt_text })),
    ingredients: p.ingredients,
    allergens: p.allergens,
  }
}

/**
 * Purpose: list and search products.
 * Endpoint: GET /products/
 * Params (all optional): { search, category (slug or 'All'), minPrice, maxPrice, inStock, vegan,
 *   vegetarian, featured, form (string | string[]), excludeAllergens (string[] of slugs),
 *   ordering ('featured' | 'price_asc' | 'price_desc' | 'name' | 'newest'), page = 1, pageSize = 20 }
 * Returns: Promise<{ count, page, pageSize, totalPages, hasNext, hasPrevious, results: Product[] }>
 */
export async function listProducts({
  search,
  category,
  minPrice,
  maxPrice,
  inStock,
  vegan,
  vegetarian,
  featured,
  form,
  excludeAllergens,
  ordering,
  page = 1,
  pageSize = 20,
} = {}) {
  const params = compact({
    q: search?.trim(),
    category: category && category !== 'All' ? category : undefined,
    min_price: minPrice,
    max_price: maxPrice,
    in_stock: inStock,
    vegan,
    vegetarian,
    featured,
    form: Array.isArray(form) ? form.join(',') : form,
    exclude_allergens: Array.isArray(excludeAllergens) ? excludeAllergens.join(',') : excludeAllergens,
    ordering,
    page,
    page_size: pageSize,
  })
  const { data } = await apiClient.get('/products/', { params, skipAuth: true })
  return normalizePage(data, normalizeProduct)
}

/**
 * Purpose: one product with full details (ingredients, allergens, images, directions).
 * Endpoint: GET /products/{slug}/
 * Params: slug: string (the /products/:slug route param)
 * Returns: Promise<Product>   Errors: 404 when missing or inactive.
 */
export async function getProduct(slug) {
  const { data } = await apiClient.get(`/products/${encodeURIComponent(slug)}/`, { skipAuth: true })
  return normalizeProduct(data)
}

/**
 * Purpose: categories for the filter buttons.
 * Endpoint: GET /categories/
 * Params: none
 * Returns: Promise<[{ id, name, slug, description, productCount }]>
 */
export async function listCategories() {
  const { data } = await apiClient.get('/categories/', { skipAuth: true })
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    productCount: c.product_count,
  }))
}

/**
 * Purpose: filter options with counts (categories, forms) and the price range.
 * Endpoint: GET /products/facets/
 * Params: none
 * Returns: Promise<{ categories: [{ slug, name, count }], forms: [{ value, count }], price: { min, max } }>
 */
export async function getProductFacets() {
  const { data } = await apiClient.get('/products/facets/', { skipAuth: true })
  return {
    categories: data.categories,
    forms: data.forms,
    price: { min: money(data.price.min), max: money(data.price.max) },
  }
}
