import { expect, test } from '@playwright/test'

test('companion appears once on public routes and dashboard preview', async ({ page }) => {
  for (const route of ['/about', '/dashboard/overview']) {
    await page.goto(route)
    await expect(page.getByRole('button', { name: /Ask NutraAI.*open assistant/i })).toHaveCount(1)
  }
})

test('robot opens the accessible chat and focuses the message field', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Ask NutraAI.*open assistant/i }).click()

  await expect(page.getByRole('dialog', { name: 'NutraAI wellness assistant' })).toBeVisible()
  await expect(page.getByText('AI service unavailable')).toBeVisible()
  await expect(page.getByLabel('Your message')).toBeFocused()
  await expect(page.getByRole('img', { name: 'Three-dimensional NutraAI robot companion' })).toBeVisible()
})

test('Three.js runtime is loaded only after the companion is opened', async ({ page }) => {
  test.setTimeout(60_000)
  const threeRequests = []
  page.on('request', (request) => {
    if (/three-vendor|react-three-fiber|RobotCharacter\.jsx/.test(request.url())) threeRequests.push(request.url())
  })

  await page.goto('/')
  expect(threeRequests).toHaveLength(0)
  await page.getByRole('button', { name: /Ask NutraAI.*open assistant/i }).click()
  await expect(page.locator('.ai-companion__scene')).toBeVisible({ timeout: 15_000 })
  await expect.poll(() => threeRequests.length).toBeGreaterThan(0)
})

test('empty messages show validation feedback without creating a conversation entry', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Ask NutraAI.*open assistant/i }).click()
  await page.getByRole('button', { name: 'Send message' }).click()

  await expect(page.getByRole('status')).toHaveText('Enter a message before sending.')
  await expect(page.getByRole('log', { name: 'Conversation' }).getByText('You', { exact: true })).toHaveCount(0)
})

test('sent messages stay in-session and never receive a fabricated AI response', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Ask NutraAI.*open assistant/i }).click()
  await page.getByLabel('Your message').fill('How can I improve my daily nutrition?')
  await page.getByRole('button', { name: 'Send message' }).click()

  await expect(page.getByRole('log', { name: 'Conversation' })).toContainText('How can I improve my daily nutrition?')
  await expect(page.getByRole('status')).toHaveText('Your message is visible in this session, but the AI service is not connected yet.')
  await expect(page.getByRole('log', { name: 'Conversation' }).locator('.ai-companion__message')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Clear conversation' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear conversation' }).click()
  await expect(page.getByRole('log', { name: 'Conversation' }).locator('.ai-companion__message')).toHaveCount(0)
})

test('minimize and close return to the floating robot and preserve the session', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Ask NutraAI.*open assistant/i }).click()
  await page.getByLabel('Your message').fill('A private in-session question.')
  await page.getByRole('button', { name: 'Send message' }).click()
  await page.getByRole('button', { name: 'Minimize assistant' }).click()

  await expect(page.getByRole('dialog', { name: 'NutraAI wellness assistant' })).toHaveCount(0)
  await page.getByRole('button', { name: /Ask NutraAI.*open assistant/i }).click()
  await expect(page.getByRole('log', { name: 'Conversation' })).toContainText('A private in-session question.')
  await page.getByRole('button', { name: 'Close assistant' }).click()
  await expect(page.getByRole('dialog', { name: 'NutraAI wellness assistant' })).toHaveCount(0)
})

test('Escape closes the chat and restores focus to its launcher', async ({ page }) => {
  await page.goto('/')
  const launcher = page.getByRole('button', { name: /Ask NutraAI.*open assistant/i })
  await launcher.click()
  await expect(page.getByRole('dialog', { name: 'NutraAI wellness assistant' })).toBeVisible()
  await page.keyboard.press('Escape')

  await expect(page.getByRole('dialog', { name: 'NutraAI wellness assistant' })).toHaveCount(0)
  await expect(launcher).toBeFocused()
})

test('the widget persists without duplication during dashboard route navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dashboard/overview')
  await page.getByRole('button', { name: /Ask NutraAI.*open assistant/i }).click()
  await page.getByRole('button', { name: 'Open dashboard menu' }).click()
  await page.getByRole('dialog', { name: 'Application sidebar' }).getByRole('link', { name: 'My health profile' }).click()

  await expect(page).toHaveURL(/\/dashboard\/profile$/)
  await expect(page.getByRole('dialog', { name: 'NutraAI wellness assistant' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Ask NutraAI.*assistant open/i })).toHaveCount(1)
})

test('the companion fits a mobile viewport and dashboard bottom navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const route of ['/', '/dashboard/overview']) {
    await page.goto(route)
    const launcher = page.getByRole('button', { name: /Ask NutraAI.*open assistant/i })
    const bounds = await launcher.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390)

    await launcher.click()
    await page.waitForTimeout(700)
    const panel = await page.locator('.ai-companion__dialog').boundingBox()
    expect(panel).not.toBeNull()
    expect(panel.x).toBeGreaterThanOrEqual(0)
    expect(panel.x + panel.width).toBeLessThanOrEqual(390)
    expect(panel.y).toBeGreaterThanOrEqual(0)
    await page.getByRole('button', { name: 'Close assistant' }).click()
  }
})

test('reduced-motion preference disables companion animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const animationDuration = await page.locator('.ai-companion__trigger-avatar').evaluate((element) => getComputedStyle(element).animationDuration)
  expect(Number.parseFloat(animationDuration)).toBeLessThan(0.001)
  await page.getByRole('button', { name: /Ask NutraAI.*open assistant/i }).click()
  await expect(page.getByRole('dialog', { name: 'NutraAI wellness assistant' })).toBeVisible()
})

test('a static robot illustration is shown when WebGL is unavailable', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function getContext(contextType, ...args) {
      if (contextType === 'webgl' || contextType === 'webgl2' || contextType === 'experimental-webgl') return null
      return originalGetContext.call(this, contextType, ...args)
    }
  })

  await page.goto('/')
  await page.getByRole('button', { name: /Ask NutraAI.*open assistant/i }).click()
  await expect(page.locator('.ai-companion__scene-fallback')).toBeVisible()
  expect(pageErrors).toEqual([])
})
