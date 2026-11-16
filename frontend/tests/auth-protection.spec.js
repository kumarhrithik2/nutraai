import { expect, test } from '@playwright/test'

test('dashboard routes redirect to login when development preview mode is disabled', async ({ page }) => {
  for (const path of ['/dashboard', '/dashboard/overview', '/dashboard/orders/reference']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible()
    await expect(page.getByText('Development Preview – Sample Data', { exact: true })).toHaveCount(0)
  }
})

test('admin routes redirect unauthenticated users to /admin/login', async ({ page }) => {
  for (const path of ['/admin', '/admin/products', '/admin/inventory', '/admin/orders']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/admin\/login/)
    await expect(page.getByRole('heading', { level: 1, name: 'Admin Portal' })).toBeVisible()
  }
})

test('admin login page renders professional credentials form with toggle', async ({ page }) => {
  await page.goto('/admin/login')
  await expect(page.getByRole('heading', { level: 1, name: 'Admin Portal' })).toBeVisible()
  await expect(page.getByLabel(/administrator email/i)).toBeVisible()
  await expect(page.getByLabel(/^password$/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /sign in to admin/i })).toBeVisible()

  // Password visibility toggle test
  const passwordInput = page.getByLabel(/^password$/i)
  await expect(passwordInput).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: /show password/i }).click()
  await expect(passwordInput).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: /hide password/i }).click()
  await expect(passwordInput).toHaveAttribute('type', 'password')
})

test('admin login rejects customer account and enforces admin role check', async ({ page }) => {
  // Mock login returning a normal customer account
  await page.route('**/api/v1/auth/login/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access: 'mock-customer-token',
        user: {
          id: 99,
          email: 'customer@example.com',
          role: 'customer',
          full_name: 'Customer User',
          date_joined: new Date().toISOString(),
        },
      }),
    })
  })

  await page.route('**/api/v1/auth/logout/', async (route) => {
    await route.fulfill({ status: 204 })
  })

  await page.goto('/admin/login')
  await page.getByLabel(/administrator email/i).fill('customer@example.com')
  await page.getByLabel(/^password$/i).fill('CustomerPass123!')
  await page.getByRole('button', { name: /sign in to admin/i }).click()

  // Must show access denied and NOT navigate to /admin/products
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByText(/access denied.*administrator privileges/i)).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/login/)
})

test('admin login succeeds for authorized administrator and renders AdminLayout', async ({ page }) => {
  // Mock login returning an authorized admin account
  await page.route('**/api/v1/auth/login/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access: 'mock-admin-token',
        user: {
          id: 1,
          email: 'admin@nutraai.com',
          role: 'admin',
          full_name: 'NutraAI Administrator',
          date_joined: new Date().toISOString(),
        },
      }),
    })
  })

  await page.goto('/admin/login')
  await page.getByLabel(/administrator email/i).fill('admin@nutraai.com')
  await page.getByLabel(/^password$/i).fill('NutraAdmin#Secure2026!')
  await page.getByRole('button', { name: /sign in to admin/i }).click()

  // Must navigate to /admin/products and render the AdminLayout
  await expect(page).toHaveURL(/\/admin\/products/)
  await expect(page.getByRole('heading', { level: 1, name: 'Product Catalogue' })).toBeVisible()
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
})
