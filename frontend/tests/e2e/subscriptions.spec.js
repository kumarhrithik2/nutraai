import { expect, test } from '@playwright/test'
import { formatMembershipPrice, membershipPlans } from '../../src/services/membershipPlans.js'

test('only Free, Monthly, and Yearly public plans are displayed at the approved prices', async ({ page }) => {
  await page.goto('/membership')

  const cards = page.locator('.membership-card')
  await expect(cards).toHaveCount(3)
  await expect(page.locator('.plan-name')).toHaveText(['Free', 'Monthly', 'Yearly'])
  await expect(cards.nth(0)).toContainText('₹0')
  await expect(cards.nth(1)).toContainText('₹999')
  await expect(cards.nth(1)).toContainText('per month')
  await expect(cards.nth(2)).toContainText('₹10,190')
  await expect(cards.nth(2)).toContainText('per year')
  expect(membershipPlans.map(({ id, price }) => [id, price])).toEqual([['free', 0], ['monthly', 999], ['yearly', 10190]])
  expect(formatMembershipPrice(10190)).toBe('₹10,190')
})

test('monthly and yearly benefits match and remain distinct from Free entitlements', async ({ page }) => {
  await page.goto('/membership')

  const cards = page.locator('.membership-card')
  const freeCard = cards.nth(0)
  const monthlyCard = cards.nth(1)
  const yearlyCard = cards.nth(2)
  await expect(freeCard).toContainText('Basic health assessment')
  await expect(freeCard).not.toContainText('Personalized wellness plan')
  await expect(monthlyCard).toContainText('Personalized wellness plan')
  await expect(yearlyCard).toContainText('Personalized wellness plan')
  expect(membershipPlans.find(({ id }) => id === 'monthly').featureLabels)
    .toEqual(membershipPlans.find(({ id }) => id === 'yearly').featureLabels)
  const planBenefit = membershipPlans.find(({ id }) => id === 'monthly').features.personalizedPlan
  expect(planBenefit).toBe(true)
  expect(membershipPlans.find(({ id }) => id === 'free').features.personalizedPlan).toBe(false)
})

test('public membership selection is unavailable and cannot create an account or subscription', async ({ page }) => {
  await page.goto('/membership')

  await expect(page.locator('.membership-card .plan-button')).toHaveText(['Unavailable', 'Unavailable', 'Unavailable'])
  await expect(page.locator('.membership-card .plan-button').first()).toBeDisabled()
  await expect(page.getByText(/no changes will be made/i)).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
})

test('membership plan comparison is interactive but does not activate a plan', async ({ page }) => {
  await page.goto('/dashboard/subscriptions/membership')

  const yearlyCard = page.locator('.membership-card').filter({ hasText: 'Yearly' })
  await yearlyCard.locator('.plan-button').click()
  await expect(yearlyCard.getByRole('button', { name: 'Selected' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('status')).toContainText('no changes were made')
  await expect(page.getByRole('button', { name: /activate|subscribe|start trial/i })).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
})

test('membership offers no trial or simulated authorization controls', async ({ page }) => {
  await page.goto('/dashboard/subscriptions/membership')

  await expect(page.getByRole('button', { name: /trial|payment|activate/i })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: /trial|payment/i })).toHaveCount(0)
  await expect(page.getByText(/trial|renewal|payment history/i)).toHaveCount(0)
})

test('subscription overview does not fabricate current customer status or renewal details', async ({ page }) => {
  await page.goto('/dashboard/subscriptions')

  await expect(page.getByRole('heading', { level: 2, name: 'Subscription details unavailable' })).toBeVisible()
  await expect(page.getByText(/current membership status, renewal date/i)).toBeVisible()
  await expect(page.getByText(/Free Membership/)).toHaveCount(0)
})

test('membership cancellation and renewal actions are not available without subscription services', async ({ page }) => {
  await page.goto('/dashboard/subscriptions/membership')

  await expect(page.getByRole('button', { name: /cancel|renew|retry|pause/i })).toHaveCount(0)
  await expect(page.getByText(/cancellation scheduled|paid access is suspended|renewal succeeded/i)).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
})

test('scheduled plan changes are not presented as completed or pending transactions', async ({ page }) => {
  await page.goto('/dashboard/subscriptions/membership')

  await page.locator('.membership-card').nth(1).locator('.plan-button').click()
  await expect(page.getByRole('status')).toContainText('no changes were made')
  await expect(page.getByText(/scheduled change|effective at renewal/i)).toHaveCount(0)
})

test('supplement subscriptions show an unavailable state without a fake delivery form', async ({ page }) => {
  await page.goto('/dashboard/subscriptions/supplements')

  await expect(page.getByRole('heading', { level: 2, name: 'Supplement subscriptions unavailable' })).toBeVisible()
  await expect(page.getByLabel('Delivery address')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /save delivery|skip next|pause|resume/i })).toHaveCount(0)
})

test('supplement management does not show fabricated product subscriptions', async ({ page }) => {
  await page.goto('/dashboard/subscriptions/supplements')

  await expect(page.getByText('Daily Multivitamin')).toHaveCount(0)
  await expect(page.getByText(/no delivery schedule or supplement subscription data is loaded/i)).toBeVisible()
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
})

test('billing history does not generate invoices, payment records, or payment success', async ({ page }) => {
  await page.goto('/dashboard/subscriptions/billing')

  await expect(page.getByRole('heading', { level: 2, name: 'Billing history unavailable' })).toBeVisible()
  await expect(page.locator('.order-card, .payment-record')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
})

test('subscription overview navigation reaches independent membership, delivery, and billing views', async ({ page }) => {
  await page.goto('/dashboard/subscriptions')

  const navigation = page.getByRole('navigation', { name: 'Subscription settings' })
  await navigation.getByRole('link', { name: 'Membership' }).click()
  await expect(page.locator('.membership-card')).toHaveCount(3)
  await navigation.getByRole('link', { name: 'Supplement deliveries' }).click()
  await expect(page.getByText('Supplement subscriptions unavailable')).toBeVisible()
  await navigation.getByRole('link', { name: 'Billing history' }).click()
  await expect(page.getByText('Billing history unavailable')).toBeVisible()
})

test('free and paid membership options have no extra trial plan', async ({ page }) => {
  await page.goto('/dashboard/subscriptions/membership')

  await expect(page.locator('.membership-card')).toHaveCount(3)
  await expect(page.getByText(/trial/i)).toHaveCount(0)
  await expect(page.locator('.plan-name')).toHaveText(['Free', 'Monthly', 'Yearly'])
})
