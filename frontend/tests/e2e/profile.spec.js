import { expect, test } from '@playwright/test'

async function openProfile(page) {
  await page.goto('/dashboard/profile')
  await expect(page.getByRole('heading', { level: 1, name: 'My health profile' })).toBeVisible()
}

async function createImageFile(page, type, name) {
  const image = await page.evaluate(async (mimeType) => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 2
    const context = canvas.getContext('2d')
    context.fillStyle = '#52705b'
    context.fillRect(0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType))
    if (!blob) return null
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
    return { type: blob.type, data: dataUrl.split(',')[1] }
  }, type)
  expect(image?.type).toBe(type)
  return { name, mimeType: type, buffer: Buffer.from(image.data, 'base64') }
}

function profilePictureInput(page) {
  return page.locator('#basic-information').getByLabel('Choose image')
}

function profilePictureImage(page) {
  return page.locator('#basic-information').getByRole('img', { name: 'Selected profile preview' })
}

test('profile page does not display fabricated customer details', async ({ page }) => {
  await openProfile(page)
  await expect(page.getByLabel('Full name')).toHaveValue('')
  await expect(page.getByLabel('Email address')).toHaveValue('')
  await expect(page.getByLabel('Phone number')).toHaveValue('')
  await expect(page.getByText('No customer profile is loaded.')).toBeVisible()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Enter your full name.' })).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: 'Enter your email address.' })).toBeVisible()
})

test('profile dropdown opens and closes with Escape and its toggle', async ({ page }) => {
  await openProfile(page)
  await page.getByRole('button', { name: 'Open profile menu' }).click()
  await expect(page.getByRole('menu', { name: 'Profile menu' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'View Profile' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu', { name: 'Profile menu' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Open profile menu' }).click()
  await page.getByRole('button', { name: 'Close profile menu' }).click()
  await expect(page.getByRole('menu', { name: 'Profile menu' })).toHaveCount(0)
})

test('profile dropdown dismisses on outside click', async ({ page }) => {
  await openProfile(page)
  await page.getByRole('button', { name: 'Open profile menu' }).click()
  await expect(page.getByRole('menu', { name: 'Profile menu' })).toBeVisible()
  await page.getByRole('button', { name: 'Close open menu' }).click()
  await expect(page.getByRole('menu', { name: 'Profile menu' })).toHaveCount(0)
})

test('profile form validates required and malformed account fields', async ({ page }) => {
  await openProfile(page)
  await page.getByLabel('Email address').fill('not-an-email')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Enter your full name.' })).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: 'Enter a valid email address.' })).toBeVisible()
  await expect(page.getByLabel('Email address')).toHaveAttribute('aria-invalid', 'true')
})

test('profile edits stay in memory and do not claim to save or persist', async ({ page }) => {
  await openProfile(page)
  await page.getByLabel('Full name').fill('QA Profile')
  await page.getByLabel('Email address').fill('qa.profile@example.test')
  await page.getByLabel('Phone number').fill('+1 555 123 4567')
  await page.getByLabel('General wellness focus').selectOption({ label: 'Building a consistent routine' })
  await page.getByRole('button', { name: 'Save changes' }).click()

  await expect(page.getByRole('status')).toHaveText('Profile services are unavailable. Your changes have not been saved.')
  await expect(page.getByLabel('Full name')).toHaveValue('QA Profile')
  await page.reload()
  await expect(page.getByLabel('Full name')).toHaveValue('')
  await expect(page.getByLabel('Email address')).toHaveValue('')
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
})

test('JPG, JPEG, PNG, and WebP profile pictures can be previewed but not uploaded', async ({ page }) => {
  await openProfile(page)
  for (const [type, name] of [
    ['image/jpeg', 'profile.jpg'],
    ['image/jpeg', 'profile.jpeg'],
    ['image/png', 'profile.png'],
    ['image/webp', 'profile.webp'],
  ]) {
    await page.getByLabel('Full name').fill('QA Profile')
    await page.getByLabel('Email address').fill('qa.profile@example.test')
    await profilePictureInput(page).setInputFiles(await createImageFile(page, type, name))
    await expect(page.getByRole('status')).toHaveText('Image preview selected. It has not been uploaded.')
    await expect(profilePictureImage(page)).toBeVisible()
    await expect(profilePictureImage(page)).toHaveAttribute('src', /^blob:/)
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('status')).toHaveText('Profile services are unavailable. Your changes have not been saved.')
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'My health profile' })).toBeVisible()
    await expect(profilePictureImage(page)).toHaveCount(0)
  }
})

test('unsupported profile picture formats and files larger than 5 MB are rejected', async ({ page }) => {
  await openProfile(page)
  await profilePictureInput(page).setInputFiles({ name: 'profile.gif', mimeType: 'image/gif', buffer: Buffer.from('not-an-image') })
  await expect(page.getByRole('status')).toHaveText('Choose a JPG, PNG, or WebP image.')
  await expect(profilePictureImage(page)).toHaveCount(0)

  await profilePictureInput(page).setInputFiles({
    name: 'too-large.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  })
  await expect(page.getByRole('status')).toHaveText('Choose an image that is 5 MB or smaller.')
  await expect(profilePictureImage(page)).toHaveCount(0)
})

test('removing a profile picture preview clears it without saving local customer data', async ({ page }) => {
  await openProfile(page)
  await profilePictureInput(page).setInputFiles(await createImageFile(page, 'image/png', 'profile.png'))
  await expect(profilePictureImage(page)).toBeVisible()
  await page.getByRole('button', { name: 'Remove preview' }).click()
  await expect(profilePictureImage(page)).toHaveCount(0)
  await expect(page.getByRole('status')).toHaveText('Image preview removed. No profile picture was uploaded.')
  await page.reload()
  await expect(profilePictureImage(page)).toHaveCount(0)
})

test('profile menu account link opens login without creating a local session', async ({ page }) => {
  await openProfile(page)
  await page.getByRole('button', { name: 'Open profile menu' }).click()
  await page.getByRole('menuitem', { name: 'Connect account' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
})

test('workspace routes remain usable but show no personal details without account services', async ({ page }) => {
  for (const path of ['/dashboard/profile', '/dashboard/overview']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/account services are not connected|no customer profile is loaded/i).first()).toBeVisible()
  }
})
