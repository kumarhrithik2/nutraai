import { expect, test } from '@playwright/test'

const vitaminD = {
  id: 1,
  slug: 'vitamin-d3',
  name: 'Vitamin D3',
  short_description: 'Everyday vitamin D support.',
  category: { name: 'Vitamins', slug: 'vitamins' },
  form: 'capsule',
  serving_size: '1 capsule',
  price: '999.00',
  mrp: '1199.00',
  discount_percent: 17,
  in_stock: true,
  low_stock: false,
  is_vegan: true,
  is_vegetarian: true,
  is_featured: true,
  image: null,
}

const zinc = {
  ...vitaminD,
  id: 2,
  slug: 'zinc-complex',
  name: 'Zinc Complex',
  short_description: 'Zinc for everyday routines.',
  price: '499.00',
  mrp: '499.00',
  discount_percent: 0,
  in_stock: false,
  is_featured: false,
}

function pageResponse(results, { page = 1, totalPages = 1, count = results.length } = {}) {
  return {
    count,
    page,
    page_size: 12,
    total_pages: totalPages,
    next: page < totalPages ? `?page=${page + 1}` : null,
    previous: page > 1 ? `?page=${page - 1}` : null,
    results,
  }
}

async function mockCategories(page) {
  await page.route('**/api/v1/categories/', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, name: 'Vitamins', slug: 'vitamins', product_count: 1 }]),
  }))
}

test('marketplace renders published products with price, stock, and image fallback', async ({ page }) => {
  await mockCategories(page)
  const authorizationHeaders = []
  await page.route('**/api/v1/products/**', (route) => {
    authorizationHeaders.push(route.request().headers().authorization)
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse([vitaminD, zinc])),
    })
  })
  await page.goto('/dashboard/marketplace')

  await expect(page.getByRole('heading', { level: 1, name: 'Products & marketplace' })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(2)
  await expect(page.getByRole('heading', { level: 2, name: 'Vitamin D3' })).toBeVisible()
  await expect(page.getByText(/₹999/)).toBeVisible()
  await expect(page.getByText('17% off')).toBeVisible()
  await expect(page.getByText('Out of stock')).toBeVisible()
  await expect(page.getByLabel('Product image unavailable')).toHaveCount(2)
  expect(authorizationHeaders.every((header) => header === undefined)).toBe(true)
})

test('marketplace sends supported category, search, sort, and page parameters', async ({ page }) => {
  await mockCategories(page)
  const requests = []
  await page.route('**/api/v1/products/**', async (route) => {
    const url = new URL(route.request().url())
    const params = url.searchParams
    requests.push(Object.fromEntries(params.entries()))
    const currentPage = Number(params.get('page') || 1)
    const result = currentPage === 2 ? zinc : vitaminD
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse([result], { page: currentPage, totalPages: 2, count: 13 })),
    })
  })
  await page.goto('/dashboard/marketplace')

  await page.getByLabel('Category').selectOption('vitamins')
  await expect.poll(() => requests.some((params) => params.category === 'vitamins')).toBe(true)
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Zinc Complex' })).toBeVisible()
  await expect.poll(() => requests.some((params) => params.page === '2')).toBe(true)
  await page.getByLabel('Sort by').selectOption('price_desc')
  await expect.poll(() => requests.some((params) => params.ordering === 'price_desc')).toBe(true)
  await page.getByRole('searchbox', { name: 'Search products' }).fill('vitamin d')
  await page.getByRole('search').getByRole('button', { name: 'Search' }).click()
  await expect.poll(() => requests.some((params) => params.q === 'vitamin d')).toBe(true)
})

test('marketplace supports retry and distinguishes empty catalogues from no search matches', async ({ page }) => {
  await mockCategories(page)
  let shouldSucceed = false
  await page.route('**/api/v1/products/**', async (route) => {
    if (!shouldSucceed) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pageResponse([])),
    })
  })
  await page.goto('/dashboard/marketplace')

  await expect(page.getByRole('heading', { level: 2, name: 'Products could not be loaded' })).toBeVisible()
  shouldSucceed = true
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'No products available yet' })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search products' }).fill('no match')
  await page.getByRole('search').getByRole('button', { name: 'Search' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'No matching products' })).toBeVisible()
})

test('product details use the public catalogue response and gracefully show optional information', async ({ page }) => {
  await page.route('**/api/v1/products/vitamin-d3/', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ...vitaminD,
      description: 'Full product description.',
      benefits: ['Supports daily wellness.'],
      usage_directions: 'Take one capsule daily.',
      warnings: 'Keep out of reach of children.',
      servings_per_pack: 60,
      requires_doctor_approval: false,
      images: [],
      ingredients: [{ name: 'Vitamin D3', amount: '1000 IU' }],
      allergens: [],
    }),
  }))
  await page.goto('/products/vitamin-d3')

  await expect(page.getByRole('heading', { level: 1, name: 'Vitamin D3' })).toBeVisible()
  await expect(page.getByText('Full product description.')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Benefits' })).toBeVisible()
  await expect(page.getByText('Take one capsule daily.')).toBeVisible()
  await expect(page.getByText('Vitamin D3 — 1000 IU')).toBeVisible()
  await expect(page.getByLabel('Product image unavailable')).toBeVisible()
  await expect(page.getByRole('button', { name: /add to cart/i })).toHaveCount(0)
})
