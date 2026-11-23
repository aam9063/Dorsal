import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const ROUTES = [
  { path: '/', root: 'landing-root' },
  { path: '/subir', root: 'upload-root' },
  { path: '/resultado', root: 'result-root' },
] as const

test.describe('app shell', () => {
  test('renders the landing screen with its call to action', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('landing-root')).toBeVisible()
    await expect(page.getByTestId('landing-cta')).toHaveAttribute('href', '/subir')
  })

  test('reaches the upload screen from the landing call to action', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('landing-cta').click()

    await expect(page.getByTestId('upload-root')).toBeVisible()
    await expect(page).toHaveURL(/\/subir$/)
  })

  test('offers the three routes', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route.path)
      await expect(page.getByTestId(route.root)).toBeVisible()
    }
  })

  test('remembers the chosen theme across reloads', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('theme-option-dark').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await page.getByTestId('theme-option-system').click()
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/)
  })

  test('has no serious or critical accessibility violations', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route.path)
      await expect(page.getByTestId(route.root)).toBeVisible()

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      const blocking = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      )
      expect(
        blocking.map((violation) => `${violation.id}: ${violation.nodes.length} node(s)`),
      ).toEqual([])
    }
  })
})
