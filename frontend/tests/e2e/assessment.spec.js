import { expect, test } from '@playwright/test'

async function answerRequiredAssessmentSteps(page) {
  await page.getByLabel('Age').fill('34')
  await page.getByLabel('Gender').selectOption({ label: 'Prefer not to say' })
  await page.getByLabel('Height in centimetres').fill('170')
  await page.getByLabel('Weight in kilograms').fill('70')
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByLabel('Work type').selectOption('Desk')
  await page.getByLabel('Exercise days per week').fill('0')
  await page.getByRole('button', { name: /3 moderate/i }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByLabel('Diet type').selectOption('Vegetarian')
  await page.getByText('Energy', { exact: true }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  const history = page.locator('.assessment-fields-grid')
  await history.getByText('None', { exact: true }).first().click()
  await page.getByText('No', { exact: true }).click()
  await history.locator('.assessment-field').filter({ hasText: 'Allergies' }).getByText('None', { exact: true }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.locator('label.assessment-consent').nth(0).click()
  await page.locator('label.assessment-consent').nth(1).click()
  await page.getByRole('button', { name: 'Continue' }).click()
}

test('assessment validates incomplete answers and remains on the current step', async ({ page }) => {
  await page.goto('/dashboard/assessment')

  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Enter an age from 18 to 90.', { exact: true })).toBeVisible()
  await expect(page.getByText('Select a gender option.', { exact: true })).toBeVisible()
  await expect(page.getByText('STEP 1 OF 8')).toBeVisible()

  await page.getByLabel('Age').fill('17')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Enter an age from 18 to 90.')).toBeVisible()
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
})

test('completed assessment form does not fabricate a result or persist sensitive responses', async ({ page }) => {
  await page.goto('/dashboard/assessment')

  await answerRequiredAssessmentSteps(page)
  await page.getByRole('button', { name: 'Skip this optional step' }).click()
  await page.getByRole('button', { name: 'Skip this optional step' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Review' })).toBeVisible()
  await expect(page.locator('.assessment-review').getByText('Energy', { exact: true }).last()).toBeVisible()
  await page.getByRole('button', { name: 'Submit assessment' }).click()

  await expect(page.getByRole('status')).toHaveText('Assessment services are unavailable. Your responses remain only on this screen and have not been submitted.')
  await expect(page.getByRole('heading', { level: 2, name: 'Your demo assessment is complete.' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /view sample wellness report/i })).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.length)).toBe(0)

  await page.reload()
  await expect(page.getByText('STEP 1 OF 8')).toBeVisible()
  await expect(page.getByLabel('Age')).toHaveValue('')
})
