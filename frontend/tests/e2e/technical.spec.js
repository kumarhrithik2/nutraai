import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('mobile dashboard navigation opens, navigates, and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dashboard/overview')

  const menuButton = page.getByRole('button', { name: 'Open dashboard menu' })
  await expect(menuButton).toBeVisible()
  await menuButton.click()
  await expect(page.getByRole('dialog', { name: 'Application sidebar' })).toBeVisible()
  await page.getByRole('dialog', { name: 'Application sidebar' }).getByRole('link', { name: 'My health profile' }).click()
  await expect(page).toHaveURL(/\/dashboard\/profile$/)
  await expect(page.getByRole('button', { name: 'Open dashboard menu' })).toHaveAttribute('aria-expanded', 'false')
})

test('representative public and dashboard pages fit a mobile viewport without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ['/', '/about', '/products', '/membership', '/contact']) {
    await page.goto(path)
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(dimensions.content, `Horizontal overflow on ${path}: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.viewport)
  }

  for (const path of ['/dashboard/overview', '/dashboard/profile', '/dashboard/assessment', '/dashboard/subscriptions', '/dashboard/orders/reference']) {
    await page.goto(path)
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(dimensions.content, `Horizontal overflow on ${path}: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.viewport)
  }
})

test('core public and dashboard pages have no uncaught JavaScript or failed app requests', async ({ page }) => {
  const errors = []
  const failures = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('requestfailed', (request) => failures.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`))

  for (const path of ['/', '/about', '/products', '/how-it-works', '/membership', '/contact', '/login', '/register', '/forgot-password']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }

  for (const path of [
    '/dashboard/overview',
    '/dashboard/profile',
    '/dashboard/assessment',
    '/dashboard/report',
    '/dashboard/recommendations',
    '/dashboard/wellness-plan',
    '/dashboard/assistant',
    '/dashboard/progress',
    '/dashboard/marketplace',
    '/dashboard/cart',
    '/dashboard/checkout',
    '/dashboard/orders',
    '/dashboard/orders/reference',
    '/dashboard/subscriptions',
    '/dashboard/subscriptions/membership',
    '/dashboard/subscriptions/supplements',
    '/dashboard/subscriptions/billing',
    '/dashboard/notifications',
    '/dashboard/settings',
  ]) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }

  expect(errors).toEqual([])
  expect(failures).toEqual([])
})

test('WCAG 2.1 A/AA automated accessibility checks on representative application pages', async ({ page }) => {
  const violations = []
  const publicPaths = ['/', '/about', '/products', '/how-it-works', '/membership', '/contact', '/login', '/register', '/forgot-password']
  for (const path of publicPaths) {
    await page.goto(path)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    violations.push(...results.violations.map(({ id, impact, description, nodes }) => ({
      path,
      id,
      impact,
      description,
      targets: nodes.map((node) => node.target),
    })))
  }

  for (const path of ['/dashboard/overview', '/dashboard/profile', '/dashboard/assessment', '/dashboard/assistant', '/dashboard/subscriptions', '/dashboard/orders/reference']) {
    await page.goto(path)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    violations.push(...results.violations.map(({ id, impact, description, nodes }) => ({
      path,
      id,
      impact,
      description,
      targets: nodes.map((node) => node.target),
    })))
  }

  expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
})
