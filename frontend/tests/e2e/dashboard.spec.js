import { expect, test } from '@playwright/test'

test('development preview mode is clearly labelled and keeps backend actions unavailable', async ({ page }) => {
  await page.goto('/dashboard/overview')

  await expect(page.getByText('Development Preview – Sample Data', { exact: true })).toBeVisible()
  await expect(page.getByText(/No customer identity or personal data is loaded/i)).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Account services are not connected' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0)
})

test('overview and customer navigation open the principal dashboard modules', async ({ page }) => {
  await page.goto('/dashboard/overview')

  await expect(page.getByRole('heading', { level: 1, name: 'Your wellness space.' })).toBeVisible()
  const navigation = page.getByRole('navigation', { name: 'Customer navigation' })
  for (const [label, heading] of [
    ['My health profile', 'My health profile'],
    ['Wellness report', 'Wellness report'],
    ['AI recommendations', 'Recommendations'],
    ['My wellness plan', 'My wellness plan'],
    ['AI wellness assistant', 'AI wellness assistant'],
    ['Progress tracking', 'Wellness progress tracking'],
    ['Notifications', 'Notifications'],
    ['Settings', 'Settings'],
  ]) {
    await navigation.getByRole('link', { name: label }).click()
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  }
})

test('sidebar navigation rows stay aligned when collapsed across desktop and tablet widths', async ({ page }) => {
  const viewports = [
    { width: 1280, height: 800 },
    { width: 900, height: 800 },
  ]

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/dashboard/overview')
    const navigation = page.getByRole('navigation', { name: 'Customer navigation' })
    const links = navigation.locator('.dashboard-nav__link')

    await expect(links).toHaveCount(15)
    const expandedRows = await links.evaluateAll((items) => items.map((item) => {
      const bounds = item.getBoundingClientRect()
      return {
        height: bounds.height,
        top: bounds.top,
        bottom: bounds.bottom,
        labelDisplay: getComputedStyle(item.querySelector('.dashboard-nav__label')).display,
      }
    }))
    for (const [index, row] of expandedRows.entries()) {
      expect(row.height).toBe(42)
      expect(row.labelDisplay).not.toBe('none')
      if (index > 0) expect(row.top).toBeGreaterThanOrEqual(expandedRows[index - 1].bottom)
    }

    await page.getByRole('button', { name: 'Collapse sidebar' }).click()

    const rows = await links.evaluateAll((items) => items.map((item) => {
      const bounds = item.getBoundingClientRect()
      const icon = item.querySelector('svg').getBoundingClientRect()
      return {
        height: bounds.height,
        top: bounds.top,
        bottom: bounds.bottom,
        iconCenterOffset: Math.abs((icon.left + icon.right) / 2 - (bounds.left + bounds.right) / 2),
        labelDisplay: getComputedStyle(item.querySelector('.dashboard-nav__label')).display,
        title: item.title,
        label: item.getAttribute('aria-label'),
      }
    }))

    const captionsHidden = await navigation.locator('.sidebar-caption').evaluateAll((items) => items.every((item) => getComputedStyle(item).display === 'none'))
    expect(rows).toHaveLength(15)
    expect(captionsHidden).toBe(true)
    for (const [index, row] of rows.entries()) {
      expect(row.height).toBe(42)
      expect(row.iconCenterOffset).toBeLessThanOrEqual(1)
      expect(row.labelDisplay).toBe('none')
      expect(row.title).toBe(row.label)
      if (index > 0) expect(row.top).toBeGreaterThanOrEqual(rows[index - 1].bottom)
    }

    const separators = await navigation.locator('.dashboard-nav-group').evaluateAll((groups) => groups.map((group) => ({
      borderTop: getComputedStyle(group).borderTopWidth,
      firstItemOffset: group.querySelector('.dashboard-nav__link').getBoundingClientRect().top - group.getBoundingClientRect().top,
    })))
    expect(separators[0].borderTop).toBe('0px')
    for (const separator of separators.slice(1)) {
      expect(separator.borderTop).toBe('1px')
      expect(separator.firstItemOffset).toBeGreaterThanOrEqual(7)
    }

    const paths = await links.evaluateAll((items) => items.map((item) => item.getAttribute('href')))
    for (const path of paths) {
      await navigation.locator(`a[href="${path}"]`).click()
      await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
    }
  }

  for (const viewport of [{ width: 768, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/dashboard/overview')
    await page.getByRole('button', { name: 'Open dashboard menu' }).click()
    const navigation = page.getByRole('navigation', { name: 'Customer navigation' })
    const rows = await navigation.locator('.dashboard-nav__link').evaluateAll((items) => items.map((item) => {
      const bounds = item.getBoundingClientRect()
      return {
        height: bounds.height,
        top: bounds.top,
        bottom: bounds.bottom,
        labelDisplay: getComputedStyle(item.querySelector('.dashboard-nav__label')).display,
      }
    }))

    const captionsVisible = await navigation.locator('.sidebar-caption').evaluateAll((items) => items.every((item) => getComputedStyle(item).display !== 'none'))
    expect(rows).toHaveLength(15)
    expect(captionsVisible).toBe(true)
    for (const [index, row] of rows.entries()) {
      expect(row.height).toBe(42)
      expect(row.labelDisplay).not.toBe('none')
      if (index > 0) expect(row.top).toBeGreaterThanOrEqual(rows[index - 1].bottom)
    }
  }
})

test('recommendation tabs switch while both states avoid fabricated plans or products', async ({ page }) => {
  await page.goto('/dashboard/recommendations')

  await expect(page.getByRole('tab', { name: 'Recommended products' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('heading', { level: 2, name: 'No recommendations available' })).toBeVisible()
  await page.getByRole('tab', { name: 'Wellness plan' }).click()
  await expect(page.getByText('No wellness plan available')).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(0)
})

test('assistant validates a question and never returns a scripted response', async ({ page }) => {
  await page.goto('/dashboard/assistant')

  const input = page.getByRole('textbox', { name: 'Your question' })
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByRole('status')).toHaveText('Enter a question before continuing.')

  await input.fill('How can I build a routine?')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByRole('status')).toHaveText('The assistant service is unavailable. Your question has not been sent.')
  await expect(page.getByText('How can I build a routine?', { exact: true })).toBeVisible()
  await expect(page.getByText(/A useful first step is choosing one small action/i)).toHaveCount(0)
})

test('progress selector is usable while no check-ins or measurements are fabricated', async ({ page }) => {
  await page.goto('/dashboard/progress')

  await page.getByLabel('Time period').selectOption('7')
  await expect(page.getByRole('heading', { level: 2, name: 'No progress data available' })).toBeVisible()
  await expect(page.getByText(/measurements or check-ins are being recorded/i)).toBeVisible()
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
})

test('notification and settings controls show unavailable states without claiming persistence', async ({ page }) => {
  await page.goto('/dashboard/overview')
  await page.getByRole('button', { name: 'Notifications' }).click()
  await expect(page.getByRole('dialog', { name: 'Notifications' })).toContainText('Notification service unavailable')

  await page.getByRole('navigation', { name: 'Customer navigation' }).getByRole('link', { name: 'Settings' }).click()
  await page.getByRole('checkbox', { name: /product and platform updates/i }).check()
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByRole('status')).toHaveText('Settings service is unavailable. Your preferences have not been saved.')
  await page.reload()
  await expect(page.getByRole('checkbox', { name: /product and platform updates/i })).not.toBeChecked()
})
