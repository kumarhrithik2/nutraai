import { expect, test } from '@playwright/test'

const publicPages = [
  ['/about', 'About NutraAI Labs'],
  ['/products', /explore product information/i],
  ['/how-it-works', /how nutraai works/i],
  ['/membership', /wellness support, on your terms/i],
  ['/contact', /get in touch/i],
]

test('public information pages render their main content and shared footer', async ({ page }) => {
  for (const [path, heading] of publicPages) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page.getByRole('link', { name: 'NutraAI Labs home' })).toBeVisible()
  }
})

test('footer links navigate to existing public and account routes', async ({ page }) => {
  await page.goto('/about')

  const footer = page.getByRole('contentinfo')
  await footer.getByRole('link', { name: 'Products', exact: true }).click()
  await expect(page).toHaveURL(/\/#products$/)
  await expect(page.locator('#products')).toBeInViewport()

  await page.goto('/contact')
  await footer.getByRole('link', { name: 'Member login' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible()
})

test('mobile public navigation opens, navigates, and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const menuButton = page.getByRole('button', { name: 'Open navigation menu' })
  await expect(menuButton).toBeVisible()
  await menuButton.click()
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute('aria-expanded', 'true')

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Products' }).click()
  await expect(page).toHaveURL(/#products$/)
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'false')
})

test('contact form validates required fields and does not claim an unsent message was delivered', async ({ page }) => {
  await page.goto('/contact')

  const submit = page.getByRole('button', { name: 'Send message' })
  await submit.click()
  await expect(page.getByLabel('Full name')).toHaveJSProperty('validity.valueMissing', true)

  await page.getByLabel('Full name').fill('QA Contact')
  await page.getByLabel('Email address').fill('qa.contact@example.test')
  await page.getByLabel('Your message').fill('Question about account services.')
  await submit.click()
  await expect(page.getByRole('status')).toHaveText('Contact services are unavailable. Your message has not been sent.')
})

test('contact details remain available for correction after an unavailable submission', async ({ page }) => {
  await page.goto('/contact')
  await page.getByLabel('Full name').fill('QA Contact')
  await page.getByLabel('Email address').fill('qa.contact@example.test')
  await page.getByLabel('Your message').fill('Please contact me when support is available.')
  await page.getByRole('button', { name: 'Send message' }).click()

  await expect(page.getByRole('status')).toHaveText('Contact services are unavailable. Your message has not been sent.')
  await expect(page.getByLabel('Full name')).toHaveValue('QA Contact')
  await expect(page.getByLabel('Email address')).toHaveValue('qa.contact@example.test')
  await expect(page.getByLabel('Your message')).toHaveValue('Please contact me when support is available.')
})

test('same-origin links on public pages resolve to application pages or existing sections', async ({ page }) => {
  const knownPaths = new Set([
    '/',
    '/about',
    '/products',
    '/how-it-works',
    '/membership',
    '/contact',
    '/login',
    '/register',
    '/forgot-password',
    '/assessment',
    '/products/multivitamin',
    '/products/vitamin-d3',
    '/products/vitamin-b12',
    '/products/vitamin-c',
    '/products/zinc',
    '/products/magnesium',
  ])
  const links = new Map()
  for (const path of ['/', '/about', '/products', '/how-it-works', '/membership', '/contact']) {
    await page.goto(path)
    const pageLinks = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => ({
      label: anchor.innerText.trim() || anchor.getAttribute('aria-label') || '',
      url: new URL(anchor.href),
    })).filter(({ url }) => url.origin === window.location.origin))

    for (const link of pageLinks) {
      links.set(`${link.url.pathname}${link.url.hash}`, link)
    }
  }

  await page.goto('/')
  for (const [target, { label }] of links) {
    const url = new URL(target, 'http://127.0.0.1')
    if (url.hash) {
      await expect(page.locator(url.hash)).toHaveCount(1, { message: `Missing in-app link target "${target}" from "${label}"` })
    }
    expect(knownPaths.has(url.pathname), `Unregistered in-app link "${label}" points to ${target}`).toBe(true)
  }
})
