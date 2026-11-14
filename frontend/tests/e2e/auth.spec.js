import { expect, test } from '@playwright/test'

test('login rejects empty and malformed inputs with feedback', async ({ page }) => {
  await page.goto('/login')

  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page.getByText('Enter your email address.', { exact: true })).toBeVisible()
  await expect(page.getByText('Enter your password.', { exact: true })).toBeVisible()

  await page.getByPlaceholder('Email address').fill('invalid-address')
  await page.getByPlaceholder('Password').fill('short')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page.getByText('Enter a valid email address.', { exact: true })).toBeVisible()
  await expect(page.getByText('Use at least 8 characters.', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('registration validates missing values and mismatched passwords', async ({ page }) => {
  await page.goto('/register')

  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByText('Enter your name.', { exact: true })).toBeVisible()
  await expect(page.getByText('Enter your email address.', { exact: true })).toBeVisible()
  await expect(page.getByText('Enter your password.', { exact: true })).toBeVisible()
  await expect(page.getByText('Confirm your password.', { exact: true })).toBeVisible()
  await expect(page.getByText('Please accept the Terms & Conditions and Privacy Policy.', { exact: true })).toBeVisible()

  await page.getByPlaceholder('Full name').fill('QA Register')
  await page.getByPlaceholder('Email address').fill('qa.register@example.test')
  await page.getByPlaceholder('Password', { exact: true }).fill('qa-password-123')
  await page.getByPlaceholder('Confirm password').fill('different-password')
  await page.getByRole('checkbox', { name: /i agree to the terms/i }).check()
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByText('Passwords do not match.', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/register$/)
})

test('valid login input does not authenticate or persist an identity when account services are unavailable', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('Email address').fill('qa.login@example.test')
  await page.getByPlaceholder('Password').fill('qa-password-123')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()

  await expect(page.getByRole('status')).toContainText('No account was created and no login was attempted.')
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => localStorage.getItem('nutraai-management-demo'))).toBeNull()
})

test('forgot password validates email and does not claim that a reset was sent', async ({ page }) => {
  await page.goto('/forgot-password')
  await expect(page.getByRole('heading', { level: 1, name: 'Reset your password' })).toBeVisible()
  await page.getByRole('button', { name: 'Request reset' }).click()
  await expect(page.getByText('Enter your email address.', { exact: true })).toBeVisible()
  await page.getByPlaceholder('Email address').fill('qa.login@example.test')
  await page.getByRole('button', { name: 'Request reset' }).click()
  await expect(page.getByRole('status')).toHaveText('Password recovery is unavailable. No reset request was sent.')
})
