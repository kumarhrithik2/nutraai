import { expect, test } from '@playwright/test'

test('homepage loads with public navigation and no personal wellness results', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: /your health journey/i })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
  await expect(page.getByText('No personal data displayed')).toBeVisible()
})

test('public navigation links reach their homepage sections', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'How it works' }).click()
  await expect(page).toHaveURL(/#how-it-works$/)
  await expect(page.locator('#how-it-works')).toBeInViewport()

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Products' }).click()
  await expect(page).toHaveURL(/#products$/)
  await expect(page.locator('#products')).toBeInViewport()
})

test('login and registration pages display their validated forms', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible()
  await expect(page.getByPlaceholder('Email address')).toBeVisible()
  await expect(page.getByPlaceholder('Password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible()

  await page.goto('/register')
  await expect(page.getByRole('heading', { level: 1, name: 'Create your account' })).toBeVisible()
  await expect(page.getByPlaceholder('Full name')).toBeVisible()
  await expect(page.getByPlaceholder('Email address')).toBeVisible()
  await expect(page.getByPlaceholder('Confirm password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()
})

test('invalid login input displays validation feedback without navigation', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('Email address').fill('not-an-email')
  await page.getByPlaceholder('Password').fill('short')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()

  await expect(page.getByText('Enter a valid email address.', { exact: true })).toBeVisible()
  await expect(page.getByText('Use at least 8 characters.', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('workspace modules are navigable and display unavailable states without authentication fixtures', async ({ page }) => {
  for (const [path, title] of [
    ['/dashboard', 'Development Preview – Sample Data'],
    ['/dashboard/overview', 'Development Preview – Sample Data'],
    ['/dashboard/profile', 'My health profile'],
    ['/dashboard/assessment', 'Health assessment'],
    ['/dashboard/report', 'Wellness report'],
    ['/dashboard/recommendations', 'Recommendations'],
    ['/dashboard/wellness-plan', 'My wellness plan'],
    ['/dashboard/assistant', 'AI wellness assistant'],
    ['/dashboard/marketplace', 'Products & marketplace'],
    ['/dashboard/cart', 'Your cart'],
    ['/dashboard/checkout', 'Checkout'],
    ['/dashboard/orders', 'My orders'],
    ['/dashboard/subscriptions', 'Subscriptions'],
    ['/dashboard/subscriptions/membership', 'Subscriptions'],
    ['/dashboard/subscriptions/supplements', 'Subscriptions'],
    ['/dashboard/subscriptions/billing', 'Subscriptions'],
    ['/dashboard/notifications', 'Notifications'],
    ['/dashboard/settings', 'Settings'],
  ]) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  }
})

test('membership page displays only Free, Monthly, and Yearly plans', async ({ page }) => {
  await page.goto('/membership')

  await expect(page.getByRole('heading', { level: 1, name: 'Wellness support, on your terms.' })).toBeVisible()
  await expect(page.locator('.plan-name')).toHaveText(['Free', 'Monthly', 'Yearly'])
  await expect(page.locator('.membership-card').nth(0)).toContainText('₹0')
  await expect(page.locator('.membership-card').nth(1)).toContainText('₹999')
  await expect(page.locator('.membership-card').nth(2)).toContainText('₹10,190')
  await expect(page.locator('.membership-card .plan-button')).toHaveText(['Unavailable', 'Unavailable', 'Unavailable'])
})

test('core public and workspace pages have no uncaught browser JavaScript errors', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const path of ['/', '/about', '/products', '/how-it-works', '/membership', '/contact', '/login', '/register', '/forgot-password', '/dashboard/overview']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  expect(errors).toEqual([])
})
