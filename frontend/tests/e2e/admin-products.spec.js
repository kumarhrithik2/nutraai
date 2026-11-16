import { expect, test } from '@playwright/test'

const MOCK_PRODUCTS = [
  {
    id: 101,
    name: 'CoQ10 Ubiquinol 100mg',
    slug: 'coq10-ubiquinol-100mg',
    sku: 'NA-COQ10',
    category: 'Vitamins',
    categorySlug: 'vitamins',
    categoryId: 1,
    shortDescription: 'Cardiovascular energy support',
    description: 'High absorption active antioxidant support.',
    form: 'softgel',
    servingSize: '1 softgel daily',
    servingsPerPack: 60,
    price: 499,
    mrp: 599,
    discountPercent: 17,
    stock: 45,
    inStock: true,
    lowStock: false,
    isActive: true,
    isFeatured: true,
    isVegan: false,
    isVegetarian: true,
    requiresDoctorApproval: false,
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 102,
    name: 'Zinc Glycinate 15mg',
    slug: 'zinc-glycinate',
    sku: 'NA-ZINC',
    category: 'Minerals',
    categorySlug: 'minerals',
    categoryId: 2,
    shortDescription: 'Immunity and recovery support',
    description: 'Gentle on stomach chelated zinc.',
    form: 'tablet',
    servingSize: '1 tablet daily',
    servingsPerPack: 30,
    price: 149,
    mrp: 199,
    discountPercent: 25,
    stock: 3, // Low stock
    inStock: true,
    lowStock: true,
    isActive: true,
    isFeatured: false,
    isVegan: true,
    isVegetarian: true,
    requiresDoctorApproval: false,
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 103,
    name: 'Pure Ashwagandha KSM-66',
    slug: 'pure-ashwagandha',
    sku: 'NA-ASHWA',
    category: 'Herbal & Wellness',
    categorySlug: 'herbal-wellness',
    categoryId: 3,
    shortDescription: 'Stress resilience support',
    description: 'Full spectrum root extract.',
    form: 'capsule',
    servingSize: '2 capsules daily',
    servingsPerPack: 30,
    price: 449,
    mrp: 549,
    discountPercent: 18,
    stock: 0, // Out of stock
    inStock: false,
    lowStock: false,
    isActive: false, // Unpublished
    isFeatured: false,
    isVegan: true,
    isVegetarian: true,
    requiresDoctorApproval: false,
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const MOCK_CATEGORIES = [
  { id: 1, name: 'Vitamins', slug: 'vitamins' },
  { id: 2, name: 'Minerals', slug: 'minerals' },
  { id: 3, name: 'Herbal & Wellness', slug: 'herbal-wellness' },
]

test.beforeEach(async ({ page }) => {
  // Mock categories
  await page.route('**/api/v1/categories/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CATEGORIES),
    })
  })

  // Mock admin products listing
  await page.route('**/api/v1/admin/products/?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: MOCK_PRODUCTS.length,
        page: 1,
        page_size: 10,
        total_pages: 1,
        next: null,
        previous: null,
        results: MOCK_PRODUCTS,
      }),
    })
  })

  await page.route('**/api/v1/admin/products/', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: MOCK_PRODUCTS.length,
          page: 1,
          page_size: 10,
          total_pages: 1,
          next: null,
          previous: null,
          results: MOCK_PRODUCTS,
        }),
      })
    } else if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 104,
          name: body.name,
          slug: 'mock-slug',
          sku: body.sku,
          category: { id: 1, name: 'Vitamins', slug: 'vitamins' },
          category_id: 1,
          price: body.price,
          mrp: body.mrp,
          stock: body.stock,
          is_active: true,
          images: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      })
    }
  })
})

test('admin products catalogue renders product rows with pricing and stock badges', async ({ page }) => {
  await page.goto('/admin/products')

  await expect(page.getByRole('heading', { level: 1, name: 'Product Catalogue' })).toBeVisible()

  // Verify rows are rendered
  await expect(page.getByText('CoQ10 Ubiquinol 100mg')).toBeVisible()
  await expect(page.getByText('NA-COQ10')).toBeVisible()
  await expect(page.getByText('45 units')).toBeVisible()
  await expect(page.locator('tbody').getByText('Published').first()).toBeVisible()

  // Verify stock badges: low stock and out of stock
  await expect(page.locator('tbody').getByText(/low: 3 units/i)).toBeVisible()
  await expect(page.locator('tbody').getByText(/out of stock \(0\)/i)).toBeVisible()
  await expect(page.locator('tbody').getByText('Unpublished').first()).toBeVisible()
})

test('validates required fields and MRP >= price in Add Product modal', async ({ page }) => {
  await page.goto('/admin/products')

  // Open Add Product modal
  await page.getByRole('button', { name: /add product/i }).click()
  await expect(page.getByRole('heading', { name: /add new product/i })).toBeVisible()

  // Fill in MRP less than selling price
  await page.getByPlaceholder(/daily multivitamin/i).fill('Test Supplement')
  await page.getByPlaceholder(/na-multi-vita/i).fill('NA-TEST')
  await page.getByPlaceholder('399.00').fill('500.00')
  await page.getByPlaceholder('499.00').fill('400.00') // MRP < Price

  // Submit form
  await page.getByRole('button', { name: /create product/i }).click()

  // Must show MRP error
  await expect(page.getByText(/mrp must be greater than or equal/i)).toBeVisible()
})

test('opens archive confirmation dialog with safe message', async ({ page }) => {
  await page.goto('/admin/products')

  // Click archive button on first product
  const archiveBtn = page.getByRole('button', { name: /archive product/i }).first()
  await archiveBtn.click()

  // Verify confirmation dialog
  await expect(page.getByRole('heading', { name: /archive product/i })).toBeVisible()
  await expect(page.getByText(/safely preserved/i)).toBeVisible()
  await page.getByRole('button', { name: /cancel/i }).click()

  // Dialog closes
  await expect(page.getByRole('heading', { name: /archive product/i })).toHaveCount(0)
})
