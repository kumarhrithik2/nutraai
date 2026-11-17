import { expect, test } from '@playwright/test'

test('product listing filters remain available without showing unverified products', async ({ page }) => {
  await page.goto('/products')

  await expect(page.getByRole('heading', { level: 1, name: /explore product information/i })).toBeVisible()
  const filters = page.getByRole('group', { name: 'Filter products by category' })
  await expect(filters.getByRole('button')).toHaveCount(4)
  await filters.getByRole('button', { name: 'Vitamins' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Catalogue unavailable' })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(0)
  await expect(page.getByText(/product information is currently loaded/i)).toBeVisible()
})

test('product details route handles missing products without inventing product data', async ({ page }) => {
  await page.route('**/api/v1/products/vitamin-d3/', (route) => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }))
  await page.goto('/products/vitamin-d3')

  await expect(page.getByRole('heading', { level: 1, name: 'Product details unavailable' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
  await expect(page.getByRole('button', { name: /add to cart/i })).toHaveCount(0)
})

test('cart does not fabricate products, quantities, or totals', async ({ page }) => {
  await page.goto('/dashboard/cart')

  await expect(page.getByRole('heading', { level: 1, name: 'Your cart' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Cart unavailable' })).toBeVisible()
  await expect(page.getByRole('button', { name: /quantity/i })).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
})

test('checkout cannot collect payment details or create a fake order', async ({ page }) => {
  await page.goto('/dashboard/checkout')

  await expect(page.getByRole('heading', { level: 1, name: 'Checkout' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Checkout unavailable' })).toBeVisible()
  await expect(page.getByText(/no payment details are requested/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /place order|pay now/i })).toHaveCount(0)
  await page.getByRole('link', { name: /return to marketplace/i }).click()
  await expect(page).toHaveURL(/\/dashboard\/marketplace$/)
})

test('order list and order details do not fabricate customer purchases', async ({ page }) => {
  await page.goto('/dashboard/orders')
  await expect(page.getByRole('heading', { level: 2, name: 'Order history unavailable' })).toBeVisible()
  await expect(page.getByRole('link', { name: /browse products|view order/i })).toHaveCount(0)

  await page.goto('/dashboard/orders/reference')
  await expect(page.getByRole('heading', { level: 1, name: 'Order details' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Order details unavailable' })).toBeVisible()
  await expect(page.getByText('reference', { exact: true })).toHaveCount(0)
})
