import { expect, test } from '@playwright/test'

test('dashboard routes redirect to login when development preview mode is disabled', async ({ page }) => {
  for (const path of ['/dashboard', '/dashboard/overview', '/dashboard/orders/reference']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible()
    await expect(page.getByText('Development Preview – Sample Data', { exact: true })).toHaveCount(0)
  }
})
